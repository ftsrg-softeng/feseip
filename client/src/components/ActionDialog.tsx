// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { useCallback, useMemo, useState } from 'react'
import SwaggerSchema, { actionArgsSchema } from '@/api/SwaggerSchema'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import SmartEditDialog from '@/components/edit-dialog/SmartEditDialog'
import { Button } from 'primereact/button'
import {
    courseActionControllerDoAction,
    courseActionControllerDoActionInBackground,
    courseInstanceActionControllerDoAction,
    courseInstanceActionControllerDoActionInBackground,
    phaseActionControllerDoAction,
    phaseActionControllerDoActionInBackground,
    phaseInstanceActionControllerDoAction,
    phaseInstanceActionControllerDoActionInBackground,
    taskActionControllerDoAction,
    taskActionControllerDoActionInBackground,
    taskInstanceActionControllerDoAction,
    taskInstanceActionControllerDoActionInBackground
} from '@/api/ApiCalls'
import { Api, LogDTO } from '@/api/Api'
import LogDialog from '@/components/LogDialog'

type Props = {
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    show: boolean
    onHide: () => void
    onRun?: (...data: any[]) => void
    targetId: string
    courseType: string
    phaseType?: string
    taskType?: string
    instance: boolean
}

type Action = {
    course: string
    phase?: string
    task?: string
    action: string
    instance: boolean
}

