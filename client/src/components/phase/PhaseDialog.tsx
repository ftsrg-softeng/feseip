// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { useEffect, useState } from 'react'
import Phase, { PhaseInstanceDTO, PhaseProps } from '@/components/phase/Phase'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { TaskInstanceDTO } from '@/components/task/Task'
import { phaseInstanceControllerGetPhaseInstanceData } from '@/api/ApiCalls'

type PhaseDialogProps = Omit<PhaseProps, 'phaseInstance'> & {
    phaseInstance: PhaseInstanceDTO
    header: React.ReactNode
    onHide: () => void
    onRefresh: () => void
}

function PhaseDialog(props: PhaseDialogProps) {
    const { phaseInstance, onHide, onRefresh, header, wrapNetworkRequest, connection, course, phase } = props

    const [phaseInstanceWithTaskInstances, setPhaseInstanceWithTaskInstances] = useState(
        null as (PhaseInstanceDTO & { taskInstances: TaskInstanceDTO[] }) | null
    )

    const loadPhaseInstance = wrapNetworkRequest(async () => {
        const phaseInstanceWithTaskInstances = await phaseInstanceControllerGetPhaseInstanceData(
            connection,
            course.type,
            phase.type,
            phaseInstance._id
        )
        setPhaseInstanceWithTaskInstances(phaseInstanceWithTaskInstances)
    })

    useEffect(() => {
        loadPhaseInstance().then()
    }, [connection, course, phase, phaseInstance])

    return (
        <>
            {phaseInstanceWithTaskInstances && (
                <Dialog
                    visible={true}
                    dismissableMask={true}
                    onHide={onHide}
                    className="max-w-screen p-2 max-h-screen overflow-y-auto"
                    style={{ width: '1200px' }}
                    content={({ hide }) => (
                        <Phase
                            {...props}
                            phaseInstance={phaseInstanceWithTaskInstances}
                            collapsible={false}
                            headerPrefix={header}
                            headerSuffix={
                                <>
                                    <Button
                                        text
                                        severity="secondary"
                                        className="p-panel-header-icon"
                                        icon="pi pi-refresh"
                                        onClick={onRefresh}
                                    />
                                    <Button
                                        text
                                        severity="secondary"
                                        className="p-panel-header-icon"
                                        icon="pi pi-times"
                                        onClick={hide}
                                    />
                                </>
                            }
                        />
                    )}
                />
            )}
        </>
    )
}

export default PhaseDialog
