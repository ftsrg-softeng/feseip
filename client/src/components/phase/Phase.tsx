// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseDTO, CourseInstanceDTO } from '@/components/course/Course'
import { Api, UserDTO } from '@/api/Api'
import { ToastMessage } from 'primereact/toast'
import React, { ReactNode, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { Panel } from 'primereact/panel'
import { classNames } from 'primereact/utils'
import { Button } from 'primereact/button'
import AppContext from '@/AppContext'
import HistoryDialog from '@/components/HistoryDialog'
import Task, { TaskDTO, TaskInstanceDTO, TaskStatus } from '@/components/task/Task'
import { getId } from '@/utils/get-id'
import { ConfirmDialog } from 'primereact/confirmdialog'
import {
    phaseInstanceControllerDeletePhaseInstanceData,
    phaseInstanceControllerUpdatePhaseInstanceData
} from '@/api/ApiCalls'
import SmartEditDialog from '@/components/edit-dialog/SmartEditDialog'
import { updatePhaseInstanceArgsSchema } from '@/api/SwaggerSchema'
import { sanitize } from '@/utils/sanitize'
import { useTranslation } from 'react-i18next'
import ActionDialog from '@/components/ActionDialog'
import Loading from '@/components/Loading'

export interface PhaseDTO {
    _id: string
    course: string | CourseDTO
    deadline: string | null
    type: string
    locked: boolean
    blocked: boolean
    history: { event: string; successful: boolean; timestamp: string; log: string | null; data: object | null }[]
}

export interface PhaseInstanceDTO {
    _id: string
    courseInstances: (string | CourseInstanceDTO)[]
    phase: string | PhaseDTO
    type: string
    locked: boolean
    blocked: boolean
    history: { event: string; successful: boolean; timestamp: string; log: string | null; data: object | null }[]
}

export enum PhaseStatus {
    InProgress,
    Success,
    Failure,
    Evaluate
}

export type PhaseContentProps<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO
> = {
    user?: UserDTO
    course: C
    courseInstances: CI[]
    phase: P
    phaseInstance: PI & { taskInstances: TaskInstanceDTO[] }
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
    onRefresh: () => void
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        PhaseContentStore: {
            [type: string]:
                | {
                      node: (props: PhaseContentProps) => ReactNode
                      getStatus: (phaseInstance: PhaseInstanceDTO) => PhaseStatus
                  }
                | undefined
        }
    }
}
window.PhaseContentStore = window.PhaseContentStore || {}

export function registerPhaseContent<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO
>(
    type: string,
    content: (props: PhaseContentProps<C, CI, P, PI>) => ReactNode,
    getStatus: (phaseInstance: PI) => PhaseStatus
) {
    window.PhaseContentStore[type] = { node: content as any, getStatus: getStatus as any }
}

export type PhaseProps = PhaseContentProps & {
    phase: { tasks: TaskDTO[] }
    phaseInstance: { taskInstances: TaskInstanceDTO[] }
    onStatusChange?: (status: PhaseStatus) => void
    collapsible?: boolean
    headerPrefix?: ReactNode
    headerSuffix?: ReactNode
}

