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
function VisualizeStackedBar<TValue extends DataTableValue>({
    values,
    visualizedData,
    visualizedColumn
}: Props<TValue>) {
    const labels = visualizedData.map((data: any) =>
        data.groupBys.map((groupBy: any) => `${groupBy.field}:${groupBy.value}`).join('-')
    )
    const fieldValues = values.map((v) => v[visualizedColumn.field])
    const uniqueFieldValues = [...new Set(fieldValues)]
    const data = {
        labels: labels,
        datasets: uniqueFieldValues.map((uniqueFieldValue) => ({
            label: String(uniqueFieldValue),
            data: visualizedData.map(
                (data: any) =>
                    data.values.filter((v: any) => v[visualizedColumn.field] === uniqueFieldValue).length /
                    data.values.length
            )
        }))
    }

    return (
        <Chart
            type="bar"
            data={data}
            options={{
                indexAxis: 'y',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                if (context.dataset.label && context.parsed.x !== null && context.parsed.y !== null) {
                                    return `${context.dataset.label}: ${Math.round(context.parsed.x * 100)}% (${
                                        visualizedData[context.parsed.y].values.filter(
                                            (v: any) => v[visualizedColumn.field].toString() === context.dataset.label
                                        ).length
                                    })`
                                } else {
                                    return ''
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            callback: (value: any) => `${Math.round(value * 100)}%`
                        }
                    },
                    y: {
                        stacked: true
                    }
                }
            }}
            className="flex justify-content-center"
        />
    )
}

export default VisualizeStackedBar
