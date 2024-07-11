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
    InjectPhaseModel
} from '@/core/data/data.module'
import { ActionData } from '@/decorators/action.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { capitalize } from '@/common/capitalize.util'
import { Phase } from '@/core/data/schemas/phase.schema'
import { InjectPhaseDeclaration } from '@/core/business/phase/phase-declaration.module'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'
import { getObjectId } from '@/common/reference-prop.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { Course } from '@/core/data/schemas/course.schema'
import { CourseInstance } from '@/core/data/schemas/course-instance.schema'
import * as winston from 'winston'
import { Log } from '@/core/data/schemas/log.schema'
import { ErrorService } from '@/core/business/error/error.service'

export interface IPhaseActionService<T = any, K extends keyof T = any> {
    doAction(
        id: string | mongoose.Schema.Types.ObjectId,
        args: T[K] extends (arg: infer A, ...rest: any) => any ? A : never,
        logger: winston.Logger,
        log?: Log
    ): Promise<T[K] extends () => infer R ? R : never>
}

export function phaseActionServiceInjectionToken(courseName: string, phaseName: string, actionName: string) {
    return `${capitalize(courseName)}${capitalize(phaseName)}${capitalize(actionName)}PhaseActionService`
}

export function InjectPhaseActionService(courseName: string, phaseName: string, actionName: string) {
    return Inject(phaseActionServiceInjectionToken(courseName, phaseName, actionName))
}

