// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { Phase } from '@/core/data/schemas/phase.schema'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { capitalize } from '@/common/capitalize.util'
import { Expose, Type } from 'class-transformer'
import { DTOProperty } from '@/common/dto-property.decorator'
import { synthesizeTaskDTO } from '@/core/presentation/task/dto/task.dto'

export class PhaseDTO extends SchemaToDtoClass(Phase) {}

export function synthesizePhaseDTO(courseData: CourseData, phaseData: PhaseData) {
    class SynthesizedPhaseDTO extends OmitType<PhaseDTO, keyof PhaseDTO>(phaseData.phaseDTO, ['type']) {
        @ApiProperty({
            oneOf: phaseData.tasks.map((task) => ({
                $ref: `#/components/schemas/${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(task.name)}TaskDTO`
            }))
        })
        @Type(() => PhaseDTO, {
            discriminator: {
                property: 'type',
                subTypes: [
                    ...phaseData.tasks.map((task) => ({
                        name: task.name,
                        value: synthesizeTaskDTO(courseData, phaseData, task)
                    }))
                ]
            },
            keepDiscriminatorProperty: true
        })
        @Expose()
        tasks: any[]

        @DTOProperty({ type: String, enum: [phaseData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedPhaseDTO, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseDTO`
    })

    return SynthesizedPhaseDTO
}
