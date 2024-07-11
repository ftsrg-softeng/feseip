// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import {
    DataTable,
    DataTableFilterMeta,
    DataTableFilterMetaData,
    DataTableOperatorFilterMetaData,
    DataTableValue
} from 'primereact/datatable'
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { FilterMatchMode, FilterOperator, FilterService } from 'primereact/api'
import { classNames } from 'primereact/utils'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputText } from 'primereact/inputtext'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect'
import * as xlsx from 'xlsx'
import fileSaver from 'file-saver'
import { Calendar } from 'primereact/calendar'
import { InputNumber } from 'primereact/inputnumber'
import { MultiStateCheckbox } from 'primereact/multistatecheckbox'
import { OverlayPanel } from 'primereact/overlaypanel'
import VisualizeDialog from '@/components/data-table/VisualizeDialog'

export type ColumnMeta<TValue extends DataTableValue, Key extends keyof TValue = string> = {
    field: Key | 'global'
    header?: string
    defaultFilterMatchMode?: FilterMatchMode
    frozen?: boolean
    dataType?: 'date' | 'numeric' | 'string' | 'boolean' | 'enum'
    hidden?: boolean
    width?: string
}

type Props<TValue extends DataTableValue> = {
    values: Array<TValue>
    columns: ((keyof TValue & string) | ColumnMeta<TValue, keyof TValue & string>)[]
    idColumn: keyof TValue & string
    columnTemplates?: { [K in keyof TValue & string]?: (data: TValue[K]) => ReactNode }
    persistenceKey?: string
    tableToolbar?: () => ReactNode
    rowToolbar?: (row: TValue) => ReactNode
    rowToolbarPosition?: 'first' | 'last'
    onRowSelected?: (row: TValue) => void
    onFilter?: (rows: Array<TValue>) => void
}

