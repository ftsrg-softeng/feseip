// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { useEffect, useMemo, useState } from 'react'
import { ToastMessage } from 'primereact/toast'
import { MenuItem } from 'primereact/menuitem'
import { TabMenu } from 'primereact/tabmenu'
import PlatformsPanel from './PlatformsPanel'
import CoursesPanel from './CoursesPanel'
import { Api } from '@/api/Api'
import { BlockUI } from 'primereact/blockui'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import UsersPanel from './UsersPanel'

type Props = {
    connection: Api<unknown> | null
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const AdminTab: React.FC<Props> = ({ connection, wrapNetworkRequest, toast }) => {
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')
    const [basicAuth, setBasicAuth] = useState(null as string | null)

    const adminConnection = useMemo(
        () =>
            connection ??
            new Api({
                baseUrl:
                    import.meta.env['VITE_SERVER_URL'] ??
                    `${window.location.protocol}//${window.location.hostname}:${window.location.port}`,
                baseApiParams: {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: basicAuth ? `Basic ${basicAuth}` : ''
                    }
                }
            }),
        [basicAuth]
    )

    const [authenticated, setAuthenticated] = useState(null as null | boolean)
    useEffect(() => {
        authenticate().then()
    }, [adminConnection])

    const authenticate = wrapNetworkRequest(async () => {
        try {
            await adminConnection.api.authControllerAdminAuth()
            setAuthenticated(true)
            setUserName('')
            setPassword('')
        } catch (e) {
            setAuthenticated(false)
        }
    })

    type Panel = 'platforms' | 'courses' | 'users'
    const [panel, setPanel] = useState<Panel>('platforms')

    const panels: (MenuItem & { id: Panel })[] = [
        {
            id: 'platforms',
            label: 'Platforms',
            icon: 'pi pi-link'
        },
        {
            id: 'courses',
            label: 'Courses',
            icon: 'pi pi-graduation-cap'
        },
        {
            id: 'users',
            label: 'Users',
            icon: 'pi pi-users'
        }
    ]

    // noinspection PointlessBooleanExpressionJS
    return (
        <BlockUI
            blocked={authenticated === false}
            fullScreen
            template={
                <Dialog visible={true} modal={false} closable={false} onHide={() => {}}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            setBasicAuth(btoa(`${userName}:${password}`))
                        }}
                    >
                        <div className="field grid">
                            <label htmlFor="username" className="col-12 mb-2 md:col-4 md:mb-0">
                                Username
                            </label>
                            <div className="col-12 md:col-8">
                                <InputText
                                    id="username"
                                    className="w-full"
                                    value={userName}
                                    onChange={(e) => {
                                        setUserName(e.target.value)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="field grid">
                            <label htmlFor="password" className="col-12 mb-2 md:col-4 md:mb-0">
                                Password
                            </label>
                            <div className="col-12 md:col-8">
                                <InputText
                                    id="password"
                                    className="w-full"
                                    value={password}
                                    type="password"
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="field grid">
                            <div className="hidden md:block md:col-4" />
                            <div className="col-12 md:col-8">
                                <Button severity="warning" type="submit" label="Login" />
                            </div>
                        </div>
                    </form>
                </Dialog>
            }
        >
            {authenticated && (
                <>
                    <TabMenu
                        model={panels}
                        activeIndex={panels.findIndex((p) => p.id === panel)}
                        onTabChange={(e) => setPanel(e.value.id as Panel)}
                    />
                    <div className="mt-3">
                        {panel === 'platforms' && (
                            <PlatformsPanel
                                connection={adminConnection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast}
                            />
                        )}
                        {panel === 'courses' && (
                            <CoursesPanel
                                connection={adminConnection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast}
                            />
                        )}
                        {panel === 'users' && (
                            <UsersPanel
                                connection={adminConnection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast}
                            />
                        )}
                    </div>
                </>
            )}
        </BlockUI>
    )
}

export default AdminTab
