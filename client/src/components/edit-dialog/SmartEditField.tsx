// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { FieldSchema } from './SmartEditDialog'
import React from 'react'
import SmartSelectField from './SmartEditSelectField'
import SmartEditTextField from './SmartEditTextField'
import SmartEditCheckBox from './SmartEditCheckBox'
import SmartEditArrayField from './SmartEditArrayField'
import SmartEditUnknownField from './SmartEditUnknownField'
import SmartEditObjectField from './SmartEditObjectField'
import SmartEditNumberField from './SmartEditNumberField'
import SmartEditTextArea from '@/components/edit-dialog/SmartEditTextArea'
import SmartEditDateField from '@/components/edit-dialog/SmartEditDateField'

type FieldProps = {
    value: any
    dataKey: string
    configKeyPrefix: string
    config?: { [key: string]: { label?: string; disabled?: boolean; hidden?: boolean } }
    fieldSchema: FieldSchema
    onEdit: (data: any) => void
}

function SmartEditField({ value, dataKey, configKeyPrefix, config, fieldSchema, onEdit }: FieldProps) {
    if (fieldSchema.hidden) return <React.Fragment></React.Fragment>
    if (fieldSchema.schema.type === 'string') {
        if (fieldSchema.schema.enum) {
            return <SmartSelectField dataKey={dataKey} data={value} schema={fieldSchema as any} onEdit={onEdit} />
        } else if (fieldSchema.schema.format === 'text') {
            return <SmartEditTextArea dataKey={dataKey} data={value} schema={fieldSchema as any} onEdit={onEdit} />
        } else if (fieldSchema.schema.format === 'date-time') {
            return <SmartEditDateField dataKey={dataKey} data={value} schema={fieldSchema as any} onEdit={onEdit} />
        } else {
            return <SmartEditTextField dataKey={dataKey} data={value} schema={fieldSchema as any} onEdit={onEdit} />
        }
    } else if (fieldSchema.schema.type === 'boolean') {
        return <SmartEditCheckBox dataKey={dataKey} data={value} schema={fieldSchema as any} onEdit={onEdit} />
    } else if (fieldSchema.schema.type === 'number') {
        return <SmartEditNumberField dataKey={dataKey} data={value} schema={fieldSchema as any} onEdit={onEdit} />
    } else if (fieldSchema.schema.type === 'array') {
        return (
            <SmartEditArrayField
                dataKeyPrefix={dataKey}
                configKeyPrefix={configKeyPrefix}
                config={config}
                data={value}
                schema={fieldSchema as any}
                onEdit={onEdit}
            />
        )
    } else if (fieldSchema.schema.type === 'object') {
        return (
            <SmartEditObjectField
                dataKeyPrefix={dataKey}
                configKeyPrefix={configKeyPrefix}
                config={config}
                data={value}
                schema={fieldSchema as any}
                onEdit={onEdit}
            />
        )
    } else {
        return <SmartEditUnknownField dataKey={dataKey} data={value} schema={fieldSchema as any} />
    }
}

export default SmartEditField
