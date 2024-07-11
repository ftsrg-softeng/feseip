// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Inject, Module } from '@nestjs/common'
import { PhaseData } from '@/decorators/phase.decorator'
import { capitalize } from '@/common/capitalize.util'
import { CourseData } from '@/decorators/course.decorator'

function phaseDeclarationInjectionToken(courseData: CourseData, phaseData: PhaseData) {
    return `${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseDeclarationService`
}

export function InjectPhaseDeclaration(courseData: CourseData, phaseData: PhaseData) {
    return Inject(phaseDeclarationInjectionToken(courseData, phaseData))
}

export function synthesizePhaseDeclarationModule(courseData: CourseData, phaseData: PhaseData, ...dependencies: any[]) {
    const providers = [
        {
            provide: phaseDeclarationInjectionToken(courseData, phaseData),
            useClass: phaseData.target
        }
    ]

    @Module({
        imports: [...dependencies],
        providers: providers,
        exports: providers
    })
    class PhaseDeclarationModule {}

    return PhaseDeclarationModule
}
