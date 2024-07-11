// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { FieldSchema, generateDefaultValue } from './SmartEditDialog'
import SmartEditField from './SmartEditField'
import { Checkbox } from 'primereact/checkbox'

type ObjectFieldProps = {
    dataKeyPrefix?: string
    configKeyPrefix?: string
    data: Record<string, any> | null
    schema: FieldSchema
    config?: { [key: string]: { label?: string; disabled?: boolean; hidden?: boolean } }
    onEdit: (data: any) => void
}

function SmartEditObjectField({
    dataKeyPrefix,
    configKeyPrefix,
    data,
    schema,
    config,
    onEdit
}: ObjectFieldProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            {schema.schema.properties && data && (
                <div className="flex-grow-1">
                    {Object.keys(schema.schema.properties).map((key, index, properties) => {
                        const value = data[key]
                        const dataKey = dataKeyPrefix ? `${dataKeyPrefix}.${key}` : key
                        const configKey = configKeyPrefix ? `${configKeyPrefix}.${key}` : key
                        const fieldSchema: FieldSchema = {
                            ...(config?.[configKey] ?? {}),
                            schema: schema.schema.properties![key]
                        }
                        return (
                            <div key={key} className={`field grid ${index === properties.length - 1 ? 'mb-0' : ''}`}>
                                <label
                                    htmlFor={
                                        !['array', 'object'].includes(fieldSchema.schema.type) ? dataKey : undefined
                                    }
                                    title={fieldSchema.label ?? key}
                                    className="col-12 mb-2 md:col-3 md:mb-0"
                                >
                                    {fieldSchema.label ?? key}
                                </label>
                                <div className="col-12 md:col-9">
                                    <SmartEditField
                                        value={value}
                                        dataKey={dataKey}
                                        configKeyPrefix={configKey}
                                        config={config}
                                        fieldSchema={fieldSchema}
                                        onEdit={(v) => {
                                            onEdit({ ...data, [key]: v })
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            {schema.schema.nullable && (
                <>
                    <Checkbox
                        id={`${dataKeyPrefix}-null`}
                        checked={data === null}
                        onChange={(e) => {
                            onEdit(e.checked ? null : generateDefaultValue(schema.schema, true))
                        }}
                    />
                    <label htmlFor={`${dataKeyPrefix}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartEditObjectField
