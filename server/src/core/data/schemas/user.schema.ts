// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Course } from './course.schema'
import mongoose, { HydratedDocument } from 'mongoose'
import { Reference } from '@/common/reference-prop.decorator'

export enum UserRole {
    STUDENT = 'student',
    TEACHER = 'teacher',
    COURSE_ADMIN = 'courseAdmin'
}

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {
    @Prop({ required: true, auto: true })
    _id: mongoose.Schema.Types.ObjectId

    @Prop({ required: true })
    moodleId: number

    @Prop({ required: true })
    givenName: string

    @Prop({ required: true })
    familyName: string

    @Prop({
        type: [
            {
                course: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: Course.name,
                    required: true,
                    options: { ref: Course }
                },
                role: { type: String, required: true, enum: UserRole }
            }
        ]
    })
    roles: { course: Reference<Course>; role: UserRole }[]

    @Prop({ required: true, default: false })
    isAdmin: boolean
}

export const UserSchema = SchemaFactory.createForClass(User)
