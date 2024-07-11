// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { VisualizedData } from '@/components/data-table/VisualizeDialog'
import { DataTableValue } from 'primereact/datatable'
import { Chart } from 'primereact/chart'
import React from 'react'
import { ColumnMeta } from '@/components/data-table/SmartDataTable'
import 'chartjs-adapter-moment'

type Props<TValue extends DataTableValue> = {
    values: Array<TValue>
    visualizedData: VisualizedData<TValue>
    visualizedColumn: ColumnMeta<TValue, keyof TValue & string>
}
function VisualizeHistogram<TValue extends DataTableValue>({
    values,
    visualizedData,
    visualizedColumn
}: Props<TValue>) {
    const fieldValues = values
        .map((v) => v[visualizedColumn.field] as any)
        .filter((v) => typeof v === 'number' || v instanceof Date)
        .sort((a: any, b: any) => a - b)

    const labels = [] as (number | Date)[]
    if (visualizedColumn.dataType === 'numeric') {
        const start = fieldValues[0] as number
        const end = fieldValues.at(-1) as number
        for (let i = start; i <= end; i++) {
            labels.push(i)
        }
    } else if (visualizedColumn.dataType === 'date') {
        const start = fieldValues[0] as Date
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
        const end = fieldValues.at(-1) as Date
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
        for (let day = startDay; day <= endDay; day = new Date(new Date(day.valueOf()).setDate(day.getDate() + 1))) {
            labels.push(day)
        }
    } else {
        return <></>
    }

    const data = {
        labels: labels,
        datasets: visualizedData.map((data: any) => ({
            label: data.groupBys.map((groupBy: any) => `${groupBy.field}: ${groupBy.value}`).join('\n'),
            data: labels.map(
                (label) =>
                    data.values.filter((v: any) => {
                        if (
                            v &&
                            typeof v[visualizedColumn.field] === 'number' &&
                            visualizedColumn.dataType === 'numeric'
                        ) {
                            return v[visualizedColumn.field] === label
                        } else if (
                            v &&
                            v[visualizedColumn.field] instanceof Date &&
                            visualizedColumn.dataType === 'date' &&
                            label instanceof Date
                        ) {
                            return (
                                v[visualizedColumn.field].getFullYear() === label.getFullYear() &&
                                v[visualizedColumn.field].getMonth() === label.getMonth() &&
                                v[visualizedColumn.field].getDate() === label.getDate()
                            )
                        } else {
                            return false
                        }
                    }).length
            )
        }))
    }

    return (
        <Chart
            type="bar"
            data={data}
            options={{
                spanGaps: 1000 * 60 * 60 * 24, // 1 day
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    x: {
                        type: visualizedColumn.dataType === 'date' ? 'time' : 'linear',
                        time: {
                            tooltipFormat: 'LLL dd',
                            unit: 'day'
                        },
                        ticks: {
                            source: 'data'
                        }
                    }
                }
            }}
            className="flex justify-content-center"
        />
    )
}

export default VisualizeHistogram
