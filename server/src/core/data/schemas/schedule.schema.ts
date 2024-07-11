// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import mongoose, { HydratedDocument } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Reference, ReferenceProp } from '@/common/reference-prop.decorator'
import { Course } from '@/core/data/schemas/course.schema'

export type ScheduleDocument = HydratedDocument<Schedule>

@Schema()
export class Schedule {
    @Prop({ required: true, auto: true })
    _id: mongoose.Schema.Types.ObjectId

    @ReferenceProp(Course)
    course: Reference<Course>

    @Prop({ required: true })
    name: string

    @Prop({ required: true })
    cron: string

    @Prop({
        type: [
            { action: { type: String, required: true }, params: { type: mongoose.Schema.Types.Mixed, required: true } }
        ],
        required: true
    })
    schema: { action: string; params: object }[]

    @Prop({ required: true })
    courseInstanceFilter: string

    @Prop({ required: true, default: false })
    running: boolean = false
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule)
