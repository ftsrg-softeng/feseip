// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { InputText } from 'primereact/inputtext'
import { FieldSchema } from './SmartEditDialog'
import { Checkbox } from 'primereact/checkbox'

type TextFieldProps = {
    dataKey: string
    data: string | null
    schema: FieldSchema<{ type: 'string'; nullable?: boolean }>
    onEdit: (data: string | null) => void
}

function SmartEditTextField({ dataKey, data, schema, onEdit }: TextFieldProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            <InputText
                id={dataKey}
                className="flex-grow-1"
                value={data ?? ''}
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
                            onEdit(e.checked ? null : '')
                        }}
                    />
                    <label htmlFor={`${dataKey}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartEditTextField
