// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'

import 'primereact/resources/themes/lara-light-indigo/theme.css' //theme
import 'primereact/resources/primereact.min.css' //core css
import 'primeicons/primeicons.css' //icons
import 'primeflex/primeflex.css' // flex
import './App.css'
import { Toast } from 'primereact/toast'
import { MenuItem } from 'primereact/menuitem'
import { Api, AuthDTO } from './api/Api'
import { BlockUI } from 'primereact/blockui'
import { TabMenu } from 'primereact/tabmenu'
import { classNames } from 'primereact/utils'
import { getId } from './utils/get-id'
import { InputSwitch } from 'primereact/inputswitch'
import { Button } from 'primereact/button'
import AppContext from '@/AppContext'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { useTranslation } from 'react-i18next'
import Loading from '@/components/Loading'

const StudentTab = lazy(() => import('@/tabs/student-tab/StudentTab'))
const TeacherTab = lazy(() => import('@/tabs/teacher-tab/TeacherTab'))
const LogTab = lazy(() => import('@/tabs/log-tab/LogTab'))
const ErrorTab = lazy(() => import('@/tabs/error-tab/ErrorTab'))
const ScheduleTab = lazy(() => import('@/tabs/schedule-tab/ScheduleTab'))
const ConfigTab = lazy(() => import('@/tabs/config-tab/ConfigTab'))
const AdminTab = lazy(() => import('@/tabs/admin-tab/AdminTab'))

