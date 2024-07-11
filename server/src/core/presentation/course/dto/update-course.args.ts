// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { OmitType } from '@nestjs/swagger'
import { CourseDTO } from './course.dto'
import { CourseData } from '@/decorators/course.decorator'
import { capitalize } from '@/common/capitalize.util'

export class UpdateCourseArgs extends OmitType(CourseDTO, ['_id', 'type', 'history', 'locked']) {}

export function synthesizeUpdateCourseArgs(courseData: CourseData) {
    class SynthesizedUpdateCourseArgs extends OmitType<CourseDTO, keyof CourseDTO>(courseData.courseDTO, [
        '_id',
        'name',
        'type',
        'apiKey',
        'locked',
        'history'
    ]) {}

    Object.defineProperty(SynthesizedUpdateCourseArgs, 'name', {
        value: `Update${capitalize(courseData.name)}CourseArgs`
    })

    return SynthesizedUpdateCourseArgs
}
