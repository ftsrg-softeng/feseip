// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Schema } from 'swagger-schema-official'
import { generateDefaultValue } from '@/components/edit-dialog/SmartEditDialog'

export function sanitize<T>(obj: T, schema: WidenSchemaType): T {
    const anyObj = obj as any
    if (!schema.type) {
        return anyObj
        //throw new Error('Unhandled type')
    } else if (['string', 'number', 'boolean'].includes(schema.type)) {
        return anyObj
    } else if (schema.type === 'array') {
        return anyObj.map((o: any) => sanitize(o, schema.items as WidenSchemaType))
    } else if (schema.type === 'object') {
        for (const propertyKey of Object.keys(anyObj)) {
            if (schema.properties?.[propertyKey]) {
                if (anyObj[propertyKey]) {
                    anyObj[propertyKey] = sanitize(anyObj[propertyKey], schema.properties?.[propertyKey])
                } else {
                    anyObj[propertyKey] = generateDefaultValue(schema.properties?.[propertyKey])
                }
            } else {
                delete anyObj[propertyKey]
            }
        }
        return anyObj
    } else {
        throw new Error('Unhandled type')
    }
}

export type WidenSchemaType = Omit<Schema, 'type' | 'properties' | 'items'> & {
    type: string
    nullable?: boolean
    properties?: { [propertyName: string]: WidenSchemaType } | undefined
    items?: WidenSchemaType | WidenSchemaType[] | undefined
}
