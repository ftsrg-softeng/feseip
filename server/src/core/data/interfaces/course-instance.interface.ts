// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import mongoose from 'mongoose'
import { Reference } from '@/common/reference-prop.decorator'
import { User } from '@/core/data/schemas/user.schema'
import { Course } from '@/core/data/schemas/course.schema'

export interface ICourseInstance {
    _id: mongoose.Schema.Types.ObjectId
    user: Reference<User>
    course: Reference<Course>
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

export abstract class ACourseInstance implements ICourseInstance {
    _id: mongoose.Schema.Types.ObjectId
    user: Reference<User>
    course: Reference<Course>
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
