// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { OmitType } from '@nestjs/swagger'
import { CourseInstanceDTO } from '@/core/presentation/course/dto/course-instance.dto'
import { capitalize } from '@/common/capitalize.util'

export function synthesizeUpdateCourseInstanceArgs(courseData: CourseData) {
    class SynthesizedUpdateCourseInstanceArgs extends OmitType<CourseInstanceDTO, keyof CourseInstanceDTO>(
        courseData.courseInstanceDTO,
        ['_id', 'type', 'user', 'course', 'locked', 'history']
    ) {}

    Object.defineProperty(SynthesizedUpdateCourseInstanceArgs, 'name', {
        value: `Update${capitalize(courseData.name)}CourseInstanceArgs`
    })

    return SynthesizedUpdateCourseInstanceArgs
}
