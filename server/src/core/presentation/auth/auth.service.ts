// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ExecutionContext, Injectable } from '@nestjs/common'
import { UserService } from '../../business/user/user.service'
import { UserRole } from '../../data/schemas/user.schema'
import { IdToken } from 'ltijs'
import { ROLE_CONTEXT_METADATA_KEY, RoleContextMetadataType, RoleContextType } from './role-auth/role-context.decorator'
import { Reflector } from '@nestjs/core'
import { Request, Response } from 'express'
import { getObjectId } from '@/common/reference-prop.decorator'
import { CourseInstanceService, InjectCourseInstanceService } from '@/core/business/course/course-instance.service'
import { CourseService, InjectCourseService } from '@/core/business/course/course.service'
import mongoose from 'mongoose'
import { InjectPhaseService, PhaseService } from '@/core/business/phase/phase.service'
import { InjectPhaseInstanceService, PhaseInstanceService } from '@/core/business/phase/phase-instance.service'
import { InjectTaskService, TaskService } from '@/core/business/task/task.service'
import { InjectTaskInstanceService, TaskInstanceService } from '@/core/business/task/task-instance.service'

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        @InjectCourseService() private readonly courseService: CourseService,
        @InjectCourseInstanceService() private readonly courseInstanceService: CourseInstanceService,
        @InjectPhaseService() private readonly phaseService: PhaseService,
        @InjectPhaseInstanceService() private readonly phaseInstanceService: PhaseInstanceService,
        @InjectTaskService() private readonly taskService: TaskService,
        @InjectTaskInstanceService() private readonly taskInstanceService: TaskInstanceService,
        private readonly reflector: Reflector
    ) {}

    public async getAdminStatusForExecutionContext(context: ExecutionContext) {
        const response = context.switchToHttp().getResponse<Response>()
        const token = response.locals.token
        if (!token) {
            return null
        }

        const user = await this.getUserFromToken(token)
        if (!user) {
            return null
        }

        return user.isAdmin
    }

    public async getUserRoleForExecutionContext(context: ExecutionContext): Promise<UserRole | null> {
        const request = context.switchToHttp().getRequest<Request>()
        const response = context.switchToHttp().getResponse<Response>()

        const roleContext = this.reflector.getAllAndOverride<RoleContextMetadataType>(ROLE_CONTEXT_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ])
        if (!roleContext) {
            return null
        }

        const token = response.locals.token
        if (!token) {
            return null
        }

        switch (roleContext.roleContextType) {
            case RoleContextType.NULL: {
                return this.getUserRoleForToken(token)
            }
            case RoleContextType.COURSE: {
                const courseId = request.params[roleContext.courseParamName]
                return courseId ? this.getUserRoleForCourse(token, courseId) : null
            }
            case RoleContextType.COURSE_INSTANCE: {
                const courseInstanceId = request.params[roleContext.courseParamName]
                return courseInstanceId ? this.getUserRoleForCourseInstance(token, courseInstanceId) : null
            }
            case RoleContextType.PHASE: {
                const phaseId = request.params[roleContext.phaseParamName]
                return phaseId ? this.getUserRoleForPhase(token, phaseId) : null
            }
            case RoleContextType.PHASE_INSTANCE: {
                const phaseInstanceId = request.params[roleContext.phaseParamName]
                return phaseInstanceId ? this.getUserRoleForPhaseInstance(token, phaseInstanceId) : null
            }
            case RoleContextType.TASK: {
                const taskId = request.params[roleContext.taskParamName]
                return taskId ? this.getUserRoleForTask(token, taskId) : null
            }
            case RoleContextType.TASK_INSTANCE: {
                const taskInstanceId = request.params[roleContext.taskParamName]
                return taskInstanceId ? this.getUserRoleForTaskInstance(token, taskInstanceId) : null
            }
        }
    }

    private async getUserRoleForCourse(
        token: IdToken,
        courseId: string | mongoose.Schema.Types.ObjectId
    ): Promise<UserRole | null> {
        const course = await this.getCourseById(courseId)
        const apiKey = await this.getApiKey(token)
        const user = await this.getUserFromToken(token)

        if (!course || !apiKey || !user) {
            return null
        }

        if (course.apiKey !== apiKey) {
            return null
        }

        const roleAssignment = user.roles?.find((r) => getObjectId(r.course)?.toString() === course._id.toString())
        if (!roleAssignment) {
            return null
        }

        return roleAssignment.role
    }

    private async getUserRoleForCourseInstance(
        token: IdToken,
        courseInstanceId: string | mongoose.Schema.Types.ObjectId
    ): Promise<UserRole | null> {
        const courseInstance = await this.courseInstanceService.getCourseInstanceById(courseInstanceId)
        if (!courseInstance) return null

        const courseId = getObjectId(courseInstance.course)
        return courseId ? this.getUserRoleForCourse(token, courseId) : null
    }

    private async getUserRoleForPhase(
        token: IdToken,
        phaseId: string | mongoose.Schema.Types.ObjectId
    ): Promise<UserRole | null> {
        const phase = await this.phaseService.getPhaseById(phaseId)
        if (!phase) return null

        const courseId = getObjectId(phase.course)
        return courseId ? this.getUserRoleForCourse(token, courseId) : null
    }

    private async getUserRoleForPhaseInstance(
        token: IdToken,
        phaseInstanceId: string | mongoose.Schema.Types.ObjectId
    ): Promise<UserRole | null> {
        const phaseInstance = await this.phaseInstanceService.getPhaseInstanceById(phaseInstanceId)
        if (!phaseInstance) return null

        const phaseId = getObjectId(phaseInstance.phase)
        return phaseId ? this.getUserRoleForPhase(token, phaseId) : null
    }

    private async getUserRoleForTask(
        token: IdToken,
        taskId: string | mongoose.Schema.Types.ObjectId
    ): Promise<UserRole | null> {
        const task = await this.taskService.getTaskById(taskId)
        if (!task) return null

        const phaseId = getObjectId(task.phase)
        return phaseId ? this.getUserRoleForPhase(token, phaseId) : null
    }

    private async getUserRoleForTaskInstance(
        token: IdToken,
        taskInstanceId: string | mongoose.Schema.Types.ObjectId
    ): Promise<UserRole | null> {
        const taskInstance = await this.taskInstanceService.getTaskInstanceById(taskInstanceId)
        if (!taskInstance) return null

        const taskId = getObjectId(taskInstance.task)
        return taskId ? this.getUserRoleForTask(token, taskId) : null
    }

    private async getUserRoleForToken(token: IdToken): Promise<UserRole | null> {
        const apiKey = await this.getApiKey(token)
        const user = await this.getUserFromToken(token)
        const course = apiKey ? await this.courseService.getCourseByApiKey(apiKey) : null

        if (!apiKey || !user || !course) return null

        const platformContext = (token as any)['platformContext'] as any
        if (!platformContext) {
            return null
        }

        return user.roles.find((r) => getObjectId(r.course)?.toString() === course._id.toString())?.role ?? null
    }

    private async getCourseById(courseId: string | mongoose.Schema.Types.ObjectId) {
        const course = await this.courseService.getCourseById(courseId)
        if (!course) {
            return null
        }
        return course
    }

    private async getApiKey(token: IdToken) {
        const platformContext = (token as any)['platformContext'] as any
        if (!platformContext) {
            return null
        }

        const apiKey = platformContext.custom['api-key'] as string | undefined
        if (!apiKey) {
            return null
        }

        return apiKey
    }

    private async getUserFromToken(token: IdToken) {
        const moodleId = parseInt(token.user)
        const user = await this.userService.findUserByMoodleId(moodleId)
        if (!user) {
            return null
        }
        return user
    }
}
