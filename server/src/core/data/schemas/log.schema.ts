// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { Reference, ReferenceProp } from '@/common/reference-prop.decorator'
import { Course } from '@/core/data/schemas/course.schema'

export enum LogType {
    ACTION = 'action',
    SCHEDULE = 'schedule'
}

export type LogDocument = HydratedDocument<Log>

@Schema()
export class Log {
    @Prop({ required: true, auto: true })
    _id: mongoose.Schema.Types.ObjectId

    @ReferenceProp(Course)
    course: Reference<Course>

    @Prop({ type: String, required: true, enum: LogType })
    type: LogType

    @Prop({ required: true })
    name: string

    @Prop({ required: true })
    timestamp: Date
}

export const LogSchema = SchemaFactory.createForClass(Log)