function SmartDataTable<TValue extends DataTableValue>({
    values,
    columns,
    idColumn,
    columnTemplates,
    persistenceKey,
    tableToolbar,
    rowToolbar,
    rowToolbarPosition,
    onRowSelected,
    onFilter
}: Props<TValue>): ReactNode {
    const dt = useRef<DataTable<TValue[]>>(null)

    const defaultMatchMode = (dataType?: string) => {
        switch (dataType) {
            case 'string':
            case undefined:
                return FilterMatchMode.CONTAINS
            case 'date':
                return FilterMatchMode.DATE_IS
            case 'numeric':
            case 'boolean':
                return FilterMatchMode.EQUALS
            case 'enum':
                return FilterMatchMode.CUSTOM
            default:
                throw new Error()
        }
    }

    const defaultFilterData = useMemo(
        () =>
            Object.fromEntries(
                columns
                    .map((c) => {
                        if (typeof c === 'string') {
                            return [c, { value: null, matchMode: FilterMatchMode.CONTAINS }]
                        }

                        return [
                            c.field,
                            { value: null, matchMode: c.defaultFilterMatchMode ?? defaultMatchMode(c.dataType) } as
                                | DataTableOperatorFilterMetaData
                                | DataTableFilterMetaData
                        ]
                    })
                    .concat([['global', { value: null, matchMode: FilterMatchMode.CONTAINS }]])
            ),
        [columns]
    )

    const defaultAdvancedFilterData = useMemo(
        () =>
            Object.fromEntries(
                columns
                    .map((c) => {
                        if (typeof c === 'string') {
                            return [
                                c,
                                {
                                    operator: FilterOperator.AND,
                                    constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
                                }
                            ]
                        } else if (c.dataType === 'enum') {
                            return [
                                c.field,
                                {
                                    matchMode: FilterMatchMode.CUSTOM,
                                    value: null
                                }
                            ]
                        } else if (c.dataType === 'boolean') {
                            return [
                                c.field,
                                {
                                    matchMode: FilterMatchMode.EQUALS,
                                    value: null
                                }
                            ]
                        }

                        return [
                            c.field,
                            {
                                operator: FilterOperator.AND,
                                constraints: [
                                    { value: null, matchMode: c.defaultFilterMatchMode ?? defaultMatchMode(c.dataType) }
                                ]
                            } as DataTableOperatorFilterMetaData | DataTableFilterMetaData
                        ]
                    })
                    .concat([['global', { value: null, matchMode: FilterMatchMode.CONTAINS }]])
            ),
        [columns]
    )

    const [filterType, setFilterType] = useState<'Simple' | 'Advanced'>('Simple')
    const [filters, setFilters] = useState<DataTableFilterMeta>(window.structuredClone(defaultFilterData))
    const [advancedFilters, setAdvancedFilters] = useState<DataTableFilterMeta>(
        window.structuredClone(defaultAdvancedFilterData)
    )
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('')
    const [filteredValues, setFilteredValues] = useState([] as TValue[])
    useEffect(() => {
        const currentFilters = dt.current?.getFilterMeta()
        if (currentFilters && filterType === 'Simple') {
            setFilters(window.structuredClone(currentFilters))
        } else if (currentFilters) {
            setAdvancedFilters(window.structuredClone(currentFilters))
        }
    }, [values])
    useEffect(() => {
        onFilter?.(filteredValues)
    }, [filteredValues])

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        const _filters = { ...filters } as typeof defaultFilterData
        _filters['global'].value = value
        setFilters(_filters)

        const _advancedFilters = { ...advancedFilters } as typeof defaultAdvancedFilterData
        _advancedFilters['global'].value = value
        setAdvancedFilters(_advancedFilters)

        setGlobalFilterValue(value)
    }

    const initFilters = () => {
        setFilters(window.structuredClone(defaultFilterData))
        setAdvancedFilters(window.structuredClone(defaultAdvancedFilterData))
        setGlobalFilterValue('')
    }

    const textFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <InputText
                value={options.value ?? ''}
                onChange={(e) => {
                    if (filterType === 'Simple') {
                        options.filterApplyCallback(e.target.value, options.index)
                    } else {
                        options.filterCallback(e.target.value, options.index)
                    }
                }}
                pt={{
                    root: {
                        className:
                            filterType === 'Simple'
                                ? classNames('pl-2', 'pr-7', 'py-1', 'h-2rem', 'border-noround')
                                : undefined
                    }
                }}
            />
        )
    }

    const enumFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        FilterService.register(`custom_${options.field}`, (value, filters) => {
            const array = filters ?? []
            return array.length === 0 ? true : array.includes(value)
        })

        const fieldValues = values?.map((v) => v[options.field]).filter((v) => !!v) ?? []
        const uniqueFieldValues = [...new Set(fieldValues)]
        return (
            <MultiSelect
                value={options.value ?? null}
                options={uniqueFieldValues}
                display="comma"
                showClear
                clearIcon={
                    <span
                        className="pi pi-filter-slash ml-1 text-color-secondary"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (filterType === 'Simple') {
                                options.filterApplyCallback([], options.index)
                            } else {
                                options.filterCallback([], options.index)
                            }
                        }}
                    />
                }
                onChange={(e) => {
                    if (filterType === 'Simple') {
                        options.filterApplyCallback(e.value, options.index)
                    } else {
                        options.filterCallback(e.value, options.index)
                    }
                }}
                pt={{
                    root: {
                        className:
                            filterType === 'Simple'
                                ? classNames('pl-2', 'pr-2', 'py-1', 'h-2rem', 'border-noround', 'align-items-center')
                                : classNames('align-items-center')
                    },
                    trigger: {
                        className: classNames('w-1rem', 'ml-1')
                    },
                    clearIcon: {
                        className: classNames('w-1rem', 'ml-1')
                    },
                    label: {
                        className: classNames('p-0')
                    }
                }}
            />
        )
    }

    const dateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Calendar
                value={options.value}
                onChange={(e) => {
                    if (filterType === 'Simple') {
                        options.filterApplyCallback(e.value, options.index)
                    } else {
                        options.filterCallback(e.value, options.index)
                    }
                }}
                dateFormat="yy. mm. dd."
                placeholder="yyyy. mm. dd. hh:mm"
                showTime
                hourFormat="24"
                pt={{
                    input: {
                        root: {
                            className:
                                filterType === 'Simple'
                                    ? classNames('pl-2', 'pr-7', 'py-1', 'h-2rem', 'border-noround')
                                    : undefined
                        }
                    }
                }}
                selectionMode="single"
            />
        )
    }

    const numberFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <InputNumber
                value={options.value ?? ''}
                onChange={(e) => {
                    if (filterType === 'Simple') {
                        options.filterApplyCallback(e.value, options.index)
                    } else {
                        options.filterCallback(e.value, options.index)
                    }
                }}
                pt={{
                    input: {
                        root: {
                            className:
                                filterType === 'Simple'
                                    ? classNames('pl-2', 'pr-7', 'py-1', 'h-2rem', 'border-noround')
                                    : undefined
                        }
                    }
                }}
            />
        )
    }

    const booleanFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <MultiStateCheckbox
                value={options.value ?? 'empty'}
                options={[
                    { value: true, icon: 'pi pi-check' },
                    { value: false, icon: 'pi pi-times' }
                ]}
                optionValue="value"
                onChange={(e) => {
                    if (filterType === 'Simple') {
                        options.filterApplyCallback(e.value === 'empty' ? null : e.value, options.index)
                    } else {
                        options.filterCallback(e.value === 'empty' ? null : e.value, options.index)
                    }
                }}
            />
        )
    }

    const filterTemplate = (dataType?: string) => {
        switch (dataType) {
            case 'string':
            case undefined:
                return textFilterTemplate
            case 'enum':
                return enumFilterTemplate
            case 'date':
                return dateFilterTemplate
            case 'numeric':
                return numberFilterTemplate
            case 'boolean':
                return booleanFilterTemplate
            default:
                throw new Error()
        }
    }

    const selectableColumns = useMemo(
        () =>
            columns.map((column) => {
                if (typeof column === 'string') {
                    return { field: column, header: column } as ColumnMeta<TValue>
                }

                return { ...column, header: column.header ?? column.field } as ColumnMeta<TValue>
            }),
        [columns]
    )

    const [visibleColumns, setVisibleColumns] = useState<ColumnMeta<TValue>[]>(
        selectableColumns.filter((c) => !c.hidden)
    )

    const onColumnToggle = (event: MultiSelectChangeEvent) => {
        const selectedColumns = event.value as ColumnMeta<TValue>[]
        const orderedSelectedColumns = selectableColumns.filter((col) =>
            selectedColumns.some((sCol) => sCol.field === col.field)
        )

        setVisibleColumns(orderedSelectedColumns)
    }

    const exportCSV = () => {
        dt.current?.exportCSV()
    }

    const exportExcel = () => {
        const worksheet = xlsx.utils.json_to_sheet(values)
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] }
        const excelBuffer = xlsx.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        })

        const data = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
        })

        fileSaver.saveAs(data, `export_${new Date().getTime()}.xlsx`)
    }

    const exportPanelRef = useRef(null as OverlayPanel | null)
    const columnsPanelRef = useRef(null as OverlayPanel | null)
    const filterPanelRef = useRef(null as OverlayPanel | null)

    const renderHeader = () => {
        return (
            <>
                <div className="flex justify-content-end align-items-center gap-2">
                    <Button
                        size="small"
                        text
                        icon="pi pi-file-export"
                        className="p-button-plain"
                        onClick={(e) => {
                            exportPanelRef.current?.show(e, e.target)
                            columnsPanelRef.current?.hide()
                            filterPanelRef.current?.hide()
                        }}
                    />
                    <Button
                        size="small"
                        text
                        icon="pi pi-table"
                        className="p-button-plain"
                        onClick={(e) => {
                            exportPanelRef.current?.hide()
                            columnsPanelRef.current?.show(e, e.target)
                            filterPanelRef.current?.hide()
                        }}
                    />
                    <Button
                        size="small"
                        text
                        icon="pi pi-filter"
                        className="p-button-plain"
                        onClick={(e) => {
                            exportPanelRef.current?.hide()
                            columnsPanelRef.current?.hide()
                            filterPanelRef.current?.show(e, e.target)
                        }}
                    />
                </div>
                <OverlayPanel
                    ref={exportPanelRef}
                    pt={{ content: { className: classNames('flex align-items-center gap-2') } }}
                >
                    <Button
                        type="button"
                        icon="pi pi-file"
                        severity="info"
                        onClick={exportCSV}
                        size="small"
                        outlined
                        label="CSV"
                    />
                    <Button
                        type="button"
                        icon="pi pi-file-excel"
                        severity="success"
                        onClick={exportExcel}
                        size="small"
                        outlined
                        label="Excel"
                    />
                </OverlayPanel>
                <OverlayPanel
                    ref={columnsPanelRef}
                    pt={{ content: { className: classNames('flex align-items-center gap-2') } }}
                >
                    <MultiSelect
                        value={visibleColumns}
                        options={selectableColumns}
                        optionLabel="header"
                        onChange={onColumnToggle}
                        className="p-inputtext p-inputtext-sm p-0"
                        display="chip"
                        pt={{
                            label: {
                                className: classNames('p-1')
                            },
                            token: {
                                className: classNames('px-2 py-1')
                            }
                        }}
                    />
                </OverlayPanel>
                <OverlayPanel
                    ref={filterPanelRef}
                    pt={{ content: { className: classNames('flex align-items-center gap-2') } }}
                >
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                        onClick={initFilters}
                        size="small"
                    />
                    <SelectButton
                        options={['Simple', 'Advanced']}
                        allowEmpty={false}
                        value={filterType}
                        onChange={(e) => {
                            initFilters()
                            setFilterType(e.value)
                        }}
                        pt={{
                            button: {
                                className: classNames('p-button-sm')
                            },
                            label: {
                                style: { lineHeight: 'normal' }
                            }
                        }}
                    />
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder="Keyword Search"
                            className="p-inputtext-sm"
                            size="small"
                        />
                    </IconField>
                </OverlayPanel>
            </>
        )
    }

    const [visualizationMode, setVisualizationMode] = useState(
        null as 'pie' | 'table' | 'histogram' | 'stacked-bar' | null
    )
    const [visualizedColumn, setVisualizedColumn] = useState(null as ColumnMeta<TValue> | null)

    return (
        <>
            <DataTable
                ref={dt}
                value={values}
                showGridlines
                stripedRows
                dataKey={idColumn}
                scrollable
                size="small"
                paginator
                paginatorPosition="both"
                paginatorLeft={tableToolbar?.() ?? <span />}
                paginatorRight={renderHeader()}
                alwaysShowPaginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
                paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="({first}-{last} of {totalRecords})"
                sortMode="multiple"
                removableSort
                filters={filterType === 'Simple' ? filters : advancedFilters}
                key={filterType}
                filterDisplay={filterType === 'Simple' ? 'row' : 'menu'}
                globalFilterFields={Object.keys(defaultFilterData)}
                onValueChange={(value) => {
                    setFilteredValues([...value])
                }}
                resizableColumns
                columnResizeMode="expand"
                reorderableColumns
                stateStorage={persistenceKey ? 'session' : undefined}
                stateKey={persistenceKey}
                onRowDoubleClick={(event) => onRowSelected?.(event.data as TValue)}
                pt={{
                    paginator: {
                        root: {
                            className: classNames('bg-gray-50', 'p-2')
                        },
                        current: {
                            className: classNames('h-2rem')
                        },
                        firstPageButton: {
                            className: classNames('h-2rem')
                        },
                        prevPageButton: {
                            className: classNames('h-2rem')
                        },
                        nextPageButton: {
                            className: classNames('h-2rem')
                        },
                        lastPageButton: {
                            className: classNames('h-2rem')
                        },
                        pageButton: {
                            className: classNames('h-2rem', 'min-w-min', 'w-2rem')
                        },
                        RPPDropdown: {
                            root: { className: classNames('h-2rem') },
                            input: {
                                className: classNames('px-2 py-1')
                            },
                            trigger: {
                                className: classNames('w-2rem')
                            }
                        }
                    }
                }}
            >
                {rowToolbar && rowToolbarPosition === 'first' && (
                    <Column
                        headerStyle={{ width: '5rem', textAlign: 'center' }}
                        bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                        body={rowToolbar}
                        frozen
                        style={{
                            minWidth: '0',
                            width: '0'
                        }}
                    />
                )}
                {visibleColumns.map((column, i) => (
                    <Column
                        key={i}
                        field={column.field}
                        header={
                            <>
                                {column.header}
                                {['enum', 'boolean'].includes(column.dataType!) && (
                                    <>
                                        <Button
                                            severity="secondary"
                                            text
                                            icon="pi pi-chart-pie"
                                            className="w-min p-0 ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setVisualizationMode('pie')
                                                setVisualizedColumn(column)
                                            }}
                                        />
                                        <Button
                                            severity="secondary"
                                            text
                                            icon="pi pi-chart-bar"
                                            className="w-min p-0 ml-2"
                                            style={{ transform: 'rotate(90deg) scaleX(-1)' }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setVisualizationMode('stacked-bar')
                                                setVisualizedColumn(column)
                                            }}
                                        />
                                        <Button
                                            severity="secondary"
                                            text
                                            icon="pi pi-table"
                                            className="w-min p-0 ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setVisualizationMode('table')
                                                setVisualizedColumn(column)
                                            }}
                                        />
                                    </>
                                )}
                                {['numeric', 'date'].includes(column.dataType!) && (
                                    <>
                                        <Button
                                            severity="secondary"
                                            text
                                            icon="pi pi-chart-bar"
                                            className="w-min p-0 ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setVisualizationMode('histogram')
                                                setVisualizedColumn(column)
                                            }}
                                        />
                                    </>
                                )}
                            </>
                        }
                        filter
                        filterElement={filterTemplate(column.dataType)}
                        showFilterMenu={filterType === 'Advanced' || !['boolean', 'enum'].includes(column.dataType!)}
                        showClearButton={!['boolean', 'enum'].includes(column.dataType!)}
                        showFilterMatchModes={
                            filterType === 'Simple' || !['boolean', 'enum'].includes(column.dataType!)
                        }
                        dataType={column.dataType !== 'enum' ? column.dataType : undefined}
                        frozen={column.frozen}
                        sortable
                        body={
                            columnTemplates?.[column.field]
                                ? (row) => columnTemplates?.[column.field]?.(row[column.field])
                                : undefined
                        }
                        style={{
                            minWidth: column.width ?? '0',
                            width: column.width ?? '0'
                        }}
                        pt={{
                            columnFilter:
                                filterType === 'Simple'
                                    ? {
                                          className: classNames('relative')
                                      }
                                    : {},
                            filterMenuButton:
                                filterType === 'Simple'
                                    ? {
                                          className: classNames('absolute', 'right-0'),
                                          style: { width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }
                                      }
                                    : {},
                            headerFilterClearButton:
                                filterType === 'Simple'
                                    ? {
                                          className: classNames('absolute', 'right-0'),
                                          style: { width: '1.5rem', height: '1.5rem', marginRight: '2.25rem' }
                                      }
                                    : {},
                            headerCell: {
                                className: classNames('p-1')
                            },
                            headerContent: {
                                className: classNames('p-1')
                            }
                        }}
                    />
                ))}
                {rowToolbar && (rowToolbarPosition === undefined || rowToolbarPosition === 'last') && (
                    <Column
                        headerStyle={{ width: '5rem', textAlign: 'center' }}
                        bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
                        body={rowToolbar}
                        frozen
                        style={{
                            minWidth: '0',
                            width: '0'
                        }}
                    />
                )}
            </DataTable>
            {visualizedColumn && visualizationMode && (
                <VisualizeDialog
                    values={filteredValues}
                    columns={selectableColumns}
                    visualizationMode={visualizationMode}
                    visualizedColumn={visualizedColumn}
                    onHide={() => {
                        setVisualizationMode(null)
                        setVisualizedColumn(null)
                    }}
                />
            )}
        </>
    )
}

export default SmartDataTable
