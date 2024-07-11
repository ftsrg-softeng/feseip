// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InternalError } from '@/core/data/schemas/internal-error.schema'
import mongoose, { Model } from 'mongoose'

@Injectable()
export class ErrorService {
    constructor(@InjectModel(InternalError.name) private readonly errorModel: Model<InternalError>) {}

    public async getErrors(courseId: string | mongoose.Schema.Types.ObjectId): Promise<InternalError[]> {
        return this.errorModel.find({ course: courseId }).lean()
    }

    public async persistError(
        courseId: string | mongoose.Schema.Types.ObjectId,
        error: Omit<InternalError, '_id' | 'timestamp'>
    ) {
        const internalError = new this.errorModel({
            ...error,
            timestamp: new Date(),
            course: courseId
        })
        await internalError.save()
        const returnedError = await this.errorModel.findById(internalError._id).lean()
        return returnedError!
    }

    public async deleteError(
        courseId: string | mongoose.Schema.Types.ObjectId,
        errorId: string | mongoose.Schema.Types.ObjectId
    ) {
        const error = await this.errorModel.findOneAndDelete({ _id: errorId, course: courseId }).lean()
        if (!error) {
            throw new Error('Error not found')
        }
    }

    public async deleteAllErrors(courseId: string | mongoose.Schema.Types.ObjectId) {
        await this.errorModel.deleteMany({ course: courseId })
    }
}
