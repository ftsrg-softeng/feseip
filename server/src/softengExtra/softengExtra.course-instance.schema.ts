// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ACourseInstance } from '@/core/data/interfaces/course-instance.interface'

export enum SoftengExtraCourseInstanceStatus {
    WAITING_FOR_GITHUB_USERNAME = 'waiting_for_github_username',
    DONE = 'done'
}

export enum SoftengExtraCourseInstanceLanguage {
    HU = 'hu',
    DE = 'de'
}

export type SoftengExtraCourseInstanceDocument = HydratedDocument<SoftengExtraCourseInstance>

@Schema()
export class SoftengExtraCourseInstance extends ACourseInstance {
    @Prop({
        type: String,
        required: true,
        enum: SoftengExtraCourseInstanceStatus,
        default: SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME
    })
    status: SoftengExtraCourseInstanceStatus = SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME

    @Prop({
        type: String,
        required: true,
        enum: SoftengExtraCourseInstanceLanguage,
        default: SoftengExtraCourseInstanceLanguage.HU
    })
    language: SoftengExtraCourseInstanceLanguage = SoftengExtraCourseInstanceLanguage.HU

    @Prop({ type: String, required: false, default: null })
    githubUsername: string | null = null

    @Prop({ type: Date, required: false, default: null })
    creationDate: Date | null = null

    @Prop({ type: Date, required: false, default: null })
    completionDate: Date | null = null

    @Prop({ type: Number, required: false, default: null })
    points: number | null = null

    @Prop({ type: Number, required: false, default: null })
    imscPoints: number | null = null
}

export const SoftengExtraCourseInstanceSchema = SchemaFactory.createForClass(SoftengExtraCourseInstance)
