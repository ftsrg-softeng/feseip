// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { Reference, ReferenceProp } from '@/common/reference-prop.decorator'
import { Course } from '@/core/data/schemas/course.schema'

export type InternalErrorDocument = HydratedDocument<InternalError>

@Schema()
export class InternalError {
    @Prop({ required: true, auto: true })
    _id: mongoose.Schema.Types.ObjectId

    @ReferenceProp(Course)
    course: Reference<Course>

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: false })
    targetContext: mongoose.Schema.Types.ObjectId | null

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: false })
    log: mongoose.Schema.Types.ObjectId | null

    @Prop({ required: true })
    message: string

    @Prop({ required: true })
    stack: string

    @Prop({ required: true })
    timestamp: Date
}

export const InternalErrorSchema = SchemaFactory.createForClass(InternalError)
