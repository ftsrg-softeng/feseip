// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { Dropdown } from 'primereact/dropdown'
import { FieldSchema } from './SmartEditDialog'
import { Checkbox } from 'primereact/checkbox'

type SelectFieldProps = {
    dataKey: string
    data: string | null
    schema: FieldSchema<{ type: 'string'; nullable?: boolean; enum: string[] }>
    onEdit: (data: string | null) => void
}

function SmartSelectField({ dataKey, data, schema, onEdit }: SelectFieldProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            <Dropdown
                inputId={dataKey}
                className="flex-grow-1"
                value={data ?? schema.schema.enum[0]}
                options={schema.schema.enum}
                checkmark={true}
                disabled={schema.disabled || data === null}
                onChange={(e) => {
                    onEdit(e.target.value)
                }}
            />
            {schema.schema.nullable && (
                <>
                    <Checkbox
                        id={`${dataKey}-null`}
                        checked={data === null}
                        onChange={(e) => {
                            onEdit(e.checked ? null : schema.schema.enum[0])
                        }}
                    />
                    <label htmlFor={`${dataKey}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartSelectField
