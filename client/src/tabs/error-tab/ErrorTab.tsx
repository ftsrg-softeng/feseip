// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ToastMessage } from 'primereact/toast'
import React, { useEffect, useMemo, useState } from 'react'
import { Api } from '@/api/Api'
import {
    courseErrorControllerDeleteAllErrors,
    courseErrorControllerDeleteError,
    courseErrorControllerGetErrors,
    courseLogControllerGetLogs
} from '@/api/ApiCalls'
import SmartDataTable from '@/components/data-table/SmartDataTable'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'
import LogDialog from '@/components/LogDialog'
import { getId } from '@/utils/get-id'
import { Dialog } from 'primereact/dialog'

type Props = {
    courseId: string
    courseType: string
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const ErrorTab: React.FC<Props> = ({ courseId, courseType, connection, wrapNetworkRequest }) => {
    const [errors, setErrors] = useState([] as any[])
    const [logs, setLogs] = useState([] as any[])

    const loadErrors = wrapNetworkRequest(async () => {
        const [errors, logs] = await Promise.all([
            courseErrorControllerGetErrors(connection, courseType, courseId),
            courseLogControllerGetLogs(connection, courseType, courseId)
        ])
        setErrors(errors)
        setLogs(logs)
    })

    const deleteError = wrapNetworkRequest(async (errorId: string) => {
        await courseErrorControllerDeleteError(connection, courseType, courseId, errorId)
    })

    const deleteAllErrors = wrapNetworkRequest(async () => {
        await courseErrorControllerDeleteAllErrors(connection, courseType, courseId)
    })

    useEffect(() => {
        loadErrors().then()
    }, [])

    const [selectedLogId, setSelectedLogId] = useState(null as null | any)
    const selectedLog = useMemo(() => {
        return logs.find((log) => log._id === selectedLogId) ?? null
    }, [selectedLogId, logs])

    const [selectedErrorId, setSelectedErrorId] = useState(null as null | any)
    const selectedError = useMemo(() => {
        return errors.find((error) => error._id === selectedErrorId) ?? null
    }, [selectedErrorId, errors])

    return (
        <>
            <SmartDataTable
                values={errors
                    .map((error) => ({ ...error, timestamp: new Date(error.timestamp) }))
                    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))}
                columns={['message', 'targetContext', { field: 'timestamp', dataType: 'date' }]}
                idColumn="_id"
                columnTemplates={{ timestamp: (timestamp) => timestamp.toLocaleString() }}
                tableToolbar={() => (
                    <div className="flex gap-2">
                        <Button
                            size="small"
                            outlined
                            severity="info"
                            icon="pi pi-refresh"
                            label="Reload"
                            onClick={loadErrors}
                        />
                        <Button
                            size="small"
                            outlined
                            severity="danger"
                            icon="pi pi-trash"
                            label="Delete all"
                            onClick={() => deleteAllErrors().then(loadErrors)}
                        />
                    </div>
                )}
                rowToolbar={(error) => (
                    <>
                        {error.log && (
                            <Button
                                size="small"
                                severity="secondary"
                                outlined
                                icon="pi pi-book"
                                className="mr-2"
                                pt={{ root: { className: classNames('p-1') } }}
                                onClick={() => setSelectedLogId(getId(error.log))}
                            />
                        )}
                        <Button
                            size="small"
                            severity="secondary"
                            outlined
                            icon="pi pi-bars"
                            className="mr-2"
                            pt={{ root: { className: classNames('p-1') } }}
                            onClick={() => setSelectedErrorId(error._id)}
                        />
                        <Button
                            size="small"
                            severity="danger"
                            outlined
                            icon="pi pi-times"
                            pt={{ root: { className: classNames('p-1') } }}
                            onClick={() => deleteError(error._id).then(loadErrors)}
                        />
                    </>
                )}
                rowToolbarPosition="last"
            />
            {selectedLog && (
                <LogDialog
                    log={selectedLog}
                    courseType={courseType}
                    connection={connection}
                    onHide={() => setSelectedLogId(null)}
                />
            )}
            {selectedError && (
                <Dialog
                    onHide={() => setSelectedErrorId(null)}
                    visible={true}
                    header={selectedError.message}
                    style={{ maxWidth: '100vw' }}
                >
                    <p>{selectedError.message}</p>
                </Dialog>
            )}
        </>
    )
}

export default ErrorTab
