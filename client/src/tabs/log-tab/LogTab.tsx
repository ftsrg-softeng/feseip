// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ToastMessage } from 'primereact/toast'
import React, { useEffect, useState } from 'react'
import { Api } from '@/api/Api'
import { courseLogControllerGetLogs } from '@/api/ApiCalls'
import SmartDataTable from '@/components/data-table/SmartDataTable'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'
import LogDialog from '@/components/LogDialog'

type Props = {
    courseId: string
    courseType: string
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const LogTab: React.FC<Props> = ({ courseId, courseType, connection, wrapNetworkRequest }) => {
    const [logs, setLogs] = useState([] as any[])

    const loadLogs = wrapNetworkRequest(async () => {
        const logs = await courseLogControllerGetLogs(connection, courseType, courseId)
        setLogs(logs)
    })

    useEffect(() => {
        loadLogs().then()
    }, [])

    const [selectedLog, setSelectedLog] = useState(null as null | any)

    return (
        <>
            <SmartDataTable
                values={logs
                    .map((log) => ({ ...log, timestamp: new Date(log.timestamp) }))
                    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))}
                columns={['name', { field: 'type', dataType: 'enum' }, { field: 'timestamp', dataType: 'date' }]}
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
                            onClick={loadLogs}
                        />
                    </div>
                )}
                rowToolbar={(log) => (
                    <Button
                        size="small"
                        severity="secondary"
                        outlined
                        icon="pi pi-book"
                        className="mr-2"
                        pt={{ root: { className: classNames('p-1') } }}
                        onClick={() => setSelectedLog(log)}
                    />
                )}
                rowToolbarPosition="first"
                onRowSelected={(log) => setSelectedLog(log)}
            />
            {selectedLog && (
                <LogDialog
                    log={selectedLog}
                    courseType={courseType}
                    connection={connection}
                    onHide={() => setSelectedLog(null)}
                />
            )}
        </>
    )
}

export default LogTab
