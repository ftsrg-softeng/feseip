// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Inject, Module } from '@nestjs/common'
import { CourseData } from '@/decorators/course.decorator'
import { capitalize } from '@/common/capitalize.util'

function courseDeclarationInjectionToken(courseData: CourseData) {
    return `${capitalize(courseData.name)}CourseDeclarationService`
}

export function InjectCourseDeclaration(courseData: CourseData) {
    return Inject(courseDeclarationInjectionToken(courseData))
}

export function synthesizeCourseDeclarationModule(courseData: CourseData, ...dependencies: any[]) {
    const providers = [
        {
            provide: courseDeclarationInjectionToken(courseData),
            useClass: courseData.target
        }
    ]

    @Module({
        imports: [...dependencies],
        providers: providers,
        exports: providers
    })
    class CourseDeclarationModule {}

    return CourseDeclarationModule
}
