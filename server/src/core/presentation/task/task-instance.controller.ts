// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Delete, Get, Param, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TaskData } from '@/decorators/task.decorator'
import { synthesizeTaskInstanceDTO } from '@/core/presentation/task/dto/task-instance.dto'
import { capitalize } from '@/common/capitalize.util'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { TaskInstance } from '@/core/data/schemas/task-instance.schema'
import { InjectTaskInstanceService, ITaskInstanceService } from '@/core/business/task/task-instance.service'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { synthesizeUpdateTaskInstanceArgs } from '@/core/presentation/task/dto/update-task-instance.args'

export function synthesizeTaskInstanceController(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    const SynthesizedTaskInstanceDTO = synthesizeTaskInstanceDTO(courseData, phaseData, taskData)
    const SynthesizedUpdateTaskInstanceArgs = synthesizeUpdateTaskInstanceArgs(courseData, phaseData, taskData)

    const taskInstanceParamName = 'taskInstanceId'
    const taskParamName = 'taskId'

    @Controller()
    @ApiTags(courseData.name)
    @RoleAuth()
    class SynthesizedTaskInstanceController {
        constructor(
            @InjectTaskInstanceService(courseData.name, phaseData.name, taskData.name)
            readonly taskInstanceService: ITaskInstanceService<TaskInstance>
        ) {}

        @Get(`/api/task-instances/${taskData.name}/:${taskInstanceParamName}`)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: SynthesizedTaskInstanceDTO }, { overrideExisting: true })
        @RoleContext(RoleContextType.TASK_INSTANCE, taskInstanceParamName)
        public async getTaskInstanceData(@Param(taskInstanceParamName) id: string) {
            const taskInstance = await this.taskInstanceService.getTaskInstanceData(id)
            if (!taskInstance) {
                throw new Error('Task instance does not exist')
            }

            return (
                taskData.taskInstanceDocumentToDto?.(taskInstance) ??
                documentToDto(taskInstance, taskData.taskInstanceDTO)
            )
        }

        @Get(`/api/tasks/${taskData.name}/:${taskParamName}/instances`)
        @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: [SynthesizedTaskInstanceDTO] }, { overrideExisting: true })
        @RoleContext(RoleContextType.TASK, taskParamName)
        public async getTaskInstanceDataForTask(@Param(taskParamName) id: string) {
            const taskInstances = (await this.taskInstanceService.getTaskInstancesForTask(id)).map((taskInstance) => {
                // TODO: Find a better way to do this
                taskInstance.history = []
                return taskInstance
            })

            return taskInstances.map(
                (taskInstance) =>
                    taskData.taskInstanceDocumentToDto?.(taskInstance) ??
                    documentToDto(taskInstance, taskData.taskInstanceDTO)
            )
        }

        @Put(`/api/task-instances/${taskData.name}/:${taskInstanceParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedUpdateTaskInstanceArgs })
        @RoleContext(RoleContextType.TASK_INSTANCE, taskInstanceParamName)
        public async updateTaskInstanceData(
            @Param(taskInstanceParamName) id: string,
            @AuthValidatedBody(SynthesizedUpdateTaskInstanceArgs) data: any
        ) {
            await this.taskInstanceService.updateTaskInstanceData(id, data)
        }

        @Delete(`/api/task-instances/${taskData.name}/:${taskInstanceParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @RoleContext(RoleContextType.TASK_INSTANCE, taskInstanceParamName)
        public async deleteTaskInstanceData(@Param(taskInstanceParamName) id: string) {
            await this.taskInstanceService.deleteTaskInstanceData(id)
        }
    }

    // Override class name
    Object.defineProperty(SynthesizedTaskInstanceController, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(taskData.name)}TaskInstanceController`
    })

    return SynthesizedTaskInstanceController
}
