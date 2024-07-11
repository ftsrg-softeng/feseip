// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { applyDecorators, Controller, Param, Post, Req, Res, Type } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TaskData } from '@/decorators/task.decorator'
import { ActionData } from '@/decorators/action.decorator'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { capitalize } from '@/common/capitalize.util'
import { taskActionServiceInjectionToken } from '@/core/business/task/task-action.service'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { ModuleRef } from '@nestjs/core'
import { phaseActionServiceInjectionToken } from '@/core/business/phase/phase-action.service'
import { courseActionServiceInjectionToken } from '@/core/business/course/course-action.service'
import { LogService } from '@/core/business/log/log.service'
import { CourseService, InjectCourseService } from '@/core/business/course/course.service'
import { CourseInstanceService, InjectCourseInstanceService } from '@/core/business/course/course-instance.service'
import { InjectPhaseService, PhaseService } from '@/core/business/phase/phase.service'
import { InjectPhaseInstanceService, PhaseInstanceService } from '@/core/business/phase/phase-instance.service'
import { InjectTaskService, TaskService } from '@/core/business/task/task.service'
import { InjectTaskInstanceService, TaskInstanceService } from '@/core/business/task/task-instance.service'
import mongoose from 'mongoose'
import { getObjectId } from '@/common/reference-prop.decorator'
import { LogDTO } from '@/core/presentation/log/dto/log.dto'
import { documentToDto } from '@/common/schema-to-dto.util'
import { Log } from '@/core/data/schemas/log.schema'
import { synthesizeActionDTO } from '@/core/presentation/action/dto/action.dto'
import { synthesizeActionArgs } from '@/core/presentation/action/dto/action.args'
import { Request, Response } from 'express'

