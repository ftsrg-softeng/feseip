// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Dialog } from 'primereact/dialog'
import { classNames } from 'primereact/utils'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import SwaggerSchema from '@/api/SwaggerSchema'
import { PickList } from 'primereact/picklist'
import { capitalize } from '@/utils/capitalize'
import SmartEditDialog, { generateDefaultValue } from '@/components/edit-dialog/SmartEditDialog'

type Props = {
    show: boolean
    courseType: string
    schedule?: any
    defaultFilter?: string
    onSave: (schedule: any) => void
    onHide: () => void
}

function ScheduleDialog({ show, courseType, schedule, defaultFilter, onSave, onHide }: Props) {
    const [name, setName] = useState('')
    const [cron, setCron] = useState('')
    const [filter, setFilter] = useState('{}')

    const [allActions, actionToSchemaMap] = useMemo(() => {
        const actions = []
        const actionToSchemaMap = {} as any
        const scheduleDTOSchema = (SwaggerSchema.components.schemas as any)[`${capitalize(courseType)}ScheduleDTO`]
        for (const actionDTOSchema of scheduleDTOSchema.properties.schema.items.oneOf) {
            const action = actionDTOSchema.properties.action.enum[0]
            const schemaName = actionDTOSchema.properties.params.$ref.split('/').pop()
            const schema = (SwaggerSchema.components.schemas as any)[schemaName] ?? null
            actions.push(action)
            actionToSchemaMap[action] = schema
        }
        return [actions, actionToSchemaMap]
    }, [courseType])

    const [actionsSource, setActionsSource] = useState([] as any[])
    const [actionsTarget, setActionsTarget] = useState([] as any[])

    const [selectedAction, setSelectedAction] = useState(null as any | null)

    const resetDialog = useCallback(() => {
        setName(schedule?.name ?? '')
        setCron(schedule?.cron ?? '')
        setFilter(schedule?.courseInstanceFilter ?? defaultFilter ?? '{}')
        setActionsSource(
            allActions
                .map((action) => {
                    const schema = actionToSchemaMap[action]
                    return { action, schema, params: schema ? generateDefaultValue(schema) : {} }
                })
                .filter(({ action }) => !schedule?.schema.some(({ action: a }: { action: any }) => a === action))
        )
        setActionsTarget(
            schedule?.schema.map(({ action, ...rest }: { action: string }) => {
                const schema = actionToSchemaMap[action]
                return { action, schema, ...rest }
            }) ?? []
        )
    }, [allActions, schedule])
    useEffect(() => {
        resetDialog()
    }, [resetDialog, show])

    const hideDialog = useCallback(() => {
        resetDialog()
        onHide()
    }, [resetDialog, onHide])

    return (
        <>
            <Dialog
                visible={show}
                dismissableMask={true}
                header={`${schedule ? 'Edit' : 'Add'} Schedule`}
                pt={{
                    root: {
                        className: classNames('max-w-full', 'm-2')
                    },
                    content: {
                        className: classNames('max-w-full'),
                        style: { overflowWrap: 'break-word' }
                    }
                }}
                footer={
                    <>
                        <Button size="small" severity="danger" outlined label="Cancel" onClick={hideDialog} />
                        <Button
                            size="small"
                            severity="success"
                            label="Save"
                            icon="pi pi-save"
                            onClick={() => {
                                onSave({ name: name, cron: cron, courseInstanceFilter: filter, schema: actionsTarget })
                            }}
                        />
                    </>
                }
                onHide={hideDialog}
            >
                <div className="field grid">
                    <label htmlFor="name" className="col-12 mb-2 md:col-3 md:mb-0">
                        Name
                    </label>
                    <div className="col-12 md:col-9 flex">
                        <InputText
                            id="name"
                            className="flex-grow-1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="field grid">
                    <label htmlFor="cron" className="col-12 mb-2 md:col-3 md:mb-0">
                        Cron
                    </label>
                    <div className="col-12 md:col-9 p-inputgroup flex-1">
                        <InputText
                            id="cron"
                            className="flex-grow-1"
                            value={cron}
                            onChange={(e) => setCron(e.target.value)}
                        />
                        <Button severity="secondary" label="Midnight" outlined onClick={() => setCron('0 0 0 * * *')} />
                        <Button severity="secondary" label="Now" outlined onClick={() => setCron('now')} />
                        <Button severity="secondary" label="Never" outlined onClick={() => setCron('never')} />
                    </div>
                </div>
                <div className="field grid">
                    <label htmlFor="filter" className="col-12 mb-2 md:col-3 md:mb-0">
                        Filter
                    </label>
                    <div className="col-12 md:col-9 flex">
                        <InputTextarea
                            className="flex-grow-1"
                            id="filter"
                            value={filter}
                            style={{ resize: 'vertical' }}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
                <div className="field">
                    <PickList
                        dataKey={'action'}
                        sourceHeader={'Available Actions'}
                        source={actionsSource}
                        sourceItemTemplate={(item) => item.action}
                        targetHeader={'Selected Actions'}
                        target={actionsTarget}
                        targetItemTemplate={(item) => (
                            <>
                                <span className="w-full">{item.action}</span>
                                {item.schema && (
                                    <Button
                                        severity="secondary"
                                        icon={'pi pi-pencil'}
                                        text
                                        pt={{
                                            root: {
                                                className: classNames('p-0', 'w-min', 'h-min', 'm-0', 'ml-2')
                                            }
                                        }}
                                        onClick={(e) => {
                                            setSelectedAction(item)
                                            e.stopPropagation()
                                        }}
                                    />
                                )}
                            </>
                        )}
                        showSourceControls={false}
                        onChange={(e) => {
                            setActionsSource(e.source)
                            setActionsTarget(e.target)
                        }}
                        pt={{
                            item: {
                                className: classNames('m-0', 'p-1')
                            },
                            list: {
                                className: classNames('p-0', 'm-0')
                            }
                        }}
                    />
                </div>
            </Dialog>
            {selectedAction && (
                <SmartEditDialog
                    schema={selectedAction.schema}
                    show={true}
                    header={selectedAction.action}
                    data={selectedAction.params}
                    onHide={() => setSelectedAction(null)}
                    onSave={(data) => {
                        setActionsTarget([
                            ...actionsTarget.filter(({ action }: { action: any }) => action !== selectedAction.action),
                            { action: selectedAction.action, schema: selectedAction.schema, params: data }
                        ])
                        setSelectedAction(null)
                    }}
                />
            )}
        </>
    )
}

export default ScheduleDialog
