// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { VisualizedData } from '@/components/data-table/VisualizeDialog'
import { DataTableValue } from 'primereact/datatable'
import { Chart } from 'primereact/chart'
import React from 'react'
import { ColumnMeta } from '@/components/data-table/SmartDataTable'

type Props<TValue extends DataTableValue> = {
    values: Array<TValue>
    visualizedData: VisualizedData<TValue>
    visualizedColumn: ColumnMeta<TValue, keyof TValue & string>
}
function VisualizePie<TValue extends DataTableValue>({ values, visualizedData, visualizedColumn }: Props<TValue>) {
    const fieldValues = values.map((v) => v[visualizedColumn.field])
    const uniqueFieldValues = [...new Set(fieldValues)]

    const data = {
        labels: uniqueFieldValues.map((v) => String(v)),
        datasets: visualizedData.map((data: any) => ({
            label: data.groupBys.map((groupBy: any) => `${groupBy.field}: ${groupBy.value}`).join('\n'),
            data: uniqueFieldValues.map(
                (uniqueFieldValue) =>
                    data.values.filter((v: any) => v[visualizedColumn.field] === uniqueFieldValue).length
            )
        }))
    }

    return (
        <Chart
            type="pie"
            data={data}
            height="500px"
            options={{
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true
                        }
                    }
                }
            }}
            pt={{
                canvas: {
                    style: { maxHeight: '500px' }
                }
            }}
            className="flex justify-content-center"
        />
    )
}

export default VisualizePie
