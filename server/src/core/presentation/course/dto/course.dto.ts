// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Course } from '@/core/data/schemas/course.schema'
import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { CourseData } from '@/decorators/course.decorator'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { capitalize } from '@/common/capitalize.util'
import { Expose, Type } from 'class-transformer'
import { PhaseDTO, synthesizePhaseDTO } from '@/core/presentation/phase/dto/phase.dto'
import { DTOProperty } from '@/common/dto-property.decorator'

export class CourseDTO extends SchemaToDtoClass(Course) {}

export function synthesizeCourseDTO(courseData: CourseData) {
    class SynthesizedCourseDTO extends OmitType<CourseDTO, keyof CourseDTO>(courseData.courseDTO, ['type']) {
        @ApiProperty({
            oneOf: courseData.phases.map((phase) => ({
                $ref: `#/components/schemas/${capitalize(courseData.name)}${capitalize(phase.name)}PhaseDTO`
            }))
        })
        @Type(() => PhaseDTO, {
            discriminator: {
                property: 'type',
                subTypes: [
                    ...courseData.phases.map((phase) => ({
                        name: phase.name,
                        value: synthesizePhaseDTO(courseData, phase)
                    }))
                ]
            },
            keepDiscriminatorProperty: true
        })
        @Expose()
        phases: any[]

        @DTOProperty({ type: String, enum: [courseData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedCourseDTO, 'name', {
        value: `${capitalize(courseData.name)}CourseDTO`
    })

    return SynthesizedCourseDTO
}
