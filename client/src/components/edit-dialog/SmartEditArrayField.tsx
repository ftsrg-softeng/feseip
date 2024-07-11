// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { FieldSchema, generateDefaultValue } from './SmartEditDialog'
import SmartEditField from './SmartEditField'
import { Checkbox } from 'primereact/checkbox'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'

type ArrayFieldProps = {
    dataKeyPrefix: string
    configKeyPrefix: string
    data: any[] | null
    schema: FieldSchema
    config?: { [key: string]: { label?: string; disabled?: boolean; hidden?: boolean } }
    onEdit: (data: any[] | null) => void
}

function SmartEditArrayField({
    dataKeyPrefix,
    configKeyPrefix,
    data,
    schema,
    config,
    onEdit
}: ArrayFieldProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            {data && (
                <div className="flex-grow-1">
                    {data.map((element, index) => {
                        const dataKey = `${dataKeyPrefix}[${index}]`
                        const fieldSchema: FieldSchema = {
                            ...(config?.[configKeyPrefix] ?? {}),
                            schema: schema.schema.items as any
                        }
                        return (
                            <div key={index} className="field grid">
                                <label
                                    htmlFor={
                                        !['array', 'object'].includes(fieldSchema.schema.type) ? dataKey : undefined
                                    }
                                    className="col-12 mb-2 md:col-1 md:mb-0 flex flex-row md:flex-column justify-content-start md:justify-content-center"
                                    title={fieldSchema.label ?? `[${index}]`}
                                >
                                    {fieldSchema.label ?? `[${index}]`}
                                    <Button
                                        size="small"
                                        icon="pi pi-times"
                                        severity="secondary"
                                        text
                                        pt={{ root: { className: classNames('p-1 w-min') } }}
                                        onClick={() => {
                                            const newData = [...data]
                                            newData.splice(index, 1)
                                            onEdit(newData)
                                        }}
                                    />
                                </label>
                                <div className="col-12 md:col-11">
                                    <SmartEditField
                                        value={element}
                                        dataKey={dataKey}
                                        configKeyPrefix={configKeyPrefix}
                                        fieldSchema={fieldSchema}
                                        onEdit={(v) => {
                                            const newData = [...data]
                                            newData[index] = v
                                            onEdit(newData)
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                    <div className="field grid mb-0">
                        <div className="col-12 mb-2 md:col-1 md:mb-0 flex flex-row md:flex-column justify-content-start md:justify-content-center">
                            <Button
                                size="small"
                                icon="pi pi-plus"
                                severity="secondary"
                                pt={{ root: { className: classNames('p-1 w-min') } }}
                                text
                                onClick={() => {
                                    onEdit([...data, generateDefaultValue(schema.schema.items as any)])
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {schema.schema.nullable && (
                <>
                    <Checkbox
                        id={`${dataKeyPrefix}-null`}
                        checked={data === null}
                        onChange={(e) => {
                            onEdit(e.checked ? null : [])
                        }}
                    />
                    <label htmlFor={`${dataKeyPrefix}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartEditArrayField
