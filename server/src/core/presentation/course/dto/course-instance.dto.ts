// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { CourseInstance } from '@/core/data/schemas/course-instance.schema'
import { CourseData } from '@/decorators/course.decorator'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { capitalize } from '@/common/capitalize.util'
import { Expose, Type } from 'class-transformer'
import { PhaseDTO } from '@/core/presentation/phase/dto/phase.dto'
import { DTOProperty } from '@/common/dto-property.decorator'
import { synthesizePhaseInstanceWithTaskInstancesDTO } from '@/core/presentation/phase/dto/phase-instance.dto'

export class CourseInstanceDTO extends SchemaToDtoClass(CourseInstance) {}

export function synthesizeCourseInstanceDTO(courseData: CourseData) {
    class SynthesizedCourseInstanceDTO extends OmitType<CourseInstanceDTO, keyof CourseInstanceDTO>(
        courseData.courseInstanceDTO,
        ['type']
    ) {
        @DTOProperty({ type: String, enum: [courseData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedCourseInstanceDTO, 'name', {
        value: `${capitalize(courseData.name)}CourseInstanceDTO`
    })

    return SynthesizedCourseInstanceDTO
}

export function synthesizeCourseInstanceWithPhaseAndTaskInstancesDTO(courseData: CourseData) {
    class SynthesizedCourseInstanceWithPhaseAndTaskInstancesDTO extends OmitType<
        CourseInstanceDTO,
        keyof CourseInstanceDTO
    >(courseData.courseInstanceDTO, ['type']) {
        @ApiProperty({
            oneOf: courseData.phases.map((phase) => ({
                $ref: `#/components/schemas/${capitalize(courseData.name)}${capitalize(phase.name)}PhaseInstanceWithTaskInstancesDTO`
            }))
        })
        @Type(() => PhaseDTO, {
            discriminator: {
                property: 'type',
                subTypes: [
                    ...courseData.phases.map((phase) => ({
                        name: phase.name,
                        value: synthesizePhaseInstanceWithTaskInstancesDTO(courseData, phase)
                    }))
                ]
            },
            keepDiscriminatorProperty: true
        })
        @Expose()
        phaseInstances: any[]

        @DTOProperty({ type: String, enum: [courseData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedCourseInstanceWithPhaseAndTaskInstancesDTO, 'name', {
        value: `${capitalize(courseData.name)}CourseInstanceWithPhaseAndTaskInstancesDTO`
    })

    return SynthesizedCourseInstanceWithPhaseAndTaskInstancesDTO
}
