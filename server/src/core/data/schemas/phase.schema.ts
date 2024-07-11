// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { Course } from './course.schema'
import { APhase } from '@/core/data/interfaces/phase.interface'
import { Reference, ReferenceProp } from '@/common/reference-prop.decorator'

export type PhaseDocument = HydratedDocument<Phase>

@Schema({
    discriminatorKey: 'type'
})
export class Phase extends APhase {
    @Prop({ required: true, auto: true })
    _id: mongoose.Schema.Types.ObjectId

    @ReferenceProp(Course)
    course: Reference<Course>

    @Prop({ type: Date, required: false, default: null })
    deadline: Date | null

    @Prop({ required: true })
    type: string

    @Prop({ required: true, default: false })
    locked: boolean

    @Prop({ required: true, default: false })
    blocked: boolean

    @Prop({
        required: true,
        default: [{ event: 'created', successful: true, timestamp: new Date(), data: {} }],
        type: [
            {
                event: { type: String, required: true },
                successful: { type: Boolean, required: true },
                timestamp: { type: Date, required: true },
                log: { type: mongoose.Schema.Types.ObjectId, ref: 'Log', required: false },
                data: { type: mongoose.Schema.Types.Mixed }
            }
        ]
    })
    history: {
        event: string
        successful: boolean
        timestamp: Date
        log: mongoose.Schema.Types.ObjectId | null
        data: any
    }[]
}

export const PhaseSchema = SchemaFactory.createForClass(Phase)
