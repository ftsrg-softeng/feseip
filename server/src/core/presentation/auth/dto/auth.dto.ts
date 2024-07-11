// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DTOProperty } from '@/common/dto-property.decorator'
import { UserDTO } from '@/core/presentation/user/dto/user.dto'
import { CourseData } from '@/decorators/course.decorator'

export function synthesizeAuthDTO(courseData: CourseData[]) {
    class AuthDTO {
        @DTOProperty({ type: UserDTO })
        user: UserDTO

        @DTOProperty()
        courseId: string

        @DTOProperty({ type: 'string', enum: courseData.map((c) => c.name) })
        courseType: string

        @DTOProperty({ isArray: true, type: 'string' })
        courseInstanceIds: string[]

        @DTOProperty()
        language: string
    }

    return AuthDTO
}
