// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode, useContext, useRef, useState } from 'react'
import SmartDataTable, { ColumnMeta } from '@/components/data-table/SmartDataTable'
import { DataTableValue } from 'primereact/datatable'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'
import AppContext from '@/AppContext'
import { ToastMessage } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'

type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never
type MergeAndFlattenTuple<P, V> = {
    key: StringLiteral<P>
    value: V
}

type MergeAndFlattened<P, V> = {
    [K in keyof V as `${string & P}.${string & K}`]: V[K]
}

export function mergeAndFlatten<const P, V>(obj: MergeAndFlattenTuple<P, V>): MergeAndFlattened<P, V>
export function mergeAndFlatten<const P1, V1, const P2, V2>(
    obj1: MergeAndFlattenTuple<P1, V1>,
    obj2: MergeAndFlattenTuple<P2, V2>
): MergeAndFlattened<P1, V1> & MergeAndFlattened<P2, V2>
export function mergeAndFlatten<const P1, V1, const P2, V2, const P3, V3>(
    obj1: MergeAndFlattenTuple<P1, V1>,
    obj2: MergeAndFlattenTuple<P2, V2>,
    obj3: MergeAndFlattenTuple<P3, V3>
): MergeAndFlattened<P1, V1> & MergeAndFlattened<P2, V2> & MergeAndFlattened<P3, V3>
export function mergeAndFlatten<const P1, V1, const P2, V2, const P3, V3, const P4, V4>(
    obj1: MergeAndFlattenTuple<P1, V1>,
    obj2: MergeAndFlattenTuple<P2, V2>,
    obj3: MergeAndFlattenTuple<P3, V3>,
    obj4: MergeAndFlattenTuple<P4, V4>
): MergeAndFlattened<P1, V1> & MergeAndFlattened<P2, V2> & MergeAndFlattened<P3, V3> & MergeAndFlattened<P4, V4>
export function mergeAndFlatten<const P1, V1, const P2, V2, const P3, V3, const P4, V4, const P5, V5>(
    obj1: MergeAndFlattenTuple<P1, V1>,
    obj2: MergeAndFlattenTuple<P2, V2>,
    obj3: MergeAndFlattenTuple<P3, V3>,
    obj4: MergeAndFlattenTuple<P4, V4>,
    obj5: MergeAndFlattenTuple<P5, V5>
): MergeAndFlattened<P1, V1> &
    MergeAndFlattened<P2, V2> &
    MergeAndFlattened<P3, V3> &
    MergeAndFlattened<P4, V4> &
    MergeAndFlattened<P5, V5>
export function mergeAndFlatten<const P1, V1, const P2, V2, const P3, V3, const P4, V4, const P5, V5, const P6, V6>(
    obj1: MergeAndFlattenTuple<P1, V1>,
    obj2: MergeAndFlattenTuple<P2, V2>,
    obj3: MergeAndFlattenTuple<P3, V3>,
    obj4: MergeAndFlattenTuple<P4, V4>,
    obj5: MergeAndFlattenTuple<P5, V5>,
    obj6: MergeAndFlattenTuple<P6, V6>
): MergeAndFlattened<P1, V1> &
    MergeAndFlattened<P2, V2> &
    MergeAndFlattened<P3, V3> &
    MergeAndFlattened<P4, V4> &
    MergeAndFlattened<P5, V5> &
    MergeAndFlattened<P6, V6>
export function mergeAndFlatten<
    const P1,
    V1,
    const P2,
    V2,
    const P3,
    V3,
    const P4,
    V4,
    const P5,
    V5,
    const P6,
    V6,
    const P7,
    V7
>(
    obj1: MergeAndFlattenTuple<P1, V1>,
    obj2: MergeAndFlattenTuple<P2, V2>,
    obj3: MergeAndFlattenTuple<P3, V3>,
    obj4: MergeAndFlattenTuple<P4, V4>,
    obj5: MergeAndFlattenTuple<P5, V5>,
    obj6: MergeAndFlattenTuple<P6, V6>,
    obj7: MergeAndFlattenTuple<P7, V7>
): MergeAndFlattened<P1, V1> &
    MergeAndFlattened<P2, V2> &
    MergeAndFlattened<P3, V3> &
    MergeAndFlattened<P4, V4> &
    MergeAndFlattened<P5, V5> &
    MergeAndFlattened<P6, V6> &
    MergeAndFlattened<P7, V7>
