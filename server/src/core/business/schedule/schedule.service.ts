// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import mongoose, { Error, Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { Schedule } from '@/core/data/schemas/schedule.schema'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { CourseData } from '@/decorators/course.decorator'
import { ModuleRef } from '@nestjs/core'
import { courseActionServiceInjectionToken } from '@/core/business/course/course-action.service'
import { phaseActionServiceInjectionToken } from '@/core/business/phase/phase-action.service'
import { taskActionServiceInjectionToken } from '@/core/business/task/task-action.service'
import { LogService } from '@/core/business/log/log.service'
import { getObjectId } from '@/common/reference-prop.decorator'
import { CourseInstanceService, InjectCourseInstanceService } from '@/core/business/course/course-instance.service'
import { InjectPhaseService, PhaseService } from '@/core/business/phase/phase.service'
import { InjectPhaseInstanceService, PhaseInstanceService } from '@/core/business/phase/phase-instance.service'
import { InjectTaskService, TaskService } from '@/core/business/task/task.service'
import { InjectTaskInstanceService, TaskInstanceService } from '@/core/business/task/task-instance.service'
import { CourseService, InjectCourseService } from '@/core/business/course/course.service'
import { ErrorService } from '@/core/business/error/error.service'

export const COURSE_DATA_INJECTION_TOKEN = 'COURSE_DATA_INJECTION_TOKEN'

@Injectable()
export class ScheduleService implements OnModuleInit {
    constructor(
        @InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
        private readonly schedulerRegistry: SchedulerRegistry,
        @Inject(COURSE_DATA_INJECTION_TOKEN) private readonly courseData: CourseData[],
        private readonly moduleRef: ModuleRef,
        private readonly logService: LogService,
        private readonly errorService: ErrorService,
        @InjectCourseService() private readonly courseService: CourseService,
        @InjectCourseInstanceService() private readonly courseInstanceService: CourseInstanceService,
        @InjectPhaseService() private readonly phaseService: PhaseService,
        @InjectPhaseInstanceService() private readonly phaseInstanceService: PhaseInstanceService,
        @InjectTaskService() private readonly taskService: TaskService,
        @InjectTaskInstanceService() private readonly taskInstanceService: TaskInstanceService
    ) {}

    public async onModuleInit() {
        const schedules = await this.scheduleModel.find().exec()
        for (const schedule of schedules) {
            const courseId = getObjectId(schedule.course)!

            if (schedule.cron !== 'now' && schedule.cron !== 'never') {
                const cronJob = new CronJob(schedule.cron, await this.runSchedule(courseId, schedule))
                this.schedulerRegistry.addCronJob(schedule._id.toString(), cronJob)
                cronJob.start()
            }

            if (schedule.running) {
                await this.errorService.persistError(courseId, {
                    course: courseId,
                    log: null,
                    targetContext: null,
                    message: `Not clean start: ${schedule.name}`,
                    stack: `Not clean start: ${schedule.name}`
                })
                const scheduleFunc = await this.runSchedule(courseId, schedule)
                scheduleFunc().finally()
            }
        }
    }

    public async getSchedulesForCourse(courseId: string | mongoose.Schema.Types.ObjectId) {
        return this.scheduleModel.find({ course: courseId }).lean()
    }

    public async createSchedule(
        courseId: string | mongoose.Schema.Types.ObjectId,
        schedule: Omit<Schedule, '_id' | 'course'>
    ) {
        const newSchedule = new this.scheduleModel({ ...schedule, course: courseId })
        await newSchedule.save()

        if (newSchedule.cron !== 'now' && newSchedule.cron !== 'never') {
            const cronJob = new CronJob(newSchedule.cron, await this.runSchedule(courseId, newSchedule))
            this.schedulerRegistry.addCronJob(newSchedule._id.toString(), cronJob)
            cronJob.start()
        } else if (newSchedule.cron !== 'never') {
            const scheduleFunc = await this.runSchedule(courseId, newSchedule)
            scheduleFunc().finally()
        }
    }

    public async updateSchedule(
        courseId: string | mongoose.Schema.Types.ObjectId,
        scheduleId: string | mongoose.Schema.Types.ObjectId,
        schedule: Omit<Schedule, '_id' | 'course'>
    ) {
        let scheduleToUpdate = await this.scheduleModel.findOne({ _id: scheduleId, course: courseId }).exec()
        if (!scheduleToUpdate) {
            throw new Error('Schedule not found')
        }
        const originalCron = scheduleToUpdate.cron
        await scheduleToUpdate.updateOne({ ...schedule })
        scheduleToUpdate = (await this.scheduleModel.findOne({ _id: scheduleId, course: courseId }).exec())!

        if (originalCron !== 'never' && originalCron !== 'now') {
            this.schedulerRegistry.deleteCronJob(scheduleToUpdate._id.toString())
        }
        if (scheduleToUpdate.cron !== 'now' && scheduleToUpdate.cron !== 'never') {
            const cronJob = new CronJob(scheduleToUpdate.cron, await this.runSchedule(courseId, scheduleToUpdate))
            this.schedulerRegistry.addCronJob(scheduleToUpdate._id.toString(), cronJob)
            cronJob.start()
        } else if (scheduleToUpdate.cron !== 'never') {
            const scheduleFunc = await this.runSchedule(courseId, scheduleToUpdate)
            scheduleFunc().finally()
        }
    }

