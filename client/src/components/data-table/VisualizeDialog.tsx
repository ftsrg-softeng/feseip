// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Dialog } from 'primereact/dialog'
import { MultiSelect } from 'primereact/multiselect'
import React, { useMemo, useState } from 'react'
import { DataTableValue } from 'primereact/datatable'
import { ColumnMeta } from '@/components/data-table/SmartDataTable'
import VisualizePie from '@/components/data-table/VisualizePie'
import VisualizeStackedBar from '@/components/data-table/VisualizeStackedBar'
import VisualizeTable from '@/components/data-table/VisualizeTable'
import VisualizeHistogram from '@/components/data-table/VisualizeHistogram'

export type VisualizedData<TValue extends DataTableValue> = {
    groupBys: { field: string; value: any }[]
    values: Array<TValue>
}[]

type Props<TValue extends DataTableValue> = {
    values: Array<TValue>
    columns: ColumnMeta<TValue, keyof TValue & string>[]
    visualizationMode: 'pie' | 'table' | 'histogram' | 'stacked-bar'
    visualizedColumn: ColumnMeta<TValue, keyof TValue & string>
    onHide: () => void
}

const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())))

function VisualizeDialog<TValue extends DataTableValue>({
    values,
    columns,
    visualizationMode,
    visualizedColumn,
    onHide
}: Props<TValue>) {
    const selectableGroupByColumns = useMemo(() => {
        return columns
            .filter((c) => ['enum', 'boolean'].includes(c.dataType ?? ''))
            .filter((c) => c.field !== visualizedColumn?.field)
    }, [columns, visualizedColumn])
    const [groupByColumns, setGroupByColumns] = useState([] as ColumnMeta<TValue>[])
    const visualizedData: VisualizedData<TValue> = useMemo(() => {
        if (groupByColumns.length === 0) {
            return [
                {
                    groupBys: [],
                    values: values
                }
            ]
        }
        const groupBys = [] as { field: string; value: any }[][]
        for (const groupByColumn of groupByColumns) {
            const fieldValues = values.map((v) => v[groupByColumn.field])
            const uniqueFieldValues = [...new Set(fieldValues)]
            groupBys.push(uniqueFieldValues.map((v) => ({ field: groupByColumn.field, value: v })))
        }

        const enumeratedGroupBys = cartesian(...groupBys).map((e: any) => (groupBys.length > 1 ? e : [e])) as {
            field: string
            value: any
        }[][]

        return enumeratedGroupBys.map((enumeratedGroupBy) => {
            let filteredValues = values
            for (const groupBy of enumeratedGroupBy) {
                filteredValues = filteredValues.filter((v) => v[groupBy.field] === groupBy.value)
            }
            return {
                groupBys: enumeratedGroupBy,
                values: filteredValues
            }
        })
    }, [visualizedColumn, groupByColumns, values])

    return (
        <Dialog
            style={{ width: '60vw' }}
            visible={true}
            dismissableMask={true}
            header={visualizedColumn.header}
            onHide={() => {
                setGroupByColumns([])
                onHide()
            }}
        >
            {selectableGroupByColumns.length > 0 && (
                <div className="field grid">
                    <label htmlFor="groupBy" className="col-12 mb-2 md:col-2 md:mb-0">
                        Group By
                    </label>
                    <div className="col-12 md:col-10">
                        <MultiSelect
                            value={groupByColumns}
                            onChange={(e) => setGroupByColumns(e.value)}
                            options={selectableGroupByColumns}
                            optionLabel="header"
                            display="chip"
                            className="w-full"
                        />
                    </div>
                </div>
            )}
            {visualizationMode === 'pie' && (
                <VisualizePie values={values} visualizedColumn={visualizedColumn} visualizedData={visualizedData} />
            )}
            {visualizationMode === 'stacked-bar' && (
                <VisualizeStackedBar
                    values={values}
                    visualizedColumn={visualizedColumn}
                    visualizedData={visualizedData}
                />
            )}
            {visualizationMode === 'table' && (
                <VisualizeTable values={values} visualizedColumn={visualizedColumn} visualizedData={visualizedData} />
            )}
            {visualizationMode === 'histogram' && (
                <VisualizeHistogram
                    values={values}
                    visualizedColumn={visualizedColumn}
                    visualizedData={visualizedData}
                />
            )}
        </Dialog>
    )
}

export default VisualizeDialog
