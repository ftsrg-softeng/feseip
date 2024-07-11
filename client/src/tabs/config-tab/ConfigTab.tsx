// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ToastMessage } from 'primereact/toast'
import React, { useEffect, useMemo, useState } from 'react'
import { Api } from '@/api/Api'
import { updateCourseArgsSchema, updatePhaseArgsSchema, updateTaskArgsSchema } from '@/api/SwaggerSchema'
import {
    courseControllerGetCourseData,
    courseControllerUpdateCourseData,
    phaseControllerUpdatePhaseData,
    taskControllerUpdateTaskData
} from '@/api/ApiCalls'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import HistoryDialog from '@/components/HistoryDialog'
import SmartEditDialog from '@/components/edit-dialog/SmartEditDialog'
import { sanitize } from '@/utils/sanitize'
import ActionDialog from '@/components/ActionDialog'
import { classNames } from 'primereact/utils'

type Props = {
    courseId: string
    courseType: string
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const ConfigTab: React.FC<Props> = ({ courseId, courseType, connection, wrapNetworkRequest }) => {
    const [course, setCourse] = useState(null as null | any)

    const courseTree = useMemo(() => {
        if (course === null) {
            return null
        }

        return [
            {
                key: course.type,
                label: course.type,
                data: { type: course.type, kind: 'course', course },
                expanded: true,
                children: course.phases.map((phase: any) => ({
                    key: `${course.type}.${phase.type}`,
                    label: phase.type,
                    data: { type: phase.type, kind: 'phase', course, phase },
                    expanded: true,
                    children: phase.tasks.map((task: any) => ({
                        key: `${course.type}.${phase.type}.${task.type}`,
                        label: task.type,
                        data: { type: task.type, kind: 'task', course, phase, task },
                        expanded: true
                    }))
                }))
            }
        ]
    }, [course])

    const loadCourse = wrapNetworkRequest(async () => {
        const course = await courseControllerGetCourseData(connection, courseType, courseId)
        setCourse(course)
    })

    useEffect(() => {
        loadCourse().then()
    }, [])

    const [historyDialog, setHistoryDialog] = useState(null as any | null)

    const [courseEdit, setCourseEdit] = useState(null as any | null)
    const editCourse = wrapNetworkRequest(async (course: any) => {
        await courseControllerUpdateCourseData(
            connection,
            courseEdit.course.type,
            courseEdit.course._id,
            sanitize(course, updateCourseArgsSchema(courseEdit.course.type))
        )
        setCourseEdit(null)
        await loadCourse()
    })

    const [phaseEdit, setPhaseEdit] = useState(null as any | null)
    const editPhase = wrapNetworkRequest(async (phase: any) => {
        await phaseControllerUpdatePhaseData(
            connection,
            phaseEdit.courseType,
            phaseEdit.phase.type,
            phaseEdit.phase._id,
            sanitize(phase, updatePhaseArgsSchema(phaseEdit.courseType, phaseEdit.phase.type))
        )
        setPhaseEdit(null)
        await loadCourse()
    })

    const [taskEdit, setTaskEdit] = useState(null as any | null)
    const editTask = wrapNetworkRequest(async (task: any) => {
        await taskControllerUpdateTaskData(
            connection,
            taskEdit.courseType,
            taskEdit.phaseType,
            taskEdit.task.type,
            taskEdit.task._id,
            sanitize(task, updateTaskArgsSchema(taskEdit.courseType, taskEdit.phaseType, taskEdit.task.type))
        )
        setTaskEdit(null)
        await loadCourse()
    })

    const [actionDialog, setActionDialog] = useState(null as any | null)

    return (
        <>
            {courseTree && (
                <TreeTable
                    value={courseTree}
                    header={
                        <div className="flex justify-content-start align-items-center gap-2">
                            <Button
                                size="small"
                                outlined
                                severity="info"
                                icon="pi pi-refresh"
                                label="Reload"
                                onClick={loadCourse}
                            />
                        </div>
                    }
                    pt={{
                        header: {
                            className: classNames('p-2')
                        }
                    }}
                >
                    <Column field="type" header="Item" expander />
                    <Column field="kind" header="Kind" />
                    <Column
                        className="p-align-right"
                        body={(node) => (
                            <>
                                <Button
                                    size="small"
                                    severity="success"
                                    outlined
                                    icon="pi pi-play"
                                    className="mr-2"
                                    onClick={() => {
                                        if (node.data.phase && node.data.task) {
                                            setActionDialog({
                                                targetId: node.data.task._id,
                                                courseType: node.data.course.type,
                                                phaseType: node.data.phase.type,
                                                taskType: node.data.task.type
                                            })
                                        } else if (node.data.phase) {
                                            setActionDialog({
                                                targetId: node.data.phase._id,
                                                courseType: node.data.course.type,
                                                phaseType: node.data.phase.type
                                            })
                                        } else {
                                            setActionDialog({
                                                targetId: node.data.course._id,
                                                courseType: node.data.course.type
                                            })
                                        }
                                    }}
                                />
                                <Button
                                    size="small"
                                    severity="secondary"
                                    outlined
                                    icon="pi pi-history"
                                    className="mr-2"
                                    onClick={() => {
                                        if (node.data.phase && node.data.task) {
                                            setHistoryDialog(node.data.task.history)
                                        } else if (node.data.phase) {
                                            setHistoryDialog(node.data.phase.history)
                                        } else {
                                            setHistoryDialog(node.data.course.history)
                                        }
                                    }}
                                />
                                <Button
                                    size="small"
                                    severity="info"
                                    icon="pi pi-pencil"
                                    className="mr-2"
                                    onClick={() => {
                                        if (node.data.phase && node.data.task) {
                                            setTaskEdit({
                                                courseType: node.data.course.type,
                                                phaseType: node.data.phase.type,
                                                task: node.data.task
                                            })
                                        } else if (node.data.phase) {
                                            setPhaseEdit({ courseType: node.data.course.type, phase: node.data.phase })
                                        } else {
                                            setCourseEdit({ course: node.data.course })
                                        }
                                    }}
                                />
                            </>
                        )}
                    />
                </TreeTable>
            )}
            <HistoryDialog
                show={historyDialog !== null}
                onHide={() => setHistoryDialog(null)}
                advancedMode
                history={historyDialog}
                course={course}
                connection={connection}
            />
            {courseEdit && (
                <SmartEditDialog
                    data={courseEdit.course}
                    schema={updateCourseArgsSchema(courseEdit.course.type)}
                    show={true}
                    header={'Edit course'}
                    onHide={() => setCourseEdit(null)}
                    onSave={(course) => editCourse(course)}
                />
            )}
            {phaseEdit && (
                <SmartEditDialog
                    data={phaseEdit.phase}
                    schema={updatePhaseArgsSchema(phaseEdit.courseType, phaseEdit.phase.type)}
                    show={true}
                    header={'Edit phase'}
                    onHide={() => setPhaseEdit(null)}
                    onSave={(phase) => editPhase(phase)}
                />
            )}
            {taskEdit && (
                <SmartEditDialog
                    data={taskEdit.task}
                    schema={updateTaskArgsSchema(taskEdit.courseType, taskEdit.phaseType, taskEdit.task.type)}
                    show={true}
                    header={'Edit task'}
                    onHide={() => setTaskEdit(null)}
                    onSave={(task) => editTask(task)}
                />
            )}
            {actionDialog && (
                <ActionDialog
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    targetId={actionDialog.targetId}
                    show={true}
                    onRun={() => loadCourse()}
                    onHide={() => setActionDialog(null)}
                    courseType={actionDialog.courseType}
                    phaseType={actionDialog.phaseType}
                    taskType={actionDialog.taskType}
                    instance={false}
                />
            )}
        </>
    )
}

export default ConfigTab
