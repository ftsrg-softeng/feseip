// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Inject, Injectable, Type } from '@nestjs/common'
import mongoose, { Model } from 'mongoose'
import { InjectCourseInstanceModel, InjectCourseModel } from '@/core/data/data.module'
import { ActionData } from '@/decorators/action.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { capitalize } from '@/common/capitalize.util'
import { Course } from '@/core/data/schemas/course.schema'
import { InjectCourseDeclaration } from '@/core/business/course/course-declaration.module'
import { CourseInstance } from '@/core/data/schemas/course-instance.schema'
import { getObjectId } from '@/common/reference-prop.decorator'
import winston from 'winston'
import { Log } from '@/core/data/schemas/log.schema'
import { ErrorService } from '@/core/business/error/error.service'

export interface ICourseActionService<T extends Type<unknown> = any, K extends keyof T = any> {
    doAction(
        id: string | mongoose.Schema.Types.ObjectId,
        args: T[K] extends (arg: infer A, ...rest: any) => any ? A : never,
        logger: winston.Logger,
        log?: Log
    ): Promise<T[K] extends () => infer R ? R : never>
}

export function courseActionServiceInjectionToken(courseName: string, actionName: string) {
    return `${capitalize(courseName)}${capitalize(actionName)}CourseActionService`
}

export function InjectCourseActionService(courseName: string, actionName: string) {
    return Inject(courseActionServiceInjectionToken(courseName, actionName))
}

export function synthesizeCourseActionService(courseData: CourseData, actionData: ActionData) {
    @Injectable()
    class SynthesizedCourseActionService implements ICourseActionService {
        pQueue: import('p-queue').default | null = null

        constructor(
            @InjectCourseModel(courseData) readonly courseModel: Model<Course>,
            @InjectCourseInstanceModel(courseData) readonly courseInstanceModel: Model<CourseInstance>,
            @InjectCourseDeclaration(courseData) readonly courseService: any,
            readonly errorService: ErrorService
        ) {}

        public async doAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            logger.info(
                `Running action ${courseData.name}.${actionData.name} for course${actionData.instance ? ' instance' : ''}: ${id}`
            )
            if (actionData.concurrencyMode === 'queue') {
                if (!this.pQueue) {
                    const PQueue = (await eval(`import('p-queue')`)).default as typeof import('p-queue').default
                    this.pQueue = new PQueue({ concurrency: 1 })
                }

                return await this.pQueue.add(() => {
                    if (actionData.instance) {
                        return this.doCourseInstanceAction(id, args, logger, log)
                    } else {
                        return this.doCourseAction(id, args, logger, log)
                    }
                })
            } else {
                if (actionData.instance) {
                    return this.doCourseInstanceAction(id, args, logger, log)
                } else {
                    return this.doCourseAction(id, args, logger, log)
                }
            }
        }

        async doCourseAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            const course =
                actionData.concurrencyMode === 'locks'
                    ? await this.courseModel
                          .findOneAndUpdate({ _id: id, locked: false, blocked: false }, { locked: true })
                          .exec()
                    : await this.courseModel.findOne({ _id: id, blocked: false }).exec()

            try {
                if (!course) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Course not found or locked or blocked')
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
                        case 'logger':
                            argumentsToPass[param.index] = logger
                            break
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Unknown argument type')
                    }
                }

                const result = await this.courseService[actionData.name](...argumentsToPass)

                if (actionData.concurrencyMode !== 'none') {
                    course.history.push({
                        event: actionData.name,
                        successful: true,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await course.save()
                }

                return result
            } catch (e) {
                logger.error(e.stack)

                if (actionData.concurrencyMode !== 'none') {
                    course?.history.push({
                        event: actionData.name,
                        successful: false,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await course?.save()
                }

                if (course) {
                    await this.errorService.persistError(course._id, {
                        course: course._id,
                        targetContext: course._id,
                        log: log?._id ?? null,
                        message: `Error in course action ${courseData.name}.${actionData.name} for ${course._id}`,
                        stack: e.stack
                    })
                }

                throw e
            } finally {
                if (actionData.concurrencyMode === 'locks') {
                    await this.courseModel.findOneAndUpdate({ _id: id }, { locked: false }).exec()
                }
            }
        }

        async doCourseInstanceAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            const courseInstance =
                actionData.concurrencyMode === 'locks'
                    ? await this.courseInstanceModel
                          .findOneAndUpdate({ _id: id, locked: false, blocked: false }, { locked: true })
                          .exec()
                    : await this.courseInstanceModel.findOne({ _id: id, blocked: false }).exec()

            try {
                if (!courseInstance) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Course instance not found or locked or blocked')
                }

                const course = await this.courseModel
                    .findOne({
                        _id: getObjectId(courseInstance.course),
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
                        case 'course-instance':
                            argumentsToPass[param.index] = courseInstance
                            break
                        case 'logger':
                            argumentsToPass[param.index] = logger
                            break
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Unknown argument type')
                    }
                }

                const result = await this.courseService[actionData.name](...argumentsToPass)

                if (actionData.concurrencyMode !== 'none') {
                    courseInstance.history.push({
                        event: actionData.name,
                        successful: true,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await courseInstance.save()
                }

                return result
            } catch (e) {
                logger.error(e.stack)

                if (actionData.concurrencyMode !== 'none') {
                    courseInstance?.history.push({
                        event: actionData.name,
                        successful: false,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await courseInstance?.save()
                }

                if (courseInstance) {
                    const course = await this.courseModel
                        .findOne({
                            _id: getObjectId(courseInstance.course)
                        })
                        .lean()

                    if (course) {
                        await this.errorService.persistError(course._id, {
                            course: course._id,
                            targetContext: courseInstance._id,
                            log: log?._id ?? null,
                            message: `Error in course instance action ${courseData.name}.${actionData.name} for ${courseInstance._id}`,
                            stack: e.stack
                        })
                    }
                }

                throw e
            } finally {
                if (actionData.concurrencyMode === 'locks') {
                    await this.courseInstanceModel.findOneAndUpdate({ _id: id }, { locked: false }).exec()
                }
            }
        }
    }

    Object.defineProperty(SynthesizedCourseActionService, 'name', {
        value: courseActionServiceInjectionToken(courseData.name, actionData.name)
    })

    return SynthesizedCourseActionService
}
