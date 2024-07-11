// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React from 'react'
import Task, { TaskProps } from '@/components/task/Task'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'

type TaskDialogProps = TaskProps & {
    header: React.ReactNode
    onHide: () => void
    onRefresh: () => void
}

function TaskDialog(props: TaskDialogProps) {
    const { onHide, onRefresh, header } = props

    return (
        <Dialog
            visible={true}
            dismissableMask={true}
            onHide={onHide}
            className="max-w-screen p-2 max-h-screen overflow-y-auto"
            style={{ width: '1200px' }}
            content={({ hide }) => (
                <Task
                    {...props}
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
    )
}

export default TaskDialog
