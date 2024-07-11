// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { applyDecorators, Injectable, SetMetadata, Type } from '@nestjs/common'
import mongoose, { HydratedDocument } from 'mongoose'
import { getTaskData, TaskData } from './task.decorator'
import { SchemaToDtoType } from '@/common/schema-to-dto.util'
import { IPhase } from '@/core/data/interfaces/phase.interface'
import { IPhaseInstance } from '@/core/data/interfaces/phase-instance.interface'
import { ActionData, getActionsMetadata } from '@/decorators/action.decorator'

export type PhaseProps<
    PSchema extends IPhase = IPhase,
    PISchema extends IPhaseInstance = IPhaseInstance,
    PDTO = SchemaToDtoType<PSchema>,
    PIDTO = SchemaToDtoType<PISchema>
> = {
    name: string

    tasks: Type<unknown>[]

    phaseSchema: mongoose.Schema<PSchema>
    phaseDTO: Type<PDTO>
    phaseDocumentToDto?: (document: PSchema | HydratedDocument<PSchema>) => PDTO

    phaseInstanceSchema: mongoose.Schema<PISchema>
    phaseInstanceDTO: Type<PIDTO>
    phaseInstanceDocumentToDto?: (document: PISchema | HydratedDocument<PISchema>) => PIDTO
}

export type PhaseData = Omit<PhaseProps, 'tasks'> & {
    tasks: TaskData[]
    target: Type<unknown>
    actions: ActionData[]
}

const PHASE_METADATA_KEY = 'phase'

export const DeclarePhase = (phaseData: PhaseProps) =>
    applyDecorators(Injectable(), SetMetadata(PHASE_METADATA_KEY, phaseData))

export function getPhaseData(phase: Type<unknown>): PhaseData {
    const phaseData = Reflect.getMetadata(PHASE_METADATA_KEY, phase) as PhaseProps | undefined
    if (!phaseData) {
        throw new Error(`Phase must be annotated with @${DeclarePhase.name}`)
    }
    return {
        ...phaseData,
        tasks: phaseData.tasks.map(getTaskData),
        target: phase,
        actions: getActionsMetadata(phase)
    }
}