export function mergeAndFlatten<T extends Array<MergeAndFlattenTuple<any, any>>>(...objs: T): any {
    return Object.fromEntries(
        objs
            .flatMap(({ key, value }) =>
                value ? Object.entries(value).map(([oKey, oValue]) => [`${key}.${oKey}`, oValue]) : null
            )
            .filter((v) => v !== null) as any[]
    ) as any
}

type Props<TValue extends DataTableValue> = {
    values: Array<TValue>
    columns: ((keyof TValue & string) | ColumnMeta<TValue, keyof TValue & string>)[]
    idColumn: keyof TValue & string
    courseInstanceIdColumn: keyof TValue & string
    columnTemplates?: { [K in keyof TValue & string]?: (data: TValue[K]) => ReactNode }
    persistenceKey: string
    onRowSelected: (row: TValue) => void
    onRefresh: () => void
    toast: (toast: ToastMessage) => void
}

function TeacherTable<TValue extends DataTableValue>({
    values,
    columns,
    idColumn,
    courseInstanceIdColumn,
    columnTemplates,
    persistenceKey,
    onRowSelected,
    onRefresh,
    toast
}: Props<TValue>) {
    const appContext = useContext(AppContext)

    const cols = [...columns]
    if (!columns.includes(idColumn) && !columns.find((c: any) => c.field === idColumn)) {
        cols.unshift({ field: idColumn, header: '_id', hidden: true })
    }
    if (
        idColumn !== courseInstanceIdColumn &&
        !columns.includes(courseInstanceIdColumn) &&
        !columns.find((c: any) => c.field === courseInstanceIdColumn)
    ) {
        cols.unshift({ field: courseInstanceIdColumn, header: 'courseInstance._id', hidden: true })
    }

    const [filteredValues, setFilteredValues] = useState(values)

    const confirmDialogRef = useRef<ConfirmDialog>(null)
    const isIframe = typeof window !== 'undefined' && window.self !== window.top

    return (
        <SmartDataTable
            values={values}
            columns={cols}
            idColumn={idColumn}
            columnTemplates={columnTemplates}
            persistenceKey={persistenceKey}
            tableToolbar={() => (
                <div className="flex gap-2">
                    <Button
                        size="small"
                        outlined
                        severity="info"
                        icon="pi pi-refresh"
                        label="Reload"
                        onClick={onRefresh}
                    />
                    {appContext.role === 'courseAdmin' && (
                        <>
                            <Button
                                size="small"
                                outlined
                                severity="secondary"
                                icon="pi pi-copy"
                                label="Copy current filter"
                                onClick={() => {
                                    const filter = JSON.stringify(
                                        { _id: { $in: filteredValues.map((v) => v[courseInstanceIdColumn]) } },
                                        null,
                                        4
                                    )
                                    if (!isIframe) {
                                        navigator.clipboard.writeText(filter).then(() => {
                                            toast({
                                                severity: 'info',
                                                content: 'Current filter copied',
                                                closable: false,
                                                life: 1000
                                            })
                                        })
                                    } else {
                                        confirmDialogRef.current?.confirm({
                                            message: filter,
                                            header: 'Copy current filter',
                                            acceptLabel: 'OK',
                                            visible: true
                                        })
                                    }
                                }}
                            />
                            <ConfirmDialog
                                ref={confirmDialogRef}
                                pt={{
                                    root: {
                                        className: classNames('max-w-full', 'p-2')
                                    },
                                    message: {
                                        className: classNames('max-w-full', 'm-0'),
                                        style: { overflowWrap: 'break-word' }
                                    },
                                    rejectButton: {
                                        root: {
                                            className: classNames('hidden')
                                        }
                                    }
                                }}
                            />
                        </>
                    )}
                </div>
            )}
            rowToolbar={(row) => (
                <Button
                    size="small"
                    severity="secondary"
                    outlined
                    icon="pi pi-book"
                    className="mr-2"
                    pt={{ root: { className: classNames('p-1') } }}
                    onClick={() => onRowSelected(row)}
                />
            )}
            rowToolbarPosition="first"
            onRowSelected={onRowSelected}
            onFilter={(values) => setFilteredValues(values)}
        />
    )
}

export default TeacherTable
