// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Inject, Module } from '@nestjs/common'
import { TaskData } from '@/decorators/task.decorator'
import { capitalize } from '@/common/capitalize.util'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'

function taskDeclarationInjectionToken(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    return `${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(taskData.name)}TaskDeclarationService`
}

export function InjectTaskDeclaration(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    return Inject(taskDeclarationInjectionToken(courseData, phaseData, taskData))
}

export function synthesizeTaskDeclarationModule(
    courseData: CourseData,
    phaseData: PhaseData,
    taskData: TaskData,
    ...dependencies: any[]
) {
    const providers = [
        {
            provide: taskDeclarationInjectionToken(courseData, phaseData, taskData),
            useClass: taskData.target
        }
    ]

    @Module({
        imports: [...dependencies],
        providers: providers,
        exports: providers
    })
    class TaskDeclarationModule {}

    return TaskDeclarationModule
}
