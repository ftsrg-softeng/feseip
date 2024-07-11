// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Delete, Get, Param, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PhaseData } from '@/decorators/phase.decorator'
import {
    synthesizePhaseInstanceDTO,
    synthesizePhaseInstanceWithTaskInstancesDTO
} from '@/core/presentation/phase/dto/phase-instance.dto'
import { capitalize } from '@/common/capitalize.util'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'
import { InjectPhaseInstanceService, IPhaseInstanceService } from '@/core/business/phase/phase-instance.service'
import { CourseData } from '@/decorators/course.decorator'
import { plainToInstance } from 'class-transformer'
import { InjectTaskInstanceService, TaskInstanceService } from '@/core/business/task/task-instance.service'
import { synthesizeUpdatePhaseInstanceArgs } from '@/core/presentation/phase/dto/update-phase-instance.args'

export function synthesizePhaseInstanceController(courseData: CourseData, phaseData: PhaseData) {
    const SynthesizedPhaseInstanceDTO = synthesizePhaseInstanceDTO(courseData, phaseData)
    const SynthesizedPhaseInstanceWithTaskInstancesDTO = synthesizePhaseInstanceWithTaskInstancesDTO(
        courseData,
        phaseData
    )
    const SynthesizedUpdatePhaseInstanceArgs = synthesizeUpdatePhaseInstanceArgs(courseData, phaseData)

    const phaseInstanceParamName = 'phaseInstanceId'
    const phaseParamName = 'phaseId'

    @Controller()
    @ApiTags(courseData.name)
    @RoleAuth()
    class SynthesizedPhaseInstanceController {
        constructor(
            @InjectPhaseInstanceService(courseData.name, phaseData.name)
            readonly phaseInstanceService: IPhaseInstanceService<PhaseInstance>,
            @InjectTaskInstanceService()
            readonly taskInstanceService: TaskInstanceService
        ) {}

        @Get(`/api/phase-instances/${phaseData.name}/:${phaseInstanceParamName}`)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: SynthesizedPhaseInstanceWithTaskInstancesDTO }, { overrideExisting: true })
        @RoleContext(RoleContextType.PHASE_INSTANCE, phaseInstanceParamName)
        public async getPhaseInstanceData(@Param(phaseInstanceParamName) id: string) {
            const phaseInstance = await this.phaseInstanceService.getPhaseInstanceData(id)
            if (!phaseInstance) {
                throw new Error('Phase instance does not exist')
            }

            const taskInstances = await this.taskInstanceService.getTaskInstancesForPhaseInstance(phaseInstance._id)

            return plainToInstance(
                SynthesizedPhaseInstanceWithTaskInstancesDTO,
                {
                    ...(phaseData.phaseInstanceDocumentToDto?.(phaseInstance) ??
                        documentToDto(phaseInstance, phaseData.phaseInstanceDTO)),
                    taskInstances: taskInstances
                        .map((taskInstance) => {
                            const taskData = phaseData.tasks.find((t) => t.name === taskInstance.type)
                            if (!taskData) return undefined
                            return (
                                taskData?.taskInstanceDocumentToDto?.(taskInstance) ??
                                documentToDto(taskInstance, taskData.taskInstanceDTO)
                            )
                        })
                        .filter((t) => t !== undefined)
                },
                { groups: Object.values(UserRole) }
            )
        }

        @Get(`/api/phases/${phaseData.name}/:${phaseParamName}/instances`)
        @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: [SynthesizedPhaseInstanceDTO] }, { overrideExisting: true })
        @RoleContext(RoleContextType.PHASE, phaseParamName)
        public async getPhaseInstanceDataForPhase(@Param(phaseParamName) id: string) {
            const phaseInstances = (await this.phaseInstanceService.getPhaseInstancesForPhase(id)).map(
                (phaseInstance) => {
                    // TODO: Find a better way to do this
                    phaseInstance.history = []
                    return phaseInstance
                }
            )
            return phaseInstances.map((phaseInstance) =>
                plainToInstance(
                    SynthesizedPhaseInstanceDTO,
                    phaseData.phaseInstanceDocumentToDto?.(phaseInstance) ??
                        documentToDto(phaseInstance, phaseData.phaseInstanceDTO),
                    { groups: Object.values(UserRole) }
                )
            )
        }

        @Put(`/api/phase-instances/${phaseData.name}/:${phaseInstanceParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedUpdatePhaseInstanceArgs })
        @RoleContext(RoleContextType.PHASE_INSTANCE, phaseInstanceParamName)
        public async updatePhaseInstanceData(
            @Param(phaseInstanceParamName) id: string,
            @AuthValidatedBody(SynthesizedUpdatePhaseInstanceArgs) data: any
        ) {
            await this.phaseInstanceService.updatePhaseInstanceData(id, data)
        }

        @Delete(`/api/phase-instances/${phaseData.name}/:${phaseInstanceParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @RoleContext(RoleContextType.PHASE_INSTANCE, phaseInstanceParamName)
        public async deletePhaseInstanceData(@Param(phaseInstanceParamName) id: string) {
            await this.phaseInstanceService.deletePhaseInstanceData(id)
        }
    }

    // Override class name
    Object.defineProperty(SynthesizedPhaseInstanceController, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseInstanceController`
    })

    return SynthesizedPhaseInstanceController
}
