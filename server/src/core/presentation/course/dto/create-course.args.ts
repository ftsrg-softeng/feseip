// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { OmitType } from '@nestjs/swagger'
import { CourseDTO } from './course.dto'
import { CourseData } from '@/decorators/course.decorator'
import { DTOProperty } from '@/common/dto-property.decorator'

export class CreateCourseArgs extends OmitType(CourseDTO, ['_id', 'locked', 'blocked', 'history']) {}

export function synthesizeCreateCourseArgs(courseData: CourseData[]) {
    class SynthesizedCreateCourseArgs extends OmitType(CreateCourseArgs, ['type']) {
        @DTOProperty({ type: 'string', enum: courseData.map((course) => course.name) })
        type: string
    }

    Object.defineProperty(SynthesizedCreateCourseArgs, 'name', {
        value: 'CreateCourseArgs'
    })

    return SynthesizedCreateCourseArgs
}
