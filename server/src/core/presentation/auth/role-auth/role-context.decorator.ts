// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { SetMetadata } from '@nestjs/common'

export enum RoleContextType {
    NULL = 'null',
    COURSE = 'course',
    COURSE_INSTANCE = 'course-instance',
    PHASE = 'phase',
    PHASE_INSTANCE = 'phase-instance',
    TASK = 'task',
    TASK_INSTANCE = 'task-instance'
}

export type RoleContextMetadataType =
    | { roleContextType: RoleContextType.NULL }
    | { roleContextType: RoleContextType.COURSE; courseParamName: string }
    | { roleContextType: RoleContextType.COURSE_INSTANCE; courseParamName: string }
    | { roleContextType: RoleContextType.PHASE; phaseParamName: string }
    | { roleContextType: RoleContextType.PHASE_INSTANCE; phaseParamName: string }
    | { roleContextType: RoleContextType.TASK; taskParamName: string }
    | { roleContextType: RoleContextType.TASK_INSTANCE; taskParamName: string }

export const ROLE_CONTEXT_METADATA_KEY = 'role-context'

export function RoleContext(roleContextType: RoleContextType.NULL): any
export function RoleContext(roleContextType: RoleContextType.COURSE, paramName: string): any
export function RoleContext(roleContextType: RoleContextType.COURSE_INSTANCE, paramName: string): any
export function RoleContext(roleContextType: RoleContextType.PHASE, paramName: string): any
export function RoleContext(roleContextType: RoleContextType.PHASE_INSTANCE, paramName: string): any
export function RoleContext(roleContextType: RoleContextType.TASK, paramName: string): any
export function RoleContext(roleContextType: RoleContextType.TASK_INSTANCE, paramName: string): any
export function RoleContext(roleContextType: RoleContextType, ...params: any[]): any
export function RoleContext(roleContextType: RoleContextType, ...params: any[]): any {
    switch (roleContextType) {
        case RoleContextType.NULL:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType })
        case RoleContextType.COURSE:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType, courseParamName: params[0] })
        case RoleContextType.COURSE_INSTANCE:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType, courseParamName: params[0] })
        case RoleContextType.PHASE:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType, phaseParamName: params[0] })
        case RoleContextType.PHASE_INSTANCE:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType, phaseParamName: params[0] })
        case RoleContextType.TASK:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType, taskParamName: params[0] })
        case RoleContextType.TASK_INSTANCE:
            return SetMetadata(ROLE_CONTEXT_METADATA_KEY, { roleContextType, taskParamName: params[0] })
    }
}
