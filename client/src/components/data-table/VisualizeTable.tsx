// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { VisualizedData } from '@/components/data-table/VisualizeDialog'
import { DataTable, DataTableValue } from 'primereact/datatable'
import React from 'react'
import { ColumnMeta } from '@/components/data-table/SmartDataTable'
import { Column } from 'primereact/column'

type Props<TValue extends DataTableValue> = {
    values: Array<TValue>
    visualizedData: VisualizedData<TValue>
    visualizedColumn: ColumnMeta<TValue, keyof TValue & string>
}
function VisualizeTable<TValue extends DataTableValue>({ values, visualizedData, visualizedColumn }: Props<TValue>) {
    const fieldValues = values.map((v) => v[visualizedColumn.field])
    const uniqueFieldValues = [...new Set(fieldValues)]

    const data = visualizedData.map((data: any) => {
        const row = {
            groupBy: data.groupBys.map((groupBy: any) => `${groupBy.field}: ${groupBy.value}`).join('\n')
        } as any
        for (const uniqueFieldValue of uniqueFieldValues) {
            row[String(uniqueFieldValue)] = data.values.filter(
                (v: any) => v[visualizedColumn.field] === uniqueFieldValue
            ).length
        }
        return row
    })

    return (
        <DataTable
            value={data}
            scrollable
            scrollHeight="flex"
            size="small"
            sortMode="multiple"
            removableSort
            resizableColumns
            reorderableColumns
        >
            {visualizedData.length > 1 && <Column field="groupBy" header="Group By" />}
            {uniqueFieldValues.map((uniqueFieldValue, index) => (
                <Column key={index} sortable field={uniqueFieldValue.toString()} header={uniqueFieldValue.toString()} />
            ))}
        </DataTable>
    )
}

export default VisualizeTable