function ActionDialog({
    connection,
    wrapNetworkRequest,
    show,
    onHide,
    onRun,
    targetId,
    courseType,
    phaseType,
    taskType,
    instance
}: Props) {
    const actions = useMemo(() => {
        let pathPrefix = ''
        if (phaseType && taskType && instance) {
            pathPrefix = `/api/task-instances/${courseType}/${phaseType}/${taskType}/{taskInstanceId}/actions/`
        } else if (phaseType && taskType) {
            pathPrefix = `/api/tasks/${courseType}/${phaseType}/${taskType}/{taskId}/actions/`
        } else if (phaseType && instance) {
            pathPrefix = `/api/phase-instances/${courseType}/${phaseType}/{phaseInstanceId}/actions/`
        } else if (phaseType) {
            pathPrefix = `/api/phases/${courseType}/${phaseType}/{phaseId}/actions/`
        } else if (instance) {
            pathPrefix = `/api/course-instances/${courseType}/{courseInstanceId}/actions/`
        } else {
            pathPrefix = `/api/courses/${courseType}/{courseId}/actions/`
        }

        const allPaths = Object.keys(SwaggerSchema.paths)
        return allPaths
            .filter((p) => p.startsWith(pathPrefix) && !p.endsWith('/background'))
            .map((p) => ({
                course: courseType,
                phase: phaseType,
                task: taskType,
                instance: instance,
                action: p.slice(pathPrefix.length)
            }))
    }, [courseType, phaseType, taskType, instance])

    const [state, setState] = useState(
        (show ? 'select-action' : 'no-show') as
            | 'no-show'
            | 'select-action'
            | 'configure-action'
            | 'run-action'
            | 'show-log'
    )
    const [selectedAction, setSelectedAction] = useState(null as Action | null)
    const [actionSchema, setActionSchema] = useState(null as any | null)
    const [actionArgs, setActionArgs] = useState(null as any | null)
    const [log, setLog] = useState(null as LogDTO | null)

    const hide = useCallback(() => {
        setState('no-show')
        setSelectedAction(null)
        setActionSchema(null)
        setActionArgs(null)
        setLog(null)
        onHide()
    }, [onHide])

    const afterRun = useCallback(
        (...data: any[]) => {
            onRun?.(...data)
            hide()
        },
        [onRun, hide]
    )

    const run = useCallback(() => {
        if (!selectedAction) {
            return hide()
        }
        if (selectedAction.phase && selectedAction.task && selectedAction.instance) {
            wrapNetworkRequest(async () =>
                taskInstanceActionControllerDoAction(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.task!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                )
            )()
                .then(afterRun)
                .finally(hide)
        } else if (selectedAction.phase && selectedAction.task) {
            wrapNetworkRequest(async () =>
                taskActionControllerDoAction(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.task!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                )
            )()
                .then(afterRun)
                .finally(hide)
        } else if (selectedAction.phase && selectedAction.instance) {
            wrapNetworkRequest(async () =>
                phaseInstanceActionControllerDoAction(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                )
            )()
                .then(afterRun)
                .finally(hide)
        } else if (selectedAction.phase) {
            wrapNetworkRequest(async () =>
                phaseActionControllerDoAction(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                )
            )()
                .then(afterRun)
                .finally(hide)
        } else if (selectedAction.instance) {
            wrapNetworkRequest(async () =>
                courseInstanceActionControllerDoAction(
                    connection,
                    selectedAction.course,
                    selectedAction.action,
                    targetId,
                    actionArgs
                )
            )()
                .then(afterRun)
                .finally(hide)
        } else {
            wrapNetworkRequest(async () =>
                courseActionControllerDoAction(
                    connection,
                    selectedAction.course,
                    selectedAction.action,
                    targetId,
                    actionArgs
                )
            )()
                .then(afterRun)
                .finally(hide)
        }
    }, [connection, targetId, hide, selectedAction, actionArgs])

    const runInBackground = useCallback(() => {
        if (!selectedAction) {
            return hide()
        }
        if (selectedAction.phase && selectedAction.task && selectedAction.instance) {
            wrapNetworkRequest(async () =>
                taskInstanceActionControllerDoActionInBackground(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.task!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                ).then((log: LogDTO) => {
                    setLog(log)
                    setState('show-log')
                })
            )()
        } else if (selectedAction.phase && selectedAction.task) {
            wrapNetworkRequest(async () =>
                taskActionControllerDoActionInBackground(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.task!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                ).then((log: LogDTO) => {
                    setLog(log)
                    setState('show-log')
                })
            )()
        } else if (selectedAction.phase && selectedAction.instance) {
            wrapNetworkRequest(async () =>
                phaseInstanceActionControllerDoActionInBackground(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                ).then((log: LogDTO) => {
                    setLog(log)
                    setState('show-log')
                })
            )()
        } else if (selectedAction.phase) {
            wrapNetworkRequest(async () =>
                phaseActionControllerDoActionInBackground(
                    connection,
                    selectedAction.course,
                    selectedAction.phase!,
                    selectedAction.action,
                    targetId,
                    actionArgs
                ).then((log: LogDTO) => {
                    setLog(log)
                    setState('show-log')
                })
            )()
        } else if (selectedAction.instance) {
            wrapNetworkRequest(async () =>
                courseInstanceActionControllerDoActionInBackground(
                    connection,
                    selectedAction.course,
                    selectedAction.action,
                    targetId,
                    actionArgs
                ).then((log: LogDTO) => {
                    setLog(log)
                    setState('show-log')
                })
            )()
        } else {
            wrapNetworkRequest(async () =>
                courseActionControllerDoActionInBackground(
                    connection,
                    selectedAction.course,
                    selectedAction.action,
                    targetId,
                    actionArgs
                ).then((log: LogDTO) => {
                    setLog(log)
                    setState('show-log')
                })
            )()
        }
    }, [connection, targetId, hide, selectedAction, actionArgs])

    function actionName(action: string) {
        return [courseType, phaseType, taskType, action].filter((n) => n !== undefined).join('.')
    }

    return (
        <>
            <Dialog visible={state === 'select-action'} dismissableMask={true} onHide={hide} header="Select action">
                <Dropdown
                    placeholder="Select action"
                    options={actions}
                    optionLabel="action"
                    onChange={(e) => {
                        const selectedAction = e.target.value as Action
                        setSelectedAction(selectedAction)

                        const schema =
                            actionArgsSchema(
                                selectedAction.action,
                                selectedAction.course,
                                selectedAction.phase,
                                selectedAction.task
                            ) ?? {}
                        if (schema.properties && Object.keys(schema.properties).length > 0) {
                            setState('configure-action')
                            setActionSchema(schema)
                        } else {
                            setState('run-action')
                            setActionArgs({})
                        }
                    }}
                    className="w-full"
                />
            </Dialog>
            {selectedAction && actionSchema && (
                <SmartEditDialog
                    schema={actionSchema}
                    show={state === 'configure-action'}
                    header={`Configure ${actionName(selectedAction.action)}`}
                    onHide={hide}
                    onSave={(args) => {
                        setState('run-action')
                        setActionArgs(args)
                    }}
                />
            )}
            {selectedAction && actionArgs && (
                <Dialog
                    visible={state === 'run-action'}
                    dismissableMask={true}
                    onHide={hide}
                    header={`Run ${actionName(selectedAction.action)}`}
                    footer={
                        <>
                            <Button
                                size="small"
                                severity="danger"
                                outlined
                                label="Cancel"
                                onClick={hide}
                                className="mr-2"
                            />
                            <Button
                                size="small"
                                severity="success"
                                outlined
                                label="Run in background"
                                className="mr-2"
                                icon="pi pi-play"
                                onClick={runInBackground}
                            />
                            <Button size="small" severity="success" label="Run" icon="pi pi-play" onClick={run} />
                        </>
                    }
                >
                    <pre>{JSON.stringify(actionArgs, null, 4)}</pre>
                </Dialog>
            )}
            {selectedAction && actionArgs && log && (
                <LogDialog log={log} courseType={courseType} connection={connection} onHide={afterRun} />
            )}
        </>
    )
}

export default ActionDialog