export function synthesizeActionController(actionData: ActionData, courseData: CourseData): [Type<unknown>, string[]]
export function synthesizeActionController(
    actionData: ActionData,
    courseData: CourseData,
    phaseData: PhaseData
): [Type<unknown>, string[]]
export function synthesizeActionController(
    actionData: ActionData,
    courseData: CourseData,
    phaseData: PhaseData,
    taskData: TaskData
): [Type<unknown>, string[]]
export function synthesizeActionController(
    actionData: ActionData,
    courseData: CourseData,
    phaseData?: PhaseData,
    taskData?: TaskData
): [Type<unknown>, string[]] {
    function paramName() {
        if (taskData) {
            return actionData.instance ? 'taskInstanceId' : 'taskId'
        } else if (phaseData) {
            return actionData.instance ? 'phaseInstanceId' : 'phaseId'
        } else {
            return actionData.instance ? 'courseInstanceId' : 'courseId'
        }
    }

    function path() {
        if (taskData) {
            return `${actionData.instance ? 'task-instances' : 'tasks'}/${courseData.name}/${phaseData!.name}/${taskData.name}`
        } else if (phaseData) {
            return `${actionData.instance ? 'phase-instances' : 'phases'}/${courseData.name}/${phaseData.name}`
        } else {
            return `${actionData.instance ? 'course-instances' : 'courses'}/${courseData.name}`
        }
    }

    function controllerNamePrefix() {
        if (taskData) {
            return `${capitalize(courseData.name)}${capitalize(phaseData!.name)}${capitalize(taskData.name)}`
        } else if (phaseData) {
            return `${capitalize(courseData.name)}${capitalize(phaseData!.name)}`
        } else {
            return `${capitalize(courseData.name)}`
        }
    }

    function controllerNameSuffix() {
        if (taskData) {
            return actionData.instance ? 'TaskInstance' : 'Task'
        } else if (phaseData) {
            return actionData.instance ? 'PhaseInstance' : 'Phase'
        } else {
            return actionData.instance ? 'CourseInstance' : 'Course'
        }
    }

    function roleContext() {
        if (taskData) {
            return actionData.instance ? RoleContextType.TASK_INSTANCE : RoleContextType.TASK
        } else if (phaseData) {
            return actionData.instance ? RoleContextType.PHASE_INSTANCE : RoleContextType.PHASE
        } else {
            return actionData.instance ? RoleContextType.COURSE_INSTANCE : RoleContextType.COURSE
        }
    }

    const RoleAuthDecorators: ClassDecorator = !actionData.disableLtiAuthorization
        ? applyDecorators(RoleAuth(), RoleContext(roleContext(), paramName()))
        : applyDecorators()

    const publicPaths = actionData.disableLtiAuthorization
        ? [`api/${path()}/(.*)/actions/${actionData.name}`, `api/${path()}/(.*)/actions/${actionData.name}/background`]
        : []

    @Controller(`/api/${path()}/:${paramName()}/actions/${actionData.name}`)
    @ApiTags(courseData.name)
    @RoleAuthDecorators
    class SynthesizedActionController {
        readonly actionService: any

        constructor(
            readonly moduleRef: ModuleRef,
            readonly logService: LogService,
            @InjectCourseService() private readonly courseService: CourseService,
            @InjectCourseInstanceService() private readonly courseInstanceService: CourseInstanceService,
            @InjectPhaseService() private readonly phaseService: PhaseService,
            @InjectPhaseInstanceService() private readonly phaseInstanceService: PhaseInstanceService,
            @InjectTaskService() private readonly taskService: TaskService,
            @InjectTaskInstanceService() private readonly taskInstanceService: TaskInstanceService
        ) {
            if (phaseData && taskData) {
                this.actionService = this.moduleRef.get(
                    taskActionServiceInjectionToken(courseData.name, phaseData.name, taskData.name, actionData.name),
                    {
                        strict: false
                    }
                )
            } else if (phaseData) {
                this.actionService = this.moduleRef.get(
                    phaseActionServiceInjectionToken(courseData.name, phaseData.name, actionData.name),
                    {
                        strict: false
                    }
                )
            } else {
                this.actionService = this.moduleRef.get(
                    courseActionServiceInjectionToken(courseData.name, actionData.name),
                    {
                        strict: false
                    }
                )
            }
        }

        @Post(`/`)
        @Role(...actionData.roles)
        @ApiResponse(
            {
                status: 201,
                type: actionData.returnType
                    ? synthesizeActionDTO(actionData, courseData, phaseData, taskData)
                    : undefined
            },
            { overrideExisting: true }
        )
        @ApiBody(
            actionData.argumentType
                ? { type: synthesizeActionArgs(actionData, courseData, phaseData, taskData) }
                : { schema: { type: 'object' } }
        )
        public async doAction(
            @Param(paramName()) id: string,
            data: any,
            @Req() req: Request,
            @Res({ passthrough: actionData.argumentType !== 'requestResponse' }) res: Response
        ) {
            const [logger, log] = await this.logService.createActionLog(
                await this.getCourseId(id),
                actionData,
                courseData,
                phaseData,
                taskData
            )
            try {
                return await this.actionService.doAction(
                    id,
                    actionData.argumentType === 'request'
                        ? req
                        : actionData.argumentType === 'requestResponse'
                          ? [req, res]
                          : data ?? {},
                    logger,
                    log
                )
            } catch (e) {
                logger.error(e.stack)
            } finally {
                logger.close()
            }
        }

        @Post(`/background`)
        @Role(...actionData.roles)
        @ApiResponse({ status: 201, type: LogDTO }, { overrideExisting: true })
        @ApiBody(
            actionData.argumentType
                ? { type: synthesizeActionArgs(actionData, courseData, phaseData, taskData) }
                : { schema: { type: 'object' } }
        )
        public async doActionInBackground(
            @Param(paramName()) id: string,
            data: any,
            @Req() req: Request,
            @Res({ passthrough: actionData.argumentType !== 'requestResponse' }) res: Response
        ) {
            const [logger, log] = await this.logService.createActionLog(
                await this.getCourseId(id),
                actionData,
                courseData,
                phaseData,
                taskData
            )

            this.actionService
                .doAction(
                    id,
                    actionData.argumentType === 'request'
                        ? req
                        : actionData.argumentType === 'requestResponse'
                          ? [req, res]
                          : data ?? {},
                    logger,
                    log
                )
                .then((result: any) => logger.info(`Result: ${JSON.stringify(result)}`))
                .catch((err: any) => {
                    logger.error(`Error: ${err.stack}`)
                })
                .finally(() => logger.close())

            return documentToDto(log as Log, LogDTO)
        }

        private async getCourseId(id: string) {
            if (courseData && phaseData && taskData && actionData.instance) {
                return this.getCourseIdForTaskInstance(id)
            } else if (courseData && phaseData && taskData) {
                return this.getCourseIdForTask(id)
            } else if (courseData && phaseData && actionData.instance) {
                return this.getCourseIdForPhaseInstance(id)
            } else if (courseData && phaseData) {
                return this.getCourseIdForPhase(id)
            } else if (courseData && actionData.instance) {
                return this.getCourseIdForCourseInstance(id)
            } else {
                return this.getCourseIdForCourse(id)
            }
        }

        private async getCourseIdForTaskInstance(id: string | mongoose.Schema.Types.ObjectId) {
            const taskInstance = await this.taskInstanceService.getTaskInstanceById(id)
            if (!taskInstance || !taskInstance.task) throw new Error()
            return this.getCourseIdForTask(getObjectId(taskInstance.task)!)
        }

        private async getCourseIdForTask(id: string | mongoose.Schema.Types.ObjectId) {
            const task = await this.taskService.getTaskById(id)
            if (!task || !task.phase) throw new Error()
            return this.getCourseIdForPhase(getObjectId(task.phase)!)
        }

        private async getCourseIdForPhaseInstance(id: string | mongoose.Schema.Types.ObjectId) {
            const phaseInstance = await this.phaseInstanceService.getPhaseInstanceById(id)
            if (!phaseInstance || !phaseInstance.phase) throw new Error()
            return this.getCourseIdForPhase(getObjectId(phaseInstance.phase)!)
        }

        private async getCourseIdForPhase(id: string | mongoose.Schema.Types.ObjectId) {
            const phase = await this.phaseService.getPhaseById(id)
            if (!phase || !phase.course) throw new Error()
            return this.getCourseIdForCourse(getObjectId(phase.course)!)
        }

        private async getCourseIdForCourseInstance(id: string | mongoose.Schema.Types.ObjectId) {
            const courseInstance = await this.courseInstanceService.getCourseInstanceById(id)
            if (!courseInstance || !courseInstance.course) throw new Error()
            return this.getCourseIdForCourse(getObjectId(courseInstance.course)!)
        }

        private async getCourseIdForCourse(id: string | mongoose.Schema.Types.ObjectId) {
            return id
        }
    }

    if (
        actionData.argumentType &&
        actionData.argumentType !== 'request' &&
        actionData.argumentType !== 'requestResponse'
    ) {
        AuthValidatedBody(actionData.argumentType)(
            SynthesizedActionController.prototype,
            SynthesizedActionController.prototype.doAction.name,
            1
        )

        AuthValidatedBody(actionData.argumentType)(
            SynthesizedActionController.prototype,
            SynthesizedActionController.prototype.doActionInBackground.name,
            1
        )
    }

    Object.defineProperty(SynthesizedActionController, 'name', {
        value: `${controllerNamePrefix()}${capitalize(actionData.name)}${controllerNameSuffix()}ActionController`
    })

    return [SynthesizedActionController, publicPaths]
}
