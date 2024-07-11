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
import { PhaseDTO, PhaseInstanceDTO } from '@/components/phase/Phase'
import SmartEditDialog from '@/components/edit-dialog/SmartEditDialog'
import { updateTaskInstanceArgsSchema } from '@/api/SwaggerSchema'
import { ConfirmDialog } from 'primereact/confirmdialog'
import {
    taskInstanceControllerDeleteTaskInstanceData,
    taskInstanceControllerUpdateTaskInstanceData
} from '@/api/ApiCalls'
import { sanitize } from '@/utils/sanitize'
import { useTranslation } from 'react-i18next'
import ActionDialog from '@/components/ActionDialog'
import Loading from '@/components/Loading'

export interface TaskDTO {
    _id: string
    phase: string | PhaseDTO
    deadline: string | null
    type: string
    locked: boolean
    blocked: boolean
    history: { event: string; successful: boolean; timestamp: string; log: string | null; data: object | null }[]
}

export interface TaskInstanceDTO {
    _id: string
    phaseInstances: (string | PhaseInstanceDTO)[]
    task: string | TaskDTO
    type: string
    locked: boolean
    blocked: boolean
    history: { event: string; successful: boolean; timestamp: string; log: string | null; data: object | null }[]
}

export enum TaskStatus {
    InProgress,
    Success,
    Failure,
    Evaluate
}

export type TaskContentProps<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO,
    T extends TaskDTO = TaskDTO,
    TI extends TaskInstanceDTO = TaskInstanceDTO
> = {
    user?: UserDTO
    course: C
    courseInstances: CI[]
    phase: P
    phaseInstances: PI[]
    task: T
    taskInstance: TI
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
    onRefresh: () => void
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        TaskContentStore: {
            [type: string]:
                | {
                      node: (props: TaskContentProps) => ReactNode
                      getStatus: (taskInstance: TaskInstanceDTO) => TaskStatus
                  }
                | undefined
        }
    }
}
window.TaskContentStore = window.TaskContentStore || {}

export function registerTaskContent<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO,
    T extends TaskDTO = TaskDTO,
    TI extends TaskInstanceDTO = TaskInstanceDTO
>(
    type: string,
    content: (props: TaskContentProps<C, CI, P, PI, T, TI>) => ReactNode,
    getStatus: (taskInstance: TI) => TaskStatus
) {
    window.TaskContentStore[type] = { node: content as any, getStatus: getStatus as any }
}

export type TaskProps = TaskContentProps & {
    onStatusChange?: (status: TaskStatus) => void
    collapsible?: boolean
    headerPrefix?: ReactNode
    headerSuffix?: ReactNode
}

function Task(props: TaskProps) {
    const {
        course,
        phase,
        task,
        taskInstance,
        onStatusChange,
        collapsible,
        headerPrefix,
        headerSuffix,
        connection,
        wrapNetworkRequest,
        onRefresh
    } = props

    const { t } = useTranslation()

    const appContext = useContext(AppContext)

    const panelRef = useRef(null as Panel | null)

    const [showEdit, setShowEdit] = useState(false)
    const [history, setHistory] = useState(null as any)
    const [showActions, setShowActions] = useState(false)

    const statusStyle = {
        [TaskStatus.InProgress]: { border: 'border-200', backgroundColor: 'surface-50' },
        [TaskStatus.Success]: { border: 'border-green-400', backgroundColor: 'bg-green-100' },
        [TaskStatus.Failure]: { border: 'border-red-400', backgroundColor: 'bg-red-100' },
        [TaskStatus.Evaluate]: { border: 'border-cyan-400', backgroundColor: 'bg-cyan-100' }
    }

    const TaskContent = window.TaskContentStore[taskInstance.type]
    const status = TaskContent?.getStatus(taskInstance) ?? TaskStatus.InProgress
    useEffect(() => {
        onStatusChange?.(status)
    }, [])

    const confirmDialogRef = useRef<ConfirmDialog>(null)

    return (
        <>
            <Panel
                ref={panelRef}
                collapsed={collapsible !== false && [TaskStatus.Success, TaskStatus.Failure].includes(status)}
                header={
                    <div className="flex justify-content-start align-items-center gap-2">
                        {headerPrefix}
                        <span className="flex-grow-1">
                            {t(`tasks.title.${taskInstance.type}`)}
                            {task.deadline ? (
                                <>
                                    &nbsp;(<i className="pi pi-calendar-clock">&nbsp;</i>
                                    {t('common.deadline', { date: new Date(task.deadline) })})
                                </>
                            ) : (
                                ''
                            )}
                            : {t(`tasks.status.${status}`)}
                        </span>
                        <Button
                            text
                            severity="secondary"
                            className="p-panel-header-icon"
                            icon="pi pi-history"
                            onClick={() => setHistory(taskInstance.history)}
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
                                                    await taskInstanceControllerDeleteTaskInstanceData(
                                                        connection,
                                                        course.type,
                                                        phase.type,
                                                        task.type,
                                                        taskInstance._id
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
                {TaskContent && (
                    <Suspense fallback={<Loading />}>
                        <TaskContent.node {...props} />
                    </Suspense>
                )}
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
                    targetId={taskInstance._id}
                    courseType={course.type}
                    phaseType={phase.type}
                    taskType={taskInstance.type}
                    instance={true}
                />
            )}
            <SmartEditDialog
                data={taskInstance}
                schema={updateTaskInstanceArgsSchema(course.type, phase.type, task.type)}
                show={showEdit}
                header="Edit task"
                onHide={() => setShowEdit(false)}
                onSave={(taskArgs) => {
                    wrapNetworkRequest(async () => {
                        await taskInstanceControllerUpdateTaskInstanceData(
                            connection,
                            course.type,
                            phase.type,
                            task.type,
                            taskInstance._id,
                            sanitize(taskArgs, updateTaskInstanceArgsSchema(course.type, phase.type, task.type))
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

export default Task
