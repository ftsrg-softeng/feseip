// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Get, Param, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { synthesizeTaskDTO } from '@/core/presentation/task/dto/task.dto'
import { capitalize } from '@/common/capitalize.util'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { InjectTaskService, ITaskService } from '@/core/business/task/task.service'
import { Task } from '@/core/data/schemas/task.schema'
import { synthesizeUpdateTaskArgs } from '@/core/presentation/task/dto/update-task.args'

export function synthesizeTaskController(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    const SynthesizedTaskDTO = synthesizeTaskDTO(courseData, phaseData, taskData)
    const SynthesizedUpdateTaskArgs = synthesizeUpdateTaskArgs(courseData, phaseData, taskData)

    const taskParamName = 'taskId'

    @Controller(`/api/tasks/${courseData.name}/${phaseData.name}/${taskData.name}`)
    @ApiTags(courseData.name)
    @RoleAuth()
    @RoleContext(RoleContextType.TASK, taskParamName)
    class SynthesizedTaskController {
        constructor(
            @InjectTaskService(courseData.name, phaseData.name, taskData.name) readonly taskService: ITaskService<Task>
        ) {}

        @Get(`/:${taskParamName}`)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: SynthesizedTaskDTO }, { overrideExisting: true })
        public async getTaskData(@Param(taskParamName) id: string) {
            const task = await this.taskService.getTaskData(id)
            if (!task) {
                throw new Error('Task does not exist')
            }
            // TODO: Find a better way to do this
            task.history = []

            return taskData.taskDocumentToDto?.(task) ?? documentToDto(task, taskData.taskDTO)
        }

        @Put(`/:${taskParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedUpdateTaskArgs })
        public async updateTaskData(
            @Param(taskParamName) id: string,
            @AuthValidatedBody(SynthesizedUpdateTaskArgs) data: any
        ) {
            await this.taskService.updateTaskData(id, data)
        }
    }

    // Override class name
    Object.defineProperty(SynthesizedTaskController, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(taskData.name)}TaskController`
    })

    return SynthesizedTaskController
}