function Phase(props: PhaseProps) {
    const {
        course,
        phase,
        phaseInstance,
        onStatusChange,
        collapsible,
        headerPrefix,
        headerSuffix,
        wrapNetworkRequest,
        connection,
        onRefresh
    } = props

    const { t } = useTranslation()

    const appContext = useContext(AppContext)

    const panelRef = useRef(null as Panel | null)

    const [showEdit, setShowEdit] = useState(false)
    const [history, setHistory] = useState(null as any)
    const [showActions, setShowActions] = useState(false)

    const statusStyle = {
        [PhaseStatus.InProgress]: { border: 'border-200', backgroundColor: 'surface-50' },
        [PhaseStatus.Success]: { border: 'border-green-400', backgroundColor: 'bg-green-100' },
        [PhaseStatus.Failure]: { border: 'border-red-400', backgroundColor: 'bg-red-100' },
        [PhaseStatus.Evaluate]: { border: 'border-cyan-400', backgroundColor: 'bg-cyan-100' }
    }

    const [taskStatuses, setTaskStatuses] = useState({} as { [taskInstanceId: string]: TaskStatus })

    const PhaseContent = window.PhaseContentStore[phaseInstance.type]
    const status = PhaseContent?.getStatus(phaseInstance) ?? PhaseStatus.InProgress
    useEffect(() => {
        onStatusChange?.(status)
    }, [])

    const confirmDialogRef = useRef<ConfirmDialog>(null)

    return (
        <>
            <Panel
                ref={panelRef}
                collapsed={collapsible !== false && [PhaseStatus.Success, PhaseStatus.Failure].includes(status)}
                header={
                    <div className="flex justify-content-start align-items-center gap-2">
                        {headerPrefix}
                        <span className="flex-grow-1">
                            {t(`phases.title.${phaseInstance.type}`)}
                            {phase.deadline ? (
                                <>
                                    &nbsp;(<i className="pi pi-calendar-clock">&nbsp;</i>
                                    {t('common.deadline', { date: new Date(phase.deadline) })})
                                </>
                            ) : (
                                ''
                            )}
                            : {t(`phases.status.${status}`)}
                        </span>
                        <Button
                            text
                            severity="secondary"
                            className="p-panel-header-icon"
                            icon="pi pi-history"
                            onClick={() => setHistory(phaseInstance.history)}
                        />
                        {appContext.dangerMode && (
                            <>
                                <Button
                                    text
                                    severity="danger"
                                    className="p-panel-header-icon"
                                    icon="pi pi-play"
                                    onClick={() => setShowActions(true)}
                                />
                                <Button
                                    text
                                    severity="danger"
                                    className="p-panel-header-icon"
                                    icon="pi pi-pencil"
                                    onClick={() => setShowEdit(true)}
                                />
                                <Button
                                    text
                                    severity="danger"
                                    className="p-panel-header-icon"
                                    icon="pi pi-trash"
                                    onClick={() =>
                                        confirmDialogRef.current?.confirm({
                                            message: 'Are you sure that you want to delete it?',
                                            header: 'Confirmation',
                                            icon: 'pi pi-exclamation-triangle',
                                            defaultFocus: 'reject',
                                            visible: true,
                                            accept: () => {
                                                wrapNetworkRequest(async () => {
                                                    await phaseInstanceControllerDeletePhaseInstanceData(
                                                        connection,
                                                        course.type,
                                                        phase.type,
                                                        phaseInstance._id
                                                    )
                                                })().finally(onRefresh)
                                            }
                                        })
                                    }
                                />
                            </>
                        )}
                        {headerSuffix}
                    </div>
                }
                toggleable={collapsible ?? true}
                pt={{
                    title: {
                        className: classNames('flex-grow-1', collapsible ?? true ? 'mr-2' : '')
                    },
                    header: {
                        className: classNames(statusStyle[status].border, statusStyle[status].backgroundColor)
                    },
                    content: {
                        className: classNames(statusStyle[status].border)
                    }
                }}
            >
                {PhaseContent && (
                    <Suspense fallback={<Loading />}>
                        <PhaseContent.node {...props} />
                    </Suspense>
                )}
                {phaseInstance.taskInstances.length > 0 &&
                    [PhaseStatus.InProgress, PhaseStatus.Evaluate].includes(status) &&
                    !Object.values(taskStatuses).some((s) =>
                        [TaskStatus.InProgress, TaskStatus.Evaluate].includes(s)
                    ) && (
                        <div className="flex flex-column gap-2 align-items-center justify-content-center mb-2">
                            <span className="pi pi-pause-circle text-5xl" />
                            <span>{t('tasks.nothingToDo')}</span>
                        </div>
                    )}
                <div className="flex flex-column gap-2">
                    {phaseInstance.taskInstances.map((taskInstance, index) => {
                        return (
                            <Task
                                key={index}
                                phaseInstances={[phaseInstance]}
                                task={phase.tasks.find((t) => t._id === getId(taskInstance.task))!}
                                taskInstance={taskInstance}
                                {...props}
                                onStatusChange={(s) =>
                                    setTaskStatuses((taskStatuses) => ({ ...taskStatuses, [`${taskInstance._id}`]: s }))
                                }
                            />
                        )
                    })}
                </div>
            </Panel>
            <HistoryDialog
                show={history !== null}
                onHide={() => setHistory(null)}
                history={history}
                advancedMode={appContext.role !== 'student'}
                connection={connection}
                course={course}
            />
            {showActions && (
                <ActionDialog
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    show={true}
                    onHide={() => setShowActions(false)}
                    targetId={phaseInstance._id}
                    courseType={course.type}
                    phaseType={phaseInstance.type}
                    instance={true}
                />
            )}
            <SmartEditDialog
                data={phaseInstance}
                schema={updatePhaseInstanceArgsSchema(course.type, phase.type)}
                show={showEdit}
                header="Edit task"
                onHide={() => setShowEdit(false)}
                onSave={(taskArgs) => {
                    wrapNetworkRequest(async () => {
                        await phaseInstanceControllerUpdatePhaseInstanceData(
                            connection,
                            course.type,
                            phase.type,
                            phaseInstance._id,
                            sanitize(taskArgs, updatePhaseInstanceArgsSchema(course.type, phase.type))
                        )
                    })()
                        .then(() => setShowEdit(false))
                        .finally(onRefresh)
                }}
            />
            <ConfirmDialog ref={confirmDialogRef} />
        </>
    )
}

export default Phase