export function synthesizePhaseActionService(courseData: CourseData, phaseData: PhaseData, actionData: ActionData) {
    @Injectable()
    class SynthesizedPhaseActionService implements IPhaseActionService {
        pQueue: import('p-queue').default | null = null

        constructor(
            @InjectPhaseModel(phaseData) readonly phaseModel: Model<Phase>,
            @InjectCourseModel(courseData) readonly courseModel: Model<Course>,
            @InjectPhaseInstanceModel(phaseData) readonly phaseInstanceModel: Model<PhaseInstance>,
            @InjectCourseInstanceModel(courseData) readonly courseInstanceModel: Model<CourseInstance>,
            @InjectPhaseDeclaration(courseData, phaseData) readonly phaseService: any,
            readonly errorService: ErrorService
        ) {}

        public async doAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            logger.info(
                `Running action ${courseData.name}.${phaseData.name}.${actionData.name} for phase${actionData.instance ? ' instance' : ''}: ${id}`
            )
            if (actionData.concurrencyMode === 'queue') {
                if (!this.pQueue) {
                    const PQueue = (await eval(`import('p-queue')`)).default as typeof import('p-queue').default
                    this.pQueue = new PQueue({ concurrency: 1 })
                }

                return await this.pQueue.add(() => {
                    if (actionData.instance) {
                        return this.doPhaseInstanceAction(id, args, logger, log)
                    } else {
                        return this.doPhaseAction(id, args, logger, log)
                    }
                })
            } else {
                if (actionData.instance) {
                    return this.doPhaseInstanceAction(id, args, logger, log)
                } else {
                    return this.doPhaseAction(id, args, logger, log)
                }
            }
        }

        async doPhaseAction(id: string | mongoose.Schema.Types.ObjectId, args: any, logger: winston.Logger, log?: Log) {
            const phase =
                actionData.concurrencyMode === 'locks'
                    ? await this.phaseModel
                          .findOneAndUpdate({ _id: id, locked: false, blocked: false }, { locked: true })
                          .exec()
                    : await this.phaseModel.findOne({ _id: id, blocked: false }).exec()

            try {
                if (!phase) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Phase not found or locked or blocked')
                }

                const course = await this.courseModel.findOne({ _id: getObjectId(phase.course), blocked: false }).lean()
                if (!phase) {
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
                        case 'logger':
                            argumentsToPass[param.index] = logger
                            break
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Unknown argument type')
                    }
                }

                const result = await this.phaseService[actionData.name](...argumentsToPass)

                if (actionData.concurrencyMode !== 'none') {
                    phase.history.push({
                        event: actionData.name,
                        successful: true,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await phase.save()
                }

                return result
            } catch (e) {
                logger.error(e.stack)

                if (actionData.concurrencyMode !== 'none') {
                    phase?.history.push({
                        event: actionData.name,
                        successful: false,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await phase?.save()
                }

                if (phase) {
                    const course = await this.courseModel.findOne({ _id: getObjectId(phase.course) }).lean()

                    if (course) {
                        await this.errorService.persistError(course._id, {
                            course: course._id,
                            targetContext: course._id,
                            log: log?._id ?? null,
                            message: `Error in phase action ${courseData.name}.${phaseData.name}.${actionData.name} for ${phase._id}`,
                            stack: e.stack
                        })
                    }
                }

                throw e
            } finally {
                if (actionData.concurrencyMode === 'locks') {
                    await this.phaseModel.findOneAndUpdate({ _id: id }, { locked: false }).exec()
                }
            }
        }

        async doPhaseInstanceAction(
            id: string | mongoose.Schema.Types.ObjectId,
            args: any,
            logger: winston.Logger,
            log?: Log
        ) {
            const phaseInstance =
                actionData.concurrencyMode === 'locks'
                    ? await this.phaseInstanceModel
                          .findOneAndUpdate({ _id: id, locked: false, blocked: false }, { locked: true })
                          .exec()
                    : await this.phaseInstanceModel.findOne({ _id: id, blocked: false }).exec()

            try {
                if (!phaseInstance) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Phase instance not found or locked or blocked')
                }

                const courseInstances = await this.courseInstanceModel
                    .find({
                        _id: phaseInstance.courseInstances?.map(getObjectId)
                    })
                    .lean()
                if (courseInstances.length === 0 || courseInstances.some((courseInstance) => courseInstance.blocked)) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Course instances not found or blocked')
                }

                const phase = await this.phaseModel
                    .findOne({
                        _id: getObjectId(phaseInstance.phase),
                        blocked: false
                    })
                    .lean()
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
                        case 'course-instance':
                            argumentsToPass[param.index] = courseInstances
                            break
                        case 'phase-instance':
                            argumentsToPass[param.index] = phaseInstance
                            break
                        case 'logger':
                            argumentsToPass[param.index] = logger
                            break
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Unknown argument type')
                    }
                }
                const result = await this.phaseService[actionData.name](...argumentsToPass)

                if (actionData.concurrencyMode !== 'none') {
                    phaseInstance.history.push({
                        event: actionData.name,
                        successful: true,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await phaseInstance.save()
                }

                return result
            } catch (e) {
                logger.error(e.stack)

                if (actionData.concurrencyMode !== 'none') {
                    phaseInstance?.history.push({
                        event: actionData.name,
                        successful: false,
                        timestamp: new Date(),
                        log: log?._id ?? null,
                        data: {}
                    })
                    await phaseInstance?.save()
                }

                if (phaseInstance) {
                    const courseInstances = await this.courseInstanceModel
                        .find({
                            _id: phaseInstance.courseInstances?.map(getObjectId)
                        })
                        .lean()

                    if (courseInstances.length > 0) {
                        const course = await this.courseModel
                            .findOne({
                                _id: getObjectId(courseInstances[0].course)
                            })
                            .lean()

                        if (course) {
                            await this.errorService.persistError(course._id, {
                                course: course._id,
                                targetContext: phaseInstance._id,
                                log: log?._id ?? null,
                                message: `Error in phase instance action ${courseData.name}.${phaseData.name}.${actionData.name} for ${phaseInstance._id}`,
                                stack: e.stack
                            })
                        }
                    }
                }

                throw e
            } finally {
                if (actionData.concurrencyMode === 'locks') {
                    await this.phaseInstanceModel.findOneAndUpdate({ _id: id }, { locked: false }).exec()
                }
            }
        }
    }

    Object.defineProperty(SynthesizedPhaseActionService, 'name', {
        value: phaseActionServiceInjectionToken(courseData.name, phaseData.name, actionData.name)
    })

    return SynthesizedPhaseActionService
}
