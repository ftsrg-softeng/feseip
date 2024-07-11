// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import SwaggerSchema from '../../../server/dist/swagger.json' assert { type: 'json' }
import { capitalize } from '@/utils/capitalize'
export default SwaggerSchema

export function updateCourseArgsSchema(courseType: string) {
    return (SwaggerSchema.components.schemas as any)[`Update${capitalize(courseType)}CourseArgs`]
}

export function updatePhaseArgsSchema(courseType: string, phaseType: string) {
    return (SwaggerSchema.components.schemas as any)[`Update${capitalize(courseType)}${capitalize(phaseType)}PhaseArgs`]
}

export function updateTaskArgsSchema(courseType: string, phaseType: string, taskType: string) {
    return (SwaggerSchema.components.schemas as any)[
        `Update${capitalize(courseType)}${capitalize(phaseType)}${capitalize(taskType)}TaskArgs`
    ]
}

export function actionArgsSchema(actionType: string, courseType: string, phaseType?: string, taskType?: string) {
    return (SwaggerSchema.components.schemas as any)[
        `${capitalize(courseType)}${phaseType ? capitalize(phaseType) : ''}${taskType ? capitalize(taskType) : ''}${capitalize(actionType)}ActionArgs`
    ]
}

export function updateCourseInstanceArgsSchema(courseType: string) {
    return (SwaggerSchema.components.schemas as any)[`Update${capitalize(courseType)}CourseInstanceArgs`]
}

export function updatePhaseInstanceArgsSchema(courseType: string, phaseType: string) {
    return (SwaggerSchema.components.schemas as any)[
        `Update${capitalize(courseType)}${capitalize(phaseType)}PhaseInstanceArgs`
    ]
}

export function updateTaskInstanceArgsSchema(courseType: string, phaseType: string, taskType: string) {
    return (SwaggerSchema.components.schemas as any)[
        `Update${capitalize(courseType)}${capitalize(phaseType)}${capitalize(taskType)}TaskInstanceArgs`
    ]
}
