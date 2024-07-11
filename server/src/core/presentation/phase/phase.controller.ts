// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Get, Param, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { synthesizePhaseDTO } from '@/core/presentation/phase/dto/phase.dto'
import { capitalize } from '@/common/capitalize.util'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { InjectPhaseService, IPhaseService } from '@/core/business/phase/phase.service'
import { Phase } from '@/core/data/schemas/phase.schema'
import { InjectTaskService, TaskService } from '@/core/business/task/task.service'
import { synthesizeUpdatePhaseArgs } from '@/core/presentation/phase/dto/update-phase.args'
import { plainToInstance } from 'class-transformer'

export function synthesizePhaseController(courseData: CourseData, phaseData: PhaseData) {
    const SynthesizedPhaseDTO = synthesizePhaseDTO(courseData, phaseData)
    const SynthesizedUpdatePhaseArgs = synthesizeUpdatePhaseArgs(courseData, phaseData)

    const phaseParamName = 'phaseId'

    @Controller(`/api/phases/${courseData.name}/${phaseData.name}`)
    @ApiTags(courseData.name)
    @RoleAuth()
    @RoleContext(RoleContextType.PHASE, phaseParamName)
    class SynthesizedPhaseController {
        constructor(
            @InjectPhaseService(courseData.name, phaseData.name) readonly phaseService: IPhaseService<Phase>,
            @InjectTaskService() readonly taskService: TaskService
        ) {}

        @Get(`/:${phaseParamName}`)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: SynthesizedPhaseDTO }, { overrideExisting: true })
        public async getPhaseData(@Param(phaseParamName) id: string) {
            const phase = await this.phaseService.getPhaseData(id)
            if (!phase) {
                throw new Error('Phase does not exist')
            }
            // TODO: Find a better way to do this
            phase.history = []

            const tasks = (await this.taskService.getTasksForPhase(phase._id.toString())).map((task) => {
                // TODO: Find a better way to do this
                task.history = []
                return task
            })

            return plainToInstance(
                SynthesizedPhaseDTO,
                {
                    ...(phaseData.phaseDocumentToDto?.(phase) ?? documentToDto(phase, phaseData.phaseDTO)),
                    tasks: tasks
                        .map((task) => {
                            const taskData = phaseData.tasks.find((t) => t.name === task.type)
                            if (!taskData) return undefined
                            return taskData?.taskDocumentToDto?.(task) ?? documentToDto(task, taskData.taskDTO)
                        })
                        .filter((t) => t !== undefined)
                },
                { groups: Object.values(UserRole) }
            )
        }

        @Put(`/:${phaseParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedUpdatePhaseArgs })
        public async updatePhaseData(
            @Param(phaseParamName) id: string,
            @AuthValidatedBody(SynthesizedUpdatePhaseArgs) data: any
        ) {
            await this.phaseService.updatePhaseData(id, data)
        }
    }

    // Override class name
    Object.defineProperty(SynthesizedPhaseController, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseController`
    })

    return SynthesizedPhaseController
}
