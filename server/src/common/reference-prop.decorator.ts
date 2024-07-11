// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Type } from '@nestjs/common'
import { Prop } from '@nestjs/mongoose'
import mongoose from 'mongoose'

function isObjectId(obj: any): obj is mongoose.Schema.Types.ObjectId {
    return obj instanceof mongoose.Types.ObjectId
}

export function getObjectId<T extends { _id: mongoose.Schema.Types.ObjectId }>(
    ref: Reference<T>
): mongoose.Schema.Types.ObjectId | null {
    return isObjectId(ref) ? ref : ref?._id ?? null
}

export function getObjectIds<T extends { _id: mongoose.Schema.Types.ObjectId }>(
    ref: Reference<T[]>
): mongoose.Schema.Types.ObjectId[] | null {
    return ref?.map((r) => (isObjectId(r) ? r : r._id)) ?? null
}

export type Reference<T> = T extends (infer I)[]
    ? mongoose.Schema.Types.ObjectId[] | I[] | null
    : mongoose.Schema.Types.ObjectId | T | null

export function ReferenceProp(type: Type<unknown>, options?: { array?: boolean; required?: boolean }) {
    if (options?.array) {
        return Prop({
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: type.name }],
            required: options?.required ?? true,
            options: { ref: type, array: true }
        })
    } else {
        return Prop({
            type: mongoose.Schema.Types.ObjectId,
            ref: type.name,
            required: options?.required ?? true,
            options: { ref: type }
        })
    }
}