function App() {
    const toast = useRef<Toast>(null)
    const [blocked, setBlocked] = useState(0)

    const ltik = useMemo(() => {
        const searchParams = new URLSearchParams(window.location.search)
        return searchParams.get('ltik')
    }, [])

    const connection = useMemo(
        () =>
            ltik
                ? new Api({
                      baseUrl:
                          import.meta.env['VITE_SERVER_URL'] ??
                          `${window.location.protocol}//${window.location.hostname}:${window.location.port}`,
                      baseApiParams: {
                          headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${ltik}`
                          }
                      }
                  })
                : null,
        [ltik]
    )

    const { t, i18n } = useTranslation()

    function wrapNetworkRequest<T extends (...args: any) => Promise<void>>(networkRequest: T): T {
        return (async (...args: any) => {
            try {
                setBlocked((blocked) => blocked + 1)
                await networkRequest(...args)
            } catch (e: any) {
                if (
                    'error' in e &&
                    e.error &&
                    'error' in e.error &&
                    'details' in e.error &&
                    e.error.details &&
                    'description' in e.error.details
                ) {
                    toast.current?.show({
                        severity: 'error',
                        life: 3000,
                        summary: e.error.error,
                        detail: e.error.details.description
                    })
                } else {
                    toast.current?.show({
                        severity: 'error',
                        life: 3000,
                        summary: 'Error',
                        detail: 'An unknown error has happened'
                    })
                }
                console.error(e)
            } finally {
                setBlocked((blocked) => blocked - 1)
            }
        }) as T
    }

    const [auth, setAuth] = useState(null as AuthDTO | null)
    useEffect(() => {
        if (connection) {
            wrapNetworkRequest(async () => {
                const auth = await connection.api.authControllerAuth()
                setAuth(auth)
                await i18n.changeLanguage(auth.language)
                document.title = t('home.title')
            })()
        }
    }, [connection])

    const currentRole = useMemo(() => {
        return auth?.user.roles.find((r) => getId(r.course) === auth?.courseId)?.role ?? null
    }, [auth])

    const menuItems: MenuItem[] = useMemo(() => {
        return [
            currentRole === 'student' && (auth?.courseInstanceIds.length ?? 0) > 0
                ? {
                      id: 'student',
                      label: t('home.tabs.student'),
                      icon: 'pi pi-user'
                  }
                : undefined,
            currentRole === 'teacher' || currentRole === 'courseAdmin'
                ? {
                      id: 'teacher',
                      label: t('home.tabs.course'),
                      icon: 'pi pi-users'
                  }
                : undefined,
            currentRole === 'courseAdmin'
                ? {
                      id: 'logs',
                      label: t('home.tabs.log'),
                      icon: 'pi pi-receipt'
                  }
                : undefined,
            currentRole === 'courseAdmin'
                ? {
                      id: 'errors',
                      label: t('home.tabs.error'),
                      icon: 'pi pi-exclamation-triangle'
                  }
                : undefined,
            currentRole === 'courseAdmin'
                ? {
                      id: 'schedules',
                      label: t('home.tabs.schedules'),
                      icon: 'pi pi-calendar'
                  }
                : undefined,
            currentRole === 'courseAdmin'
                ? {
                      id: 'config',
                      label: t('home.tabs.config'),
                      icon: 'pi pi-cog'
                  }
                : undefined,
            auth?.user.isAdmin || connection === null
                ? {
                      id: 'admin',
                      label: t('home.tabs.admin'),
                      icon: 'pi pi-hammer'
                  }
                : undefined
        ]
            .filter((m) => m !== undefined)
            .map((m) => m!)
    }, [auth, currentRole])

    const [activeTab, setActiveTab] = useState('')
    useEffect(() => {
        setActiveTab(menuItems.length > 0 ? menuItems[0].id! : '')
    }, [menuItems])

    const [dangerMode, setDangerMode] = useState(false)
    const isIframe = typeof window !== 'undefined' && window.self !== window.top
    const confirmDialogRef = useRef<ConfirmDialog>(null)

    return (
        <AppContext.Provider value={{ dangerMode: dangerMode, role: currentRole }}>
            <BlockUI blocked={blocked > 0} fullScreen template={<Loading />}>
                <div
                    className={`flex flex-row justify-content-start align-items-center gap-2 px-3 ${dangerMode ? 'bg-red-600 text-white' : 'bg-gray-50'}`}
                >
                    <Toast ref={toast} />
                    <img src={reactLogo} className="" alt="Logo" />
                    <span className="text-lg mr-3">{t('home.title')}</span>
                    <TabMenu
                        model={menuItems}
                        activeIndex={menuItems.indexOf(menuItems.find((m) => m.id === activeTab) ?? menuItems[0])}
                        onTabChange={(e) => setActiveTab(e.value.id!)}
                        pt={{
                            menu: {
                                className: classNames('bg-transparent')
                            },
                            action: {
                                className: classNames(
                                    'border-noround',
                                    'bg-transparent',
                                    dangerMode ? 'text-white ' : undefined
                                )
                            }
                        }}
                    />
                    <div className="flex align-items-center justify-content-end gap-2 flex-grow-1">
                        {window.location.hostname === 'localhost' && (
                            <>
                                <Button
                                    severity="secondary"
                                    icon="pi pi-copy"
                                    text
                                    pt={{
                                        root: { className: classNames('px-2', 'py-1', 'border-circle', 'w-min') },
                                        label: {
                                            className: classNames('font-normal', dangerMode ? 'text-white' : undefined)
                                        }
                                    }}
                                    onClick={() => {
                                        if (ltik && !isIframe) {
                                            navigator.clipboard.writeText(ltik).then(() =>
                                                toast.current?.show({
                                                    severity: 'info',
                                                    content: 'LTIK copied',
                                                    closable: false,
                                                    life: 1000
                                                })
                                            )
                                        } else if (ltik) {
                                            confirmDialogRef.current?.confirm({
                                                message: ltik,
                                                header: 'Copy LTIK',
                                                acceptLabel: 'OK',
                                                visible: true
                                            })
                                        }
                                    }}
                                />
                                <ConfirmDialog
                                    ref={confirmDialogRef}
                                    pt={{
                                        root: {
                                            className: classNames('max-w-full', 'p-2')
                                        },
                                        message: {
                                            className: classNames('max-w-full', 'm-0'),
                                            style: { overflowWrap: 'break-word' }
                                        },
                                        rejectButton: {
                                            root: {
                                                className: classNames('hidden')
                                            }
                                        }
                                    }}
                                />
                            </>
                        )}
                        {(currentRole === 'courseAdmin' || auth?.user.isAdmin === true || activeTab === 'admin') && (
                            <>
                                {isIframe && (
                                    <Button
                                        severity="secondary"
                                        icon="pi pi-external-link"
                                        text
                                        pt={{
                                            root: { className: classNames('px-2', 'py-1', 'border-circle', 'w-min') },
                                            label: {
                                                className: classNames(
                                                    'font-normal',
                                                    dangerMode ? 'text-white' : undefined
                                                )
                                            }
                                        }}
                                        onClick={() => {
                                            window.open(window.location.href, '_blank')?.focus()
                                        }}
                                    />
                                )}
                                <label htmlFor="dangerMode" className="px-2 py-1">
                                    Danger mode
                                </label>
                                <InputSwitch
                                    inputId="dangerMode"
                                    checked={dangerMode}
                                    onChange={(e) => setDangerMode(e.value)}
                                />
                            </>
                        )}
                    </div>
                </div>
                <div
                    className="px-2 lg:px-4 py-2 lg:py-4 max-w-full mx-auto"
                    style={{ width: '1700px', boxSizing: 'border-box' }}
                >
                    {activeTab === 'student' && auth && connection && (
                        <Suspense fallback={<Loading />}>
                            <StudentTab
                                courseId={auth.courseId}
                                courseInstanceId={auth.courseInstanceIds[0]}
                                courseType={auth.courseType}
                                user={auth.user}
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'teacher' && auth && connection && (
                        <Suspense fallback={<Loading />}>
                            <TeacherTab
                                courseId={auth.courseId}
                                courseType={auth.courseType}
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'logs' && auth && connection && (
                        <Suspense fallback={<Loading />}>
                            <LogTab
                                courseId={auth.courseId}
                                courseType={auth.courseType}
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'errors' && auth && connection && (
                        <Suspense fallback={<Loading />}>
                            <ErrorTab
                                courseId={auth.courseId}
                                courseType={auth.courseType}
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'schedules' && auth && connection && (
                        <Suspense fallback={<Loading />}>
                            <ScheduleTab
                                courseId={auth.courseId}
                                courseType={auth.courseType}
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'config' && auth && connection && (
                        <Suspense fallback={<Loading />}>
                            <ConfigTab
                                courseId={auth.courseId}
                                courseType={auth.courseType}
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                    {activeTab === 'admin' && (
                        <Suspense fallback={<Loading />}>
                            <AdminTab
                                connection={connection}
                                wrapNetworkRequest={wrapNetworkRequest}
                                toast={toast.current?.show ?? (() => {})}
                            />
                        </Suspense>
                    )}
                </div>
            </BlockUI>
        </AppContext.Provider>
    )
}

export default App
