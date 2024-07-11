// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Inject, Injectable } from '@nestjs/common'
import mongoose, { Model } from 'mongoose'
import {
    InjectCourseInstanceModel,
    InjectCourseModel,
    InjectPhaseInstanceModel,
    InjectPhaseModel,
    InjectTaskInstanceModel,
    InjectTaskModel
} from '@/core/data/data.module'
import { ActionData } from '@/decorators/action.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { capitalize } from '@/common/capitalize.util'
import { Task } from '@/core/data/schemas/task.schema'
import { InjectTaskDeclaration } from '@/core/business/task/task-declaration.module'
import { TaskInstance } from '@/core/data/schemas/task-instance.schema'
import { getObjectId } from '@/common/reference-prop.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { Course } from '@/core/data/schemas/course.schema'
import { CourseInstance } from '@/core/data/schemas/course-instance.schema'
import { PhaseData } from '@/decorators/phase.decorator'
import { Phase } from '@/core/data/schemas/phase.schema'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'
import * as winston from 'winston'
import { Log } from '@/core/data/schemas/log.schema'
import { ErrorService } from '@/core/business/error/error.service'

export interface ITaskActionService<T = any, K extends keyof T = any> {
    doAction(
        id: string | mongoose.Schema.Types.ObjectId,
        args: T[K] extends (arg: infer A, ...rest: any) => any ? A : never,
        logger: winston.Logger,
        log?: Log
    ): Promise<T[K] extends () => infer R ? R : never>
}

export function taskActionServiceInjectionToken(
    courseName: string,
    phaseName: string,
    taskName: string,
    actionName: string
) {
    return `${capitalize(courseName)}${capitalize(phaseName)}${capitalize(taskName)}${capitalize(actionName)}TaskActionService`
}

export function InjectTaskActionService(courseName: string, phaseName: string, taskName: string, actionName: string) {
    return Inject(taskActionServiceInjectionToken(courseName, phaseName, taskName, actionName))
}

