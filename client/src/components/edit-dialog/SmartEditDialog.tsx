// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import SmartEditObjectField from './SmartEditObjectField'
import { InputTextarea } from 'primereact/inputtextarea'
import { WidenSchemaType } from '@/utils/sanitize'

export type FieldSchema<T extends WidenSchemaType = WidenSchemaType> = {
    label?: string
    disabled?: boolean
    hidden?: boolean
    schema: T
}

export function generateDefaultValue<T extends WidenSchemaType = WidenSchemaType>(schema: T, nonNull?: boolean): any {
    if (schema.nullable && !nonNull) {
        return null
    } else if (schema.type === 'string') {
        if (schema.enum) {
            return schema.enum[0]
        } else {
            return ''
        }
    } else if (schema.type === 'number') {
        return 0
    } else if (schema.type === 'boolean') {
        return false
    } else if (schema.type === 'array' && schema.items) {
        return [generateDefaultValue(schema.items as WidenSchemaType)]
    } else if (schema.type === 'object' && schema.properties) {
        return Object.fromEntries(
            Object.keys(schema.properties).map((k) => [k, generateDefaultValue(schema.properties![k])])
        )
    }
}

function fillInMissingValues<V, T extends WidenSchemaType = WidenSchemaType>(data: V, schema: T): V {
    if (typeof data === 'undefined') {
        return generateDefaultValue(schema) as V
    } else if (Array.isArray(data)) {
        return data.map((d) => fillInMissingValues(d, schema.items as WidenSchemaType)) as V
    } else if (typeof data === 'object' && data !== null) {
        return Object.fromEntries(
            Object.keys(schema.properties!).map((k) => [
                k,
                fillInMissingValues((data as any)[k], schema.properties![k])
            ])
        ) as V
    } else {
        return data
    }
}

type Props<T extends WidenSchemaType = WidenSchemaType> = {
    data?: { [K in keyof T['properties']]: any }
    schema: T
    config?: { [K in keyof T['properties']]: { label?: string; disabled?: boolean; hidden?: boolean } }
    show: boolean
    header: string
    onHide: () => void
    onSave: (data: { [K in keyof T['properties']]: any }) => void
}

function SmartEditDialog<T extends WidenSchemaType = WidenSchemaType>({
    data,
    schema,
    config,
    show,
    header,
    onHide,
    onSave
}: Props<T>): ReactNode {
    const [mode, setMode] = useState('simple' as 'simple' | 'advanced')
    const [state, setState] = useState(
        window.structuredClone(fillInMissingValues(data, schema) ?? generateDefaultValue(schema))
    )
    const [advancedState, setAdvancedState] = useState('')

    useEffect(() => {
        setState(window.structuredClone(fillInMissingValues(data, schema) ?? generateDefaultValue(schema)))
    }, [data, schema])

    const hideDialog = useCallback(() => {
        setState(window.structuredClone(data ?? generateDefaultValue(schema)))
        setMode('simple')
        setAdvancedState('')
        onHide()
    }, [data, schema])

    const save = useCallback(() => {
        if (mode === 'simple') {
            onSave(state)
        } else {
            onSave(JSON.parse(advancedState))
        }
        setState(data ?? generateDefaultValue(schema))
        setMode('simple')
        setAdvancedState('')
    }, [state, mode, advancedState])

    const advancedMode = useCallback(() => {
        setMode('advanced')
        setAdvancedState(JSON.stringify(state, null, 4))
    }, [state])

    return (
        <Dialog
            visible={show}
            dismissableMask={true}
            modal
            onHide={hideDialog}
            header={
                <div className="inline-flex align-items-center justify-content-between w-full">
                    <span>{header}</span>
                    {mode === 'simple' && (
                        <Button
                            className="p-dialog-header-icon p-dialog-header-close p-link mr-2"
                            icon="pi pi-pencil"
                            onClick={advancedMode}
                        />
                    )}
                </div>
            }
            style={{ width: '60vw' }}
            footer={
                <>
                    <Button size="small" severity="danger" outlined label="Cancel" onClick={hideDialog} />
                    <Button size="small" severity="success" label="Save" icon="pi pi-save" onClick={save} />
                </>
            }
        >
            {mode === 'simple' && (
                <SmartEditObjectField
                    data={state}
                    schema={{ schema: schema }}
                    config={config}
                    onEdit={(v) => setState(v)}
                />
            )}
            {mode === 'advanced' && (
                <InputTextarea
                    value={advancedState}
                    className="w-full"
                    autoResize
                    onChange={(e) => setAdvancedState(e.target.value)}
                />
            )}
        </Dialog>
    )
}

export default SmartEditDialog
