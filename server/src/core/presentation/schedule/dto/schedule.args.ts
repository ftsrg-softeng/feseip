// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { Type } from '@nestjs/common'
import { OmitType } from '@nestjs/swagger'
import { capitalize } from '@/common/capitalize.util'

export function synthesizeScheduleArgs(courseData: CourseData, SynthesizedScheduleDTO: Type<unknown>) {
    class SynthesizedScheduleArgs extends OmitType(SynthesizedScheduleDTO, ['_id', 'course'] as never[]) {}

    Object.defineProperty(SynthesizedScheduleArgs, 'name', {
        value: `${capitalize(courseData.name)}ScheduleArgs`
    })

    return SynthesizedScheduleArgs
}