export function synthesizeTaskActionService(
    courseData: CourseData,
    phaseData: PhaseData,
    taskData: TaskData,
    actionData: ActionData
) {
    @Injectable()
    class SynthesizedTaskActionService implements ITaskActionService {
        pQueue: import('p-queue').default | null = null

        constructor(
            @InjectTaskModel(taskData) readonly taskModel: Model<Task>,
            @InjectPhaseModel(phaseData) readonly phaseModel: Model<Phase>,
            @InjectCourseModel(courseData) readonly courseModel: Model<Course>,
            @InjectTaskInstanceModel(taskData) readonly taskInstanceModel: Model<TaskInstance>,
            @InjectPhaseInstanceModel(phaseData) readonly phaseInstanceModel: Model<PhaseInstance>,
            @InjectCourseInstanceModel(courseData) readonly courseInstanceModel: Model<CourseInstance>,
            @InjectTaskDeclaration(courseData, phaseData, taskData) readonly taskService: any,
            readonly errorService: ErrorService
        ) {}

        public async doAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            logger.info(
                `Running action ${courseData.name}.${phaseData.name}.${taskData.name}.${actionData.name} for task${actionData.instance ? ' instance' : ''}: ${id}`
            )
            if (actionData.concurrencyMode === 'queue') {
                if (!this.pQueue) {
                    const PQueue = (await eval(`import('p-queue')`)).default as typeof import('p-queue').default
                    this.pQueue = new PQueue({ concurrency: 1 })
                }

                return await this.pQueue.add(() => {
                    if (actionData.instance) {
                        return this.doTaskInstanceAction(id, args, logger, log)
                    } else {
                        return this.doTaskAction(id, args, logger, log)
                    }
                })
            } else {
                if (actionData.instance) {
                    return this.doTaskInstanceAction(id, args, logger, log)
                } else {
                    return this.doTaskAction(id, args, logger, log)
                }
            }
        }

        async doTaskAction(id: string | mongoose.Schema.Types.ObjectId, args: any, logger: winston.Logger, log?: Log) {
            const task =
                actionData.concurrencyMode === 'locks'
                    ? await this.taskModel
                          .findOneAndUpdate({ _id: id, locked: false, blocked: false }, { locked: true })
                          .exec()
                    : await this.taskModel.findOne({ _id: id, blocked: false }).exec()

            try {
                if (!task) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Task not found or locked or blocked')
                }

                const phase = await this.phaseModel.findOne({ _id: getObjectId(task.phase), blocked: false }).lean()
                if (!phase) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Phase not found or blocked')
                }

                const course = await this.courseModel.findOne({ _id: getObjectId(phase.course), blocked: false }).lean()
                if (!course) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Course not found or blocked')
                }

                const argumentsToPass = []
                for (const param of actionData.params) {
                    switch (param.type) {
                        case 'argument':
                            argumentsToPass[param.index] = args
                            break
                        case 'course':
                            argumentsToPass[param.index] = course
                            break
                        case 'phase':
                            argumentsToPass[param.index] = phase
                            break
                        case 'task':
                            argumentsToPass[param.index] = task
                            break
                        case 'logger':
                            argumentsToPass[param.index] = logger
                            break
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Unknown argument type')
                    }
                }

                const result = await this.taskService[actionData.name](...argumentsToPass)

                if (actionData.concurrencyMode !== 'none') {
                    task.history.push({
                        event: actionData.name,
                        successful: true,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await task.save()
                }

                return result
            } catch (e) {
                logger.error(e.stack)

                if (actionData.concurrencyMode !== 'none') {
                    task?.history.push({
                        event: actionData.name,
                        successful: false,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await task?.save()
                }

                if (task) {
                    const phase = await this.phaseModel.findOne({ _id: getObjectId(task.phase) }).lean()

                    if (phase) {
                        const course = await this.courseModel.findOne({ _id: getObjectId(phase.course) }).lean()

                        if (course) {
                            await this.errorService.persistError(course._id, {
                                course: course._id,
                                targetContext: task._id,
                                log: log?._id ?? null,
                                message: `Error in task action ${courseData.name}.${phaseData.name}.${taskData.name}.${actionData.name} for ${task._id}`,
                                stack: e.stack
                            })
                        }
                    }
                }

                throw e
            } finally {
                if (actionData.concurrencyMode === 'locks') {
                    await this.taskModel.findOneAndUpdate({ _id: id }, { locked: false }).exec()
                }
            }
        }

        async doTaskInstanceAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            const taskInstance =
                actionData.concurrencyMode === 'locks'
                    ? await this.taskInstanceModel
                          .findOneAndUpdate({ _id: id, locked: false, blocked: false }, { locked: true })
                          .exec()
                    : await this.taskInstanceModel.findOne({ _id: id, blocked: false }).exec()

            try {
                if (!taskInstance) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Task instance not found or locked or blocked')
                }

                const phaseInstances = await this.phaseInstanceModel
                    .find({
                        _id: taskInstance.phaseInstances?.map(getObjectId)
                    })
                    .lean()
                if (phaseInstances.length === 0 || phaseInstances.some((phaseInstance) => phaseInstance.blocked)) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Phase instances not found or blocked')
                }

                const courseInstances = await this.courseInstanceModel
                    .find({
                        _id: phaseInstances.flatMap((phaseInstance) => phaseInstance.courseInstances?.map(getObjectId))
                    })
                    .lean()
                if (courseInstances.length === 0 || courseInstances.some((courseInstance) => courseInstance.blocked)) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Course instances not found or blocked')
                }

                const task = await this.taskModel
                    .findOne({
                        _id: getObjectId(taskInstance.task),
                        blocked: false
                    })
                    .lean()
                if (!task) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Task not found or blocked')
                }

                const phase = await this.phaseModel.findOne({ _id: getObjectId(task.phase), blocked: false }).lean()
                if (!phase) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Phase not found or blocked')
                }

                const course = await this.courseModel
                    .findOne({
                        _id: getObjectId(phase.course),
                        blocked: false
                    })
                    .lean()
                if (!course) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Course not found or blocked')
                }

                const argumentsToPass = []
                for (const param of actionData.params) {
                    switch (param.type) {
                        case 'argument':
                            argumentsToPass[param.index] = args
                            break
                        case 'course':
                            argumentsToPass[param.index] = course
                            break
                        case 'phase':
                            argumentsToPass[param.index] = phase
                            break
                        case 'task':
                            argumentsToPass[param.index] = task
                            break
                        case 'course-instance':
                            argumentsToPass[param.index] = courseInstances
                            break
                        case 'phase-instance':
                            argumentsToPass[param.index] = phaseInstances
                            break
                        case 'task-instance':
                            argumentsToPass[param.index] = taskInstance
                            break
                        case 'logger':
                            argumentsToPass[param.index] = logger
                            break
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Unknown argument type')
                    }
                }

                const result = await this.taskService[actionData.name](...argumentsToPass)

                if (actionData.concurrencyMode !== 'none') {
                    taskInstance.history.push({
                        event: actionData.name,
                        successful: true,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await taskInstance.save()
                }

                return result
            } catch (e) {
                logger.error(e.stack)

                if (actionData.concurrencyMode !== 'none') {
                    taskInstance?.history.push({
                        event: actionData.name,
                        successful: false,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await taskInstance?.save()
                }

                if (taskInstance) {
                    const task = await this.taskModel.findOne({ _id: getObjectId(taskInstance.task) }).lean()

                    if (task) {
                        const phase = await this.phaseModel.findOne({ _id: getObjectId(task.phase) }).lean()

                        if (phase) {
                            const course = await this.courseModel.findOne({ _id: getObjectId(phase.course) }).lean()

                            if (course) {
                                await this.errorService.persistError(course._id, {
                                    course: course._id,
                                    targetContext: taskInstance._id,
                                    log: log?._id ?? null,
                                    message: `Error in task instance action ${courseData.name}.${phaseData.name}.${taskData.name}.${actionData.name} for ${taskInstance._id}`,
                                    stack: e.stack
                                })
                            }
                        }
                    }
                }

                throw e
            } finally {
                if (actionData.concurrencyMode === 'locks') {
                    await this.taskInstanceModel.findOneAndUpdate({ _id: id }, { locked: false }).exec()
                }
            }
        }
    }

    Object.defineProperty(SynthesizedTaskActionService, 'name', {
        value: taskActionServiceInjectionToken(courseData.name, phaseData.name, taskData.name, actionData.name)
    })

    return SynthesizedTaskActionService
}
