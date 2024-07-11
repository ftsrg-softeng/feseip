// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import mongoose from 'mongoose'
import { Reference } from '@/common/reference-prop.decorator'
import { Task } from '@/core/data/schemas/task.schema'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'

export interface ITaskInstance {
    _id: mongoose.Schema.Types.ObjectId
    phaseInstances: Reference<PhaseInstance[]>
    task: Reference<Task>
    type: string
    locked: boolean
    blocked: boolean
    history: {
        event: string
        successful: boolean
        timestamp: Date
        log: mongoose.Schema.Types.ObjectId | null
        data: any
    }[]
}

export abstract class ATaskInstance implements ITaskInstance {
    _id: mongoose.Schema.Types.ObjectId
    phaseInstances: Reference<PhaseInstance[]>
    task: Reference<Task>
    type: string
    locked: boolean
    blocked: boolean
    history: {
        event: string
        successful: boolean
        timestamp: Date
        log: mongoose.Schema.Types.ObjectId | null
        data: any
    }[]
}
