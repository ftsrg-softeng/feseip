// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { FieldSchema } from './SmartEditDialog'
import { InputNumber } from 'primereact/inputnumber'
import { Checkbox } from 'primereact/checkbox'

type TextFieldProps = {
    dataKey: string
    data: number | null
    schema: FieldSchema<{ type: 'number'; nullable?: boolean }>
    onEdit: (data: number | null) => void
}

function SmartEditNumberField({ dataKey, data, schema, onEdit }: TextFieldProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            <InputNumber
                id={dataKey}
                className="flex-grow-1"
                value={data ?? 0}
                showButtons
                useGrouping={false}
                disabled={schema.disabled || data === null}
                onChange={(e) => {
                    onEdit(e.value ?? 0)
                }}
            />
            {schema.schema.nullable && (
                <>
                    <Checkbox
                        id={`${dataKey}-null`}
                        checked={data === null}
                        onChange={(e) => {
                            onEdit(e.checked ? null : 0)
                        }}
                    />
                    <label htmlFor={`${dataKey}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartEditNumberField
