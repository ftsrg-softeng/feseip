// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { useContext, useEffect, useState } from 'react'
import SmartDataTable from '../../components/data-table/SmartDataTable'
import { Button } from 'primereact/button'
import { ToastMessage } from 'primereact/toast'
import SmartEditDialog from '../../components/edit-dialog/SmartEditDialog'
import { Api, PlatformDTO } from '@/api/Api'
import SwaggerSchema from '@/api/SwaggerSchema'
import AppContext from '@/AppContext'
import { classNames } from 'primereact/utils'

type Props = {
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const PlatformPanel: React.FC<Props> = ({ connection, wrapNetworkRequest }) => {
    const appContext = useContext(AppContext)

    const [platforms, setPlatforms] = useState([] as PlatformDTO[])

    const loadPlatforms = wrapNetworkRequest(async () => {
        const platforms = await connection.api.platformControllerGetPlatforms()
        setPlatforms(platforms)
    })

    const deletePlatform = wrapNetworkRequest(async (platform: PlatformDTO) => {
        await connection.api.platformControllerDeletePlatform({ url: platform.url, clientId: platform.clientId })
        await loadPlatforms()
    })

    const addPlatform = wrapNetworkRequest(async (name: string, url: string, clientId: string) => {
        await connection.api.platformControllerAddPlatform({ name, url, clientId })
        resetAddDialog()
        await loadPlatforms()
    })

    const [showAddDialog, setShowAddDialog] = useState(false)

    function resetAddDialog() {
        setShowAddDialog(false)
    }

    useEffect(() => {
        loadPlatforms().then()
    }, [])

    return (
        <>
            <SmartDataTable
                values={platforms.map((platform, index) => ({ ...platform, id: index }))}
                columns={['name', 'url', 'clientId']}
                idColumn="id"
                tableToolbar={() => (
                    <div className="flex gap-2">
                        <Button
                            size="small"
                            outlined
                            severity="info"
                            icon="pi pi-refresh"
                            label="Reload"
                            onClick={loadPlatforms}
                        />
                        <Button
                            size="small"
                            severity="success"
                            icon="pi pi-plus"
                            label="Add"
                            onClick={() => setShowAddDialog(true)}
                        />
                    </div>
                )}
                rowToolbar={(platform) => (
                    <>
                        {appContext.dangerMode && (
                            <Button
                                size="small"
                                severity="danger"
                                icon="pi pi-times"
                                pt={{ root: { className: classNames('p-1') } }}
                                onClick={() => deletePlatform(platform)}
                            />
                        )}
                    </>
                )}
            />
            <SmartEditDialog
                header="Add platform"
                schema={SwaggerSchema.components.schemas.CreatePlatformArgs}
                config={{
                    name: { label: 'Name' },
                    url: { label: 'Url' },
                    clientId: { label: 'Client ID' }
                }}
                show={showAddDialog}
                onHide={resetAddDialog}
                onSave={(platform) => {
                    addPlatform(platform.name, platform.url, platform.clientId).then()
                }}
            />
        </>
    )
}

export default PlatformPanel
