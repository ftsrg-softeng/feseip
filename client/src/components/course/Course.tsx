// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Api, UserDTO } from '@/api/Api'
import { ToastMessage } from 'primereact/toast'
import React, { ReactNode, Suspense, useContext, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'
import HistoryDialog from '@/components/HistoryDialog'
import AppContext from '@/AppContext'
import { Panel } from 'primereact/panel'
import Phase, { PhaseDTO, PhaseInstanceDTO, PhaseStatus } from '@/components/phase/Phase'
import { getId } from '@/utils/get-id'
import { TaskDTO, TaskInstanceDTO } from '@/components/task/Task'
import SmartEditDialog from '@/components/edit-dialog/SmartEditDialog'
import { updateCourseInstanceArgsSchema } from '@/api/SwaggerSchema'
import {
    courseInstanceControllerDeleteCourseInstanceData,
    courseInstanceControllerUpdateCourseInstanceData
} from '@/api/ApiCalls'
import { sanitize } from '@/utils/sanitize'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { useTranslation } from 'react-i18next'
import ActionDialog from '@/components/ActionDialog'
import Loading from '@/components/Loading'

export interface CourseDTO {
    _id: string
    name: string
    type: string
    apiKey: string
    locked: boolean
    blocked: boolean
    history: { event: string; successful: boolean; timestamp: string; log: string | null; data: object | null }[]
}

export interface CourseInstanceDTO {
    _id: string
    user: string | UserDTO
    course: string | CourseDTO
    type: string
    locked: boolean
    blocked: boolean
    history: { event: string; successful: boolean; timestamp: string; log: string | null; data: object | null }[]
}

export enum CourseStatus {
    InProgress,
    Success,
    Failure,
    Evaluate
}

export type CourseContentProps<C extends CourseDTO = CourseDTO, CI extends CourseInstanceDTO = CourseInstanceDTO> = {
    user?: UserDTO
    course: C
    courseInstance: CI & { phaseInstances: (PhaseInstanceDTO & { taskInstances: TaskInstanceDTO[] })[] }
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
    setCourseStatus: (status: CourseStatus) => void
    onRefresh: () => void
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        CourseContentStore: { [type: string]: ((props: CourseContentProps) => ReactNode) | undefined }
    }
}
window.CourseContentStore = window.CourseContentStore || {}

export function registerCourseContent<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO
>(type: string, content: (props: CourseContentProps<C, CI>) => ReactNode) {
    window.CourseContentStore[type] = content as any
}

export type CourseProps = Omit<CourseContentProps, 'setCourseStatus'> & {
    course: { phases: (PhaseDTO & { tasks: TaskDTO[] })[] }
    courseInstance: { phaseInstances: (PhaseInstanceDTO & { taskInstances: TaskInstanceDTO[] })[] }
    headerSuffix?: ReactNode
}

function Course(props: CourseProps) {
    const { user, course, courseInstance, onRefresh, headerSuffix, wrapNetworkRequest, connection } = props

    const { t } = useTranslation()

    const appContext = useContext(AppContext)

    const [status, setStatus] = useState(CourseStatus.InProgress)

    const [showEdit, setShowEdit] = useState(false)
    const [history, setHistory] = useState(null as any)
    const [showActions, setShowActions] = useState(false)

    const statusStyle = {
        [CourseStatus.InProgress]: { border: 'border-200', backgroundColor: 'surface-50' },
        [CourseStatus.Success]: { border: 'border-green-400', backgroundColor: 'bg-green-100' },
        [CourseStatus.Failure]: { border: 'border-red-400', backgroundColor: 'bg-red-100' },
        [CourseStatus.Evaluate]: { border: 'border-cyan-400', backgroundColor: 'bg-cyan-100' }
    }

    const [phaseStatuses, setPhaseStatuses] = useState({} as { [phaseInstanceId: string]: PhaseStatus })

    const confirmDialogRef = useRef<ConfirmDialog>(null)

    const CourseContent = window.CourseContentStore[courseInstance.type]
    return (
        <div className="flex flex-column gap-2 lg:gap-4">
            <Panel
                header={
                    <div className="text-lg flex justify-content-start align-items-center gap-2">
                        <span className="pi pi-user text-2xl" />
                        {user && (
                            <span className="flex-grow-1">
                                {t('user.name', { familyName: user.familyName, givenName: user.givenName })} (
                                {user.moodleId})
                            </span>
                        )}
                        {!user && <span className="flex-grow-1">DELETED</span>}
                        <Button
                            text
                            severity="secondary"
                            className="p-panel-header-icon"
                            icon="pi pi-history"
                            onClick={() => setHistory(courseInstance.history)}
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
                                                    await courseInstanceControllerDeleteCourseInstanceData(
                                                        connection,
                                                        course.type,
                                                        courseInstance._id
                                                    )
                                                })().finally(onRefresh)
                                            }
                                        })
                                    }
                                />
                            </>
                        )}
                        <Button
                            text
                            severity="secondary"
                            className="p-panel-header-icon"
                            icon="pi pi-refresh"
                            onClick={onRefresh}
                        />
                        {headerSuffix}
                    </div>
                }
                pt={{
                    title: {
                        className: classNames('flex-grow-1')
                    },
                    header: {
                        className: classNames(statusStyle[status].border, statusStyle[status].backgroundColor)
                    },
                    content: {
                        className: classNames(statusStyle[status].border)
                    }
                }}
            >
                {CourseContent && (
                    <Suspense fallback={<Loading />}>
                        <CourseContent {...props} setCourseStatus={setStatus} />
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
            {courseInstance.phaseInstances.length > 0 &&
                [CourseStatus.InProgress, CourseStatus.Evaluate].includes(status) &&
                !Object.values(phaseStatuses).some((s) =>
                    [PhaseStatus.InProgress, PhaseStatus.Evaluate].includes(s)
                ) && (
                    <div className="flex flex-column gap-2 align-items-center justify-content-center my-2">
                        <span className="pi pi-pause-circle text-5xl" />
                        <span>{t('phases.nothingToDo')}</span>
                    </div>
                )}
            {courseInstance.phaseInstances.toReversed().map((phaseInstance, index) => (
                <Phase
                    key={index}
                    courseInstances={[courseInstance]}
                    phase={course.phases.find((p) => p._id === getId(phaseInstance.phase))!}
                    phaseInstance={phaseInstance}
                    {...props}
                    onStatusChange={(s) => {
                        setPhaseStatuses((phaseStatuses) => ({ ...phaseStatuses, [`${phaseInstance._id}`]: s }))
                    }}
                    headerSuffix={undefined}
                />
            ))}
            {showActions && (
                <ActionDialog
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    show={true}
                    onHide={() => setShowActions(false)}
                    targetId={courseInstance._id}
                    courseType={courseInstance.type}
                    instance={true}
                />
            )}
            <SmartEditDialog
                data={courseInstance}
                schema={updateCourseInstanceArgsSchema(course.type)}
                show={showEdit}
                header="Edit task"
                onHide={() => setShowEdit(false)}
                onSave={(taskArgs) => {
                    wrapNetworkRequest(async () => {
                        await courseInstanceControllerUpdateCourseInstanceData(
                            connection,
                            course.type,
                            courseInstance._id,
                            sanitize(taskArgs, updateCourseInstanceArgsSchema(course.type))
                        )
                    })()
                        .then(() => setShowEdit(false))
                        .finally(onRefresh)
                }}
            />
            <ConfirmDialog ref={confirmDialogRef} />
        </div>
    )
}

export default Course
