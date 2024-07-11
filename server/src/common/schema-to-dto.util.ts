// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import mongoose, { HydratedDocument } from 'mongoose'

import { TypeMetadataStorage } from '@nestjs/mongoose/dist/storages/type-metadata.storage'
import { Type } from '@nestjs/common'
import { DTOProperty } from './dto-property.decorator'
import { plainToInstance } from 'class-transformer'
import { UserRole } from '@/core/data/schemas/user.schema'

export type SchemaToDtoType<TSchema> = {
    [K in keyof TSchema]: TSchema[K] extends mongoose.Schema.Types.ObjectId ? string : SchemaToDtoType<TSchema[K]>
}

function mongooseSchemaTypeToSwaggerType(propertyOptions: any): any {
    const propertyType = propertyOptions.type as Type<unknown>

    const refType = propertyOptions?.options?.ref
    const subtypeMetadata = refType
        ? TypeMetadataStorage.getSchemaMetadataByTarget(refType as Type<unknown>)
        : undefined

    if (propertyType === String) {
        if (propertyOptions.enum) {
            return { type: 'string', enum: Object.values(propertyOptions.enum) }
        } else {
            return { type: 'string' }
        }
    } else if (propertyType === mongoose.Schema.Types.ObjectId && !subtypeMetadata) {
        return { type: 'string' }
    } else if (propertyType === Number) {
        return { type: 'number' }
    } else if (propertyType === Boolean) {
        return { type: 'boolean' }
    } else if (propertyType === Date) {
        return { type: 'string', format: 'date-time' }
    } else if (propertyType === mongoose.Schema.Types.Mixed) {
        return { type: 'object' }
    } else if (Array.isArray(propertyType) && propertyType.length > 0) {
        // noinspection JSPotentiallyInvalidTargetOfIndexedPropertyAccess
        return { type: 'array', items: mongooseSchemaTypeToSwaggerType(propertyType[0]) }
    } else if (subtypeMetadata) {
        const properties = subtypeMetadata.properties ?? []

        return {
            type: 'object',
            oneOf: [
                { type: 'string' },
                {
                    type: 'object',
                    properties: Object.fromEntries(
                        properties.map((property) => {
                            const propertyOptions = property.options as any
                            return [
                                property.propertyKey,
                                {
                                    ...mongooseSchemaTypeToSwaggerType(propertyOptions),
                                    nullable: !propertyOptions.required || !!propertyOptions.ref
                                }
                            ]
                        })
                    ) as any,
                    required: properties.map((property) => property.propertyKey)
                }
            ]
        }
    } else if (typeof propertyType === 'object') {
        const propertyKeys = Object.keys(propertyOptions.type)
        return {
            type: 'object',
            properties: Object.fromEntries(
                propertyKeys.map((key) => {
                    return [
                        key,
                        {
                            ...mongooseSchemaTypeToSwaggerType(propertyOptions.type[key]),
                            nullable: !propertyOptions.type[key].required || !!propertyOptions.type[key].ref
                        }
                    ]
                })
            ) as any,
            required: propertyKeys
        }
    } else if (propertyType === undefined) {
        const propertyKeys = Object.keys(propertyOptions)
        return {
            type: 'object',
            properties: Object.fromEntries(
                propertyKeys.map((key) => {
                    return [
                        key,
                        {
                            ...mongooseSchemaTypeToSwaggerType(propertyOptions[key]),
                            nullable: !propertyOptions[key].required || !!propertyOptions[key].ref
                        }
                    ]
                })
            ) as any,
            required: propertyKeys
        }
    } else {
        throw new Error(`${propertyType}: Unknown type`)
    }
}

export function SchemaToDtoClass<TSchema, TBDTO = unknown>(
    schema: Type<TSchema>,
    baseSchema?: Type<TBDTO>
): Type<SchemaToDtoType<TSchema>> {
    const schemaMetadata = TypeMetadataStorage.getSchemaMetadataByTarget(schema)
    if (!schemaMetadata) {
        throw new Error('Parameter is not a schema')
    }

    const baseSchemaMetadata = baseSchema ? TypeMetadataStorage.getSchemaMetadataByTarget(baseSchema) : null
    if (baseSchemaMetadata === undefined) {
        throw new Error('Parameter is not a schema')
    }

    const properties = (schemaMetadata.properties ?? []).concat(baseSchemaMetadata?.properties ?? [])

    const dtoClass = class {}
    for (const property of properties) {
        const propertyOptions = property.options as any

        DTOProperty({
            ...mongooseSchemaTypeToSwaggerType(propertyOptions),
            required: true,
            nullable: !propertyOptions.required || !!propertyOptions.ref
        })(dtoClass.prototype, property.propertyKey)
    }

    return dtoClass as Type<SchemaToDtoType<TSchema>>
}

function stripObjectIds(document: Record<string, unknown>): Record<string, unknown> {
    const propertyKeys = Object.keys(document)
    for (const propertyKey of propertyKeys) {
        const property = document[propertyKey]
        if (property instanceof mongoose.Types.ObjectId) {
            document[propertyKey] = property.toString()
        } else if (Array.isArray(property)) {
            document[propertyKey] = property.map((p) => stripObjectIds(p))
        } else if (property === null || property === undefined) {
            document[propertyKey] = null
        } else if (typeof property === 'object') {
            document[propertyKey] = stripObjectIds(property as Record<string, unknown>)
        }
    }
    return document
}

function isHydratedDocument<TSchema>(document: any): document is HydratedDocument<TSchema> {
    return !!document.toObject
}

export function documentToDto<TSchema>(
    document: TSchema | HydratedDocument<TSchema>,
    dtoType: Type<SchemaToDtoType<TSchema>>
) {
    const documentObject = isHydratedDocument<TSchema>(document)
        ? stripObjectIds(document.toObject())
        : stripObjectIds(document as Record<string, unknown>)
    return plainToInstance(dtoType, documentObject, {
        excludeExtraneousValues: true,
        groups: Object.values(UserRole)
    })
}
