// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { TaskContentProps, TaskDTO, TaskInstanceDTO } from '@/components/task/Task'
import { UserDTO } from '@/api/Api'
import { ReactNode, Suspense, useEffect, useMemo, useState } from 'react'
import TaskDialog from '@/components/task/TaskDialog'
import { CourseDTO, CourseInstanceDTO } from '@/components/course/Course'
import { PhaseDTO, PhaseInstanceDTO } from '@/components/phase/Phase'
import {
    courseInstanceControllerGetCourseInstanceDataForCourse,
    phaseInstanceControllerGetPhaseInstanceDataForPhase,
    taskInstanceControllerGetTaskInstanceDataForTask
} from '@/api/ApiCalls'
import { getId } from '@/utils/get-id'

export enum TaskTableMode {
    PerCourseInstance,
    PerPhaseInstance,
    PerTaskInstance
}

export type TaskTableContentProps<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO,
    T extends TaskDTO = TaskDTO,
    TI extends TaskInstanceDTO = TaskInstanceDTO
> = Omit<
    TaskContentProps<C, CI, P, PI, T, TI>,
    | 'user'
    | 'courseInstances'
    | 'phaseInstances'
    | 'taskInstance'
    | 'setTaskTitle'
    | 'setTaskDeadline'
    | 'setTaskStatus'
> & {
    users: UserDTO[]
    course: { phases: (PhaseDTO & { tasks: TaskDTO[] })[] }
    courseInstances: CI[]
    phase: { tasks: TaskDTO[] }
    phaseInstances: PI[]
    task: T
    taskInstances: TI[]
    onRefresh: () => void
    onTaskInstanceSelected: (taskInstance: { selected: TaskInstanceDTO; header: ReactNode }) => void
    setTaskTableMode: (mode: TaskTableMode) => void
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        TaskTableContentStore: { [type: string]: ((props: TaskTableContentProps) => ReactNode) | undefined }
    }
}
window.TaskTableContentStore = window.TaskTableContentStore || {}

export function registerTaskTableContent<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO,
    T extends TaskDTO = TaskDTO,
    TI extends TaskInstanceDTO = TaskInstanceDTO
>(type: string, content: (props: TaskTableContentProps<C, CI, P, PI, T, TI>) => ReactNode) {
    window.TaskTableContentStore[type] = content as any
}

type TaskTableProps = Omit<
    TaskTableContentProps,
    'onTaskInstanceSelected' | 'setTaskTableMode' | 'onRefresh' | 'courseInstances' | 'phaseInstances' | 'taskInstances'
>

function TaskTable(props: TaskTableProps): ReactNode {
    const { course, phase, task, connection, wrapNetworkRequest, toast } = props

    const [courseInstances, setCourseInstances] = useState([] as CourseInstanceDTO[])
    const [phaseInstances, setPhaseInstances] = useState([] as PhaseInstanceDTO[])
    const [taskInstances, setTaskInstances] = useState([] as TaskInstanceDTO[])

    const loadTaskInstances = wrapNetworkRequest(async () => {
        const [courseInstances, phaseInstances, taskInstances] = await Promise.all([
            courseInstanceControllerGetCourseInstanceDataForCourse(connection, course.type, course._id),
            phaseInstanceControllerGetPhaseInstanceDataForPhase(connection, course.type, phase.type, phase._id),
            taskInstanceControllerGetTaskInstanceDataForTask(connection, course.type, phase.type, task.type, task._id)
        ])
        setCourseInstances(courseInstances)
        setPhaseInstances(phaseInstances)
        setTaskInstances(taskInstances)
    })

    useEffect(() => {
        loadTaskInstances().then()
    }, [connection, course, phase, task])

    const [mode, setMode] = useState(TaskTableMode.PerCourseInstance)
    const [selectedTaskInstanceId, setSelectedTaskInstanceId] = useState(
        null as { selectedId: string; header: ReactNode } | null
    )

    const taskInstancesGroupedByMode = useMemo(() => {
        switch (mode) {
            case TaskTableMode.PerCourseInstance:
                return courseInstances
                    .map((c) => phaseInstances.find((p) => p.courseInstances.some((ci) => getId(ci) === c._id)))
                    .filter((p): p is PhaseInstanceDTO => p !== undefined)
                    .map((p) => taskInstances.find((t) => t.phaseInstances.some((pi) => getId(pi) === p._id)))
                    .filter((t): t is TaskInstanceDTO => t !== undefined)
            case TaskTableMode.PerPhaseInstance:
                return phaseInstances
                    .map((p) => taskInstances.find((t) => t.phaseInstances.some((pi) => getId(pi) === p._id)))
                    .filter((t): t is TaskInstanceDTO => t !== undefined)
            case TaskTableMode.PerTaskInstance:
                return taskInstances
        }
    }, [courseInstances, phaseInstances, taskInstances, mode])

    const selectedTaskInstance = useMemo(() => {
        return selectedTaskInstanceId
            ? taskInstancesGroupedByMode.find((c) => c._id === selectedTaskInstanceId.selectedId) ?? null
            : null
    }, [taskInstancesGroupedByMode, selectedTaskInstanceId])

    const selectedPhaseInstances = useMemo(() => {
        if (selectedTaskInstance) {
            return selectedTaskInstance.phaseInstances
                .map((pi) => phaseInstances.find((p) => p._id === getId(pi)))
                .filter((p): p is PhaseInstanceDTO => p !== undefined)
        }
        return null
    }, [phaseInstances, selectedTaskInstance])

    const selectedCourseInstances = useMemo(() => {
        if (selectedPhaseInstances) {
            return selectedPhaseInstances.flatMap((pi) =>
                pi.courseInstances
                    .map((ci) => courseInstances.find((c) => c._id === getId(ci)))
                    .filter((c): c is CourseInstanceDTO => c !== undefined)
            )
        }
        return null
    }, [courseInstances, selectedPhaseInstances])

    const TaskTableContent = window.TaskTableContentStore[task.type]
    return (
        <>
            {TaskTableContent && (
                <Suspense>
                    <TaskTableContent
                        {...props}
                        courseInstances={courseInstances}
                        phaseInstances={phaseInstances}
                        taskInstances={taskInstancesGroupedByMode}
                        onRefresh={() => loadTaskInstances()}
                        onTaskInstanceSelected={(taskInstance) =>
                            setSelectedTaskInstanceId({
                                selectedId: taskInstance.selected._id,
                                header: taskInstance.header
                            })
                        }
                        setTaskTableMode={setMode}
                    />
                </Suspense>
            )}
            {selectedTaskInstance && selectedTaskInstanceId && selectedPhaseInstances && selectedCourseInstances && (
                <TaskDialog
                    course={course}
                    courseInstances={selectedCourseInstances}
                    phase={phase}
                    phaseInstances={selectedPhaseInstances}
                    task={task}
                    taskInstance={selectedTaskInstance}
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    toast={toast}
                    onHide={() => setSelectedTaskInstanceId(null)}
                    onRefresh={() => loadTaskInstances()}
                    header={selectedTaskInstanceId.header}
                />
            )}
        </>
    )
}

export default TaskTable
