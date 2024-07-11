// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { capitalize } from '@/common/capitalize.util'
import { Expose, Type } from 'class-transformer'
import { PhaseDTO } from '@/core/presentation/phase/dto/phase.dto'
import { DTOProperty } from '@/common/dto-property.decorator'
import { synthesizeTaskInstanceDTO } from '@/core/presentation/task/dto/task-instance.dto'

export class PhaseInstanceDTO extends SchemaToDtoClass(PhaseInstance) {}

export function synthesizePhaseInstanceDTO(courseData: CourseData, phaseData: PhaseData) {
    class SynthesizedPhaseInstanceDTO extends OmitType<PhaseInstanceDTO, keyof PhaseInstanceDTO>(
        phaseData.phaseInstanceDTO,
        ['type']
    ) {
        @DTOProperty({ type: String, enum: [phaseData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedPhaseInstanceDTO, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseInstanceDTO`
    })

    return SynthesizedPhaseInstanceDTO
}

export function synthesizePhaseInstanceWithTaskInstancesDTO(courseData: CourseData, phaseData: PhaseData) {
    class SynthesizedPhaseInstanceWithTaskInstancesDTO extends OmitType<PhaseInstanceDTO, keyof PhaseInstanceDTO>(
        phaseData.phaseInstanceDTO,
        ['type']
    ) {
        @ApiProperty({
            oneOf: phaseData.tasks.map((task) => ({
                $ref: `#/components/schemas/${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(task.name)}TaskInstanceDTO`
            }))
        })
        @Type(() => PhaseDTO, {
            discriminator: {
                property: 'type',
                subTypes: [
                    ...phaseData.tasks.map((task) => ({
                        name: task.name,
                        value: synthesizeTaskInstanceDTO(courseData, phaseData, task)
                    }))
                ]
            },
            keepDiscriminatorProperty: true
        })
        @Expose()
        taskInstances: any[]

        @DTOProperty({ type: String, enum: [phaseData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedPhaseInstanceWithTaskInstancesDTO, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseInstanceWithTaskInstancesDTO`
    })

    return SynthesizedPhaseInstanceWithTaskInstancesDTO
}
