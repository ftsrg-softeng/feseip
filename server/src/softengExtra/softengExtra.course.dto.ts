// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { SoftengExtraCourse } from './softengExtra.course.schema'
import { Course } from '@/core/data/schemas/course.schema'
import { UserRole } from '@/core/data/schemas/user.schema'
import { Expose } from 'class-transformer'

export class SoftengExtraCourseDTO extends SchemaToDtoClass(SoftengExtraCourse, Course) {
    // TODO: find a better solution than this
    @Expose({ groups: [UserRole.COURSE_ADMIN] })
    apiKey: string

    @Expose({ groups: [UserRole.COURSE_ADMIN] })
    repositoryPath: string | null = null

    @Expose({ groups: [UserRole.COURSE_ADMIN] })
    platformIss: { hu: string; de: string } | null = null

    @Expose({ groups: [UserRole.COURSE_ADMIN] })
    platformClientId: { hu: string; de: string } | null = null

    @Expose({ groups: [UserRole.COURSE_ADMIN] })
    pointsLineIds: { hu: string; de: string } | null = null

    @Expose({ groups: [UserRole.COURSE_ADMIN] })
    imscPointsLineIds: { hu: string; de: string } | null = null
}
