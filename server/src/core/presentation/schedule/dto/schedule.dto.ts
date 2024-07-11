// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { IsIn } from 'class-validator'
import { ActionData, getActionName } from '@/decorators/action.decorator'
import { Expose, Type } from 'class-transformer'
import { capitalize } from '@/common/capitalize.util'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { DTOProperty } from '@/common/dto-property.decorator'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { Schedule } from '@/core/data/schemas/schedule.schema'

export type ActionEntry = { course: CourseData; phase?: PhaseData; task?: TaskData; action: ActionData }

function synthesizeScheduleSchemaDTO({ course, phase, task, action }: ActionEntry) {
    class SynthesizedScheduleSchemaDTO {
        @IsIn([getActionName(action, course, phase, task)])
        @Expose()
        action: string

        @Type(() =>
            action?.argumentType
                ? action.argumentType === 'request' || action.argumentType === 'requestResponse'
                    ? Object
                    : action.argumentType
                : Object
        )
        @Expose()
        params: object
    }

    Object.defineProperty(SynthesizedScheduleSchemaDTO, 'name', {
        value: `${capitalize(course.name)}${phase ? capitalize(phase.name) : ''}${task ? capitalize(task.name) : ''}${capitalize(action.name)}ScheduleSchemaDTO`
    })

    return SynthesizedScheduleSchemaDTO
}

export function synthesizeScheduleDTO(courseData: CourseData, actions: ActionEntry[]) {
    class SynthesizedScheduleSchemaDTO {
        @DTOProperty({ type: 'string' })
        action: string

        @DTOProperty({ type: 'object' })
        params: object
    }

    Object.defineProperty(SynthesizedScheduleSchemaDTO, 'name', {
        value: `${capitalize(courseData.name)}ScheduleSchemaDTO`
    })

    class SynthesizedScheduleDTO extends OmitType(SchemaToDtoClass(Schedule), ['schema']) {
        @ApiProperty({
            oneOf: actions.map((action) => ({
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: [getActionName(action.action, action.course, action.phase, action.task)]
                    },
                    params: {
                        $ref: `#/components/schemas/${capitalize(action.course.name)}${action.phase ? capitalize(action.phase.name) : ''}${action.task ? capitalize(action.task.name) : ''}${capitalize(action.action.name)}ActionArgs`
                    }
                },
                required: ['action', 'params']
            }))
        })
        @Type(() => SynthesizedScheduleSchemaDTO, {
            discriminator: {
                property: 'action',
                subTypes: actions.map((action) => ({
                    name: getActionName(action.action, action.course, action.phase, action.task),
                    value: synthesizeScheduleSchemaDTO(action)
                }))
            },
            keepDiscriminatorProperty: true
        })
        @Expose()
        schema: { action: string; params: object }[]
    }

    Object.defineProperty(SynthesizedScheduleDTO, 'name', {
        value: `${capitalize(courseData.name)}ScheduleDTO`
    })

    return SynthesizedScheduleDTO
}
