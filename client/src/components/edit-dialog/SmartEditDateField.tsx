// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { FieldSchema } from './SmartEditDialog'
import { Checkbox } from 'primereact/checkbox'
import { Calendar } from 'primereact/calendar'

type TextFieldProps = {
    dataKey: string
    data: string | null
    schema: FieldSchema<{ type: 'string'; nullable?: boolean }>
    onEdit: (data: string | null) => void
}

function SmartEditDateField({ dataKey, data, schema, onEdit }: TextFieldProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            <Calendar
                id={dataKey}
                className="flex-grow-1"
                value={data ? new Date(data) : new Date()}
                disabled={schema.disabled || data === null}
                showTime
                hourFormat="24"
                selectionMode="single"
                onChange={(e) => {
                    onEdit(e.value?.toISOString() ?? null)
                }}
            />
            {schema.schema.nullable && (
                <>
                    <Checkbox
                        id={`${dataKey}-null`}
                        checked={data === null}
                        onChange={(e) => {
                            onEdit(e.checked ? null : new Date().toISOString())
                        }}
                    />
                    <label htmlFor={`${dataKey}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartEditDateField
