// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { FieldSchema } from './SmartEditDialog'
import { Checkbox } from 'primereact/checkbox'

type CheckBoxProps = {
    dataKey: string
    data: boolean | null
    schema: FieldSchema<{ type: 'boolean'; nullable?: boolean }>
    onEdit: (data: boolean | null) => void
}

function SmartEditCheckBox({ dataKey, data, schema, onEdit }: CheckBoxProps): ReactNode {
    return (
        <div className="flex align-items-center gap-2">
            <Checkbox
                inputId={dataKey}
                className="flex-grow-1"
                checked={data ?? false}
                disabled={schema.disabled || data === null}
                onChange={(e) => {
                    onEdit(e.checked!)
                }}
            />
            {schema.schema.nullable && (
                <>
                    <Checkbox
                        id={`${dataKey}-null`}
                        checked={data === null}
                        onChange={(e) => {
                            onEdit(e.checked ? null : false)
                        }}
                    />
                    <label htmlFor={`${dataKey}-null`}>null</label>
                </>
            )}
        </div>
    )
}

export default SmartEditCheckBox
