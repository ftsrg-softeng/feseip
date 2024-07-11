// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Dialog } from 'primereact/dialog'
import React, { useEffect, useState } from 'react'
import { Api, LogDTO } from '@/api/Api'
import { stream } from 'fetch-event-stream'
import { getId } from '@/utils/get-id'
import { classNames } from 'primereact/utils'

type Props = {
    log: LogDTO
    courseType: string
    connection: Api<unknown>
    onHide: () => void
}

function LogDialog({ log, courseType, connection, onHide }: Props) {
    const [streamedLog, setStreamedLog] = useState('')
    useEffect(() => {
        const abortController = new AbortController()
        stream(`${connection.baseUrl}/api/logs/${courseType}/${getId(log.course)}/${log._id}`, {
            signal: abortController.signal,
            headers: {
                Authorization: (connection as any).baseApiParams.headers.Authorization
            }
        })
            .then(async (events) => {
                for await (const event of events) {
                    if (event.data) {
                        setStreamedLog((streamedLog) => streamedLog + event.data)
                    }
                }
            })
            .catch(() => {})

        return () => {
            abortController.abort()
        }
    }, [log, courseType, connection])

    return (
        <Dialog
            visible={true}
            dismissableMask={true}
            header={`${log.name}, ${new Date(log.timestamp).toLocaleString()}`}
            pt={{
                root: {
                    className: classNames('max-w-full', 'm-2')
                },
                content: {
                    className: classNames('max-w-full'),
                    style: { overflowWrap: 'break-word' }
                }
            }}
            onHide={() => {
                onHide()
                setStreamedLog('')
            }}
        >
            <pre style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{streamedLog}</pre>
        </Dialog>
    )
}

export default LogDialog
