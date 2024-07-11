// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ACourse } from '@/core/data/interfaces/course.interface'

export type SoftengExtraCourseDocument = HydratedDocument<SoftengExtraCourse>

@Schema()
export class SoftengExtraCourse extends ACourse {
    @Prop({ type: String, required: false, default: null })
    githubOrgName: string | null = null

    @Prop({ type: String, required: false, default: null })
    repositoryPath: string | null = null

    @Prop({ type: String, required: false, default: null })
    repositoryNamePrefix: string | null = null

    @Prop({ type: String, required: false, default: null })
    installersUrl: string | null = null

    @Prop({
        type: {
            hu: { type: String, required: true },
            de: { type: String, required: true }
        },
        required: false,
        default: null
    })
    platformIss: { hu: string; de: string } | null = null

    @Prop({
        type: {
            hu: { type: String, required: true },
            de: { type: String, required: true }
        },
        required: false,
        default: null
    })
    platformClientId: { hu: string; de: string } | null = null

    @Prop({
        type: {
            hu: { type: String, required: true },
            de: { type: String, required: true }
        },
        required: false,
        default: null
    })
    pointsLineIds: { hu: string; de: string } | null = null

    @Prop({
        type: {
            hu: { type: String, required: true },
            de: { type: String, required: true }
        },
        required: false,
        default: null
    })
    imscPointsLineIds: { hu: string; de: string } | null = null
}

export const SoftengExtraCourseSchema = SchemaFactory.createForClass(SoftengExtraCourse)