    public async deleteSchedule(
        courseId: string | mongoose.Schema.Types.ObjectId,
        scheduleId: string | mongoose.Schema.Types.ObjectId
    ) {
        const scheduleToDelete = await this.scheduleModel.findOne({ _id: scheduleId, course: courseId }).exec()
        if (!scheduleToDelete) {
            throw new Error('Schedule not found')
        }
        await this.scheduleModel.deleteOne({ _id: scheduleId, course: courseId }).exec()
        if (scheduleToDelete.cron !== 'never' && scheduleToDelete.cron !== 'now') {
            this.schedulerRegistry.deleteCronJob(scheduleId.toString())
        }
    }

    private async runSchedule(courseId: string | mongoose.Schema.Types.ObjectId, schedule: Schedule) {
        return async () => {
            await this.scheduleModel.findOneAndUpdate({ _id: schedule._id }, { running: true }).exec()
            const [logger] = await this.logService.createScheduleLog(courseId, schedule)

            try {
                for (const schema of schedule.schema) {
                    const course = await this.courseService.getCourseById(courseId)
                    const courseInstanceFilter = schedule.courseInstanceFilter
                        ? JSON.parse(schedule.courseInstanceFilter)
                        : {}
                    const courseInstances = await this.courseInstanceService.getCourseInstancesByFilter({
                        ...courseInstanceFilter,
                        course: courseId
                    })
                    const courseInstanceIds = courseInstances.map((ci) => ci._id.toString())

                    const phases = await this.phaseService.getPhasesForCourse(courseId)
                    const phaseInstances = (
                        await this.phaseInstanceService.getPhaseInstancesForCourse(courseId)
                    ).filter((phaseInstance) =>
                        phaseInstance.courseInstances?.some((ci) =>
                            courseInstanceIds.includes(getObjectId(ci)?.toString() ?? '')
                        )
                    )
                    const phaseInstanceIds = phaseInstances.map((pi) => pi._id.toString())

                    const tasks = await this.taskService.getTasksForCourse(courseId)
                    const taskInstances = (await this.taskInstanceService.getTaskInstancesForCourse(courseId)).filter(
                        (taskInstance) =>
                            taskInstance.phaseInstances?.some((pi) =>
                                phaseInstanceIds.includes(getObjectId(pi)?.toString() ?? '')
                            )
                    )

                    logger.info(`Running action: ${schema.action}`)
                    const actionName = schema.action.split('.')

                    if (actionName.length === 2) {
                        const courseData = this.courseData.find((c) => c.name === actionName[0])
                        const actionData = courseData?.actions?.find((a) => a.name === actionName[1])
                        if (!courseData || !actionData) {
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Invalid action')
                        }
                        const actionService = this.moduleRef.get(
                            courseActionServiceInjectionToken(courseData.name, actionData.name),
                            { strict: false }
                        )
                        if (actionData.instance) {
                            const relevantCourseInstances = courseInstances.filter(
                                (c) => c.type === courseData.name && actionData.shouldRun({ courseInstance: c })
                            )
                            logger.info(`Found ${relevantCourseInstances.length} relevant course instances`)
                            for (const [index, courseInstance] of relevantCourseInstances.entries()) {
                                const [subLogger, subLog] = await this.logService.createActionLog(
                                    courseId,
                                    actionData,
                                    courseData
                                )
                                try {
                                    logger.info(
                                        `Running ${schema.action} for course instance: ${courseInstance._id} (${index + 1} / ${relevantCourseInstances.length})`
                                    )
                                    await actionService.doAction(courseInstance._id, schema.params, subLogger, subLog)
                                } catch (e) {
                                } finally {
                                    subLogger.close()
                                }
                            }
                        } else {
                            const [subLogger, subLog] = await this.logService.createActionLog(
                                courseId,
                                actionData,
                                courseData
                            )
                            try {
                                if (actionData.shouldRun({ course: course })) {
                                    logger.info(`Running ${schema.action} for course: ${courseId}`)
                                    await actionService.doAction(course._id, schema.params, subLogger, subLog)
                                }
                            } catch (e) {
                            } finally {
                                subLogger.close()
                            }
                        }
                    } else if (actionName.length === 3) {
                        const courseData = this.courseData.find((c) => c.name === actionName[0])
                        const phaseData = courseData?.phases?.find((p) => p.name === actionName[1])
                        const actionData = phaseData?.actions?.find((a) => a.name === actionName[2])
                        if (!courseData || !phaseData || !actionData) {
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Invalid action')
                        }
                        const actionService = this.moduleRef.get(
                            phaseActionServiceInjectionToken(courseData.name, phaseData.name, actionData.name),
                            { strict: false }
                        )
                        if (actionData.instance) {
                            const relevantPhaseInstances = phaseInstances.filter(
                                (p) => p.type === phaseData.name && actionData.shouldRun({ phaseInstance: p })
                            )
                            logger.info(`Found ${relevantPhaseInstances.length} relevant phase instances`)
                            for (const [index, phaseInstance] of relevantPhaseInstances.entries()) {
                                const [subLogger, subLog] = await this.logService.createActionLog(
                                    courseId,
                                    actionData,
                                    courseData,
                                    phaseData
                                )
                                try {
                                    logger.info(
                                        `Running ${schema.action} for phase instance: ${phaseInstance._id} (${index + 1} / ${relevantPhaseInstances.length})`
                                    )
                                    await actionService.doAction(phaseInstance._id, schema.params, subLogger, subLog)
                                } catch (e) {
                                } finally {
                                    subLogger.close()
                                }
                            }
                        } else {
                            const relevantPhases = phases.filter(
                                (p) => p.type === phaseData.name && actionData.shouldRun({ phase: p })
                            )
                            logger.info(`Found ${relevantPhases.length} relevant phases`)

                            for (const [index, relevantPhase] of relevantPhases.entries()) {
                                const [subLogger, subLog] = await this.logService.createActionLog(
                                    courseId,
                                    actionData,
                                    courseData,
                                    phaseData
                                )
                                try {
                                    logger.info(
                                        `Running ${schema.action} for phase: ${relevantPhase._id} (${index + 1} / ${relevantPhases.length})`
                                    )
                                    await actionService.doAction(relevantPhase._id, schema.params, subLogger, subLog)
                                } catch (e) {
                                } finally {
                                    subLogger.close()
                                }
                            }
                        }
                    } else if (actionName.length === 4) {
                        const courseData = this.courseData.find((c) => c.name === actionName[0])
                        const phaseData = courseData?.phases?.find((p) => p.name === actionName[1])
                        const taskData = phaseData?.tasks?.find((t) => t.name === actionName[2])
                        const actionData = taskData?.actions?.find((a) => a.name === actionName[3])
                        if (!courseData || !phaseData || !taskData || !actionData) {
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error('Invalid action')
                        }
                        const actionService = this.moduleRef.get(
                            taskActionServiceInjectionToken(
                                courseData.name,
                                phaseData.name,
                                taskData.name,
                                actionData.name
                            ),
                            { strict: false }
                        )
                        if (actionData.instance) {
                            const relevantTaskInstances = taskInstances.filter(
                                (t) => t.type === taskData.name && actionData.shouldRun({ taskInstance: t })
                            )
                            logger.info(`Found ${relevantTaskInstances.length} relevant task instances`)
                            for (const [index, taskInstance] of relevantTaskInstances.entries()) {
                                const [subLogger, subLog] = await this.logService.createActionLog(
                                    courseId,
                                    actionData,
                                    courseData,
                                    phaseData,
                                    taskData
                                )
                                try {
                                    logger.info(
                                        `Running ${schema.action} for task instance: ${taskInstance._id} (${index + 1} / ${relevantTaskInstances.length})`
                                    )
                                    await actionService.doAction(taskInstance._id, schema.params, subLogger, subLog)
                                } catch (e) {
                                } finally {
                                    subLogger.close()
                                }
                            }
                        } else {
                            const relevantTasks = tasks.filter(
                                (t) => t.type === taskData.name && actionData.shouldRun({ task: t })
                            )
                            logger.info(`Found ${relevantTasks.length} relevant tasks`)
                            for (const [index, relevantTask] of relevantTasks.entries()) {
                                const [subLogger, subLog] = await this.logService.createActionLog(
                                    courseId,
                                    actionData,
                                    courseData,
                                    phaseData,
                                    taskData
                                )
                                try {
                                    logger.info(
                                        `Running ${schema.action} for task: ${relevantTask._id} (${index + 1} / ${relevantTasks.length})`
                                    )
                                    await actionService.doAction(relevantTask._id, schema.params, subLogger, subLog)
                                } catch (e) {
                                } finally {
                                    subLogger.close()
                                }
                            }
                        }
                    } else {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('Invalid action')
                    }
                }
            } catch (e) {
                logger.error(`Error: ${JSON.stringify(e)}`)
                throw e
            } finally {
                await this.scheduleModel.findOneAndUpdate({ _id: schedule._id }, { running: false }).exec()
                logger.info('Finished schedule')
                logger.close()
            }
        }
    }
}
