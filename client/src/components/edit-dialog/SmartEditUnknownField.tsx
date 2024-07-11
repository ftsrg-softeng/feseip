// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode } from 'react'
import { FieldSchema } from './SmartEditDialog'

type CheckBoxProps = {
    dataKey: string
    data: any
    schema: FieldSchema
}

function SmartEditUnknownField({ data }: CheckBoxProps): ReactNode {
    return <>{data?.toString()}</>
}

export default SmartEditUnknownField
