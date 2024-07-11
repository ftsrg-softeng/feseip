// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { PhaseContentProps, PhaseDTO, PhaseInstanceDTO } from '@/components/phase/Phase'
import { TaskDTO } from '@/components/task/Task'
import { UserDTO } from '@/api/Api'
import { ReactNode, Suspense, useEffect, useMemo, useState } from 'react'
import PhaseDialog from '@/components/phase/PhaseDialog'
import { CourseDTO, CourseInstanceDTO } from '@/components/course/Course'
import {
    courseInstanceControllerGetCourseInstanceDataForCourse,
    phaseInstanceControllerGetPhaseInstanceDataForPhase
} from '@/api/ApiCalls'
import { getId } from '@/utils/get-id'

export enum PhaseTableMode {
    PerCourseInstance,
    PerPhaseInstance
}

export type PhaseTableContentProps<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO
> = Omit<
    PhaseContentProps<C, CI, P, PI>,
    'user' | 'courseInstances' | 'phaseInstance' | 'setPhaseTitle' | 'setPhaseDeadline' | 'setPhaseStatus'
> & {
    users: UserDTO[]
    course: { phases: (PhaseDTO & { tasks: TaskDTO[] })[] }
    courseInstances: CI[]
    phase: { tasks: TaskDTO[] }
    phaseInstances: PI[]
    onRefresh: () => void
    onPhaseInstanceSelected: (phaseInstance: { selected: PhaseInstanceDTO; header: ReactNode }) => void
    setPhaseTableMode: (mode: PhaseTableMode) => void
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        PhaseTableContentStore: { [type: string]: ((props: PhaseTableContentProps) => ReactNode) | undefined }
    }
}
window.PhaseTableContentStore = window.PhaseTableContentStore || {}

export function registerPhaseTableContent<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO,
    P extends PhaseDTO = PhaseDTO,
    PI extends PhaseInstanceDTO = PhaseInstanceDTO
>(type: string, content: (props: PhaseTableContentProps<C, CI, P, PI>) => ReactNode) {
    window.PhaseTableContentStore[type] = content as any
}

type PhaseTableProps = Omit<
    PhaseTableContentProps,
    'onPhaseInstanceSelected' | 'setPhaseTableMode' | 'onRefresh' | 'courseInstances' | 'phaseInstances'
>

function PhaseTable(props: PhaseTableProps): ReactNode {
    const { course, phase, connection, wrapNetworkRequest, toast } = props

    const [courseInstances, setCourseInstances] = useState([] as CourseInstanceDTO[])
    const [phaseInstances, setPhaseInstances] = useState([] as PhaseInstanceDTO[])

    const loadPhaseInstances = wrapNetworkRequest(async () => {
        const [courseInstances, phaseInstances] = await Promise.all([
            courseInstanceControllerGetCourseInstanceDataForCourse(connection, course.type, course._id),
            phaseInstanceControllerGetPhaseInstanceDataForPhase(connection, course.type, phase.type, phase._id)
        ])
        setCourseInstances(courseInstances)
        setPhaseInstances(phaseInstances)
    })

    useEffect(() => {
        loadPhaseInstances().then()
    }, [connection, course, phase])

    const [mode, setMode] = useState(PhaseTableMode.PerCourseInstance)
    const [selectedPhaseInstanceId, setSelectedPhaseInstanceId] = useState(
        null as { selectedId: string; header: ReactNode } | null
    )

    const phaseInstancesGroupedByMode = useMemo(() => {
        switch (mode) {
            case PhaseTableMode.PerCourseInstance:
                return courseInstances
                    .map((c) => phaseInstances.find((p) => p.courseInstances.some((ci) => getId(ci) === c._id)))
                    .filter((p): p is PhaseInstanceDTO => p !== undefined)
            case PhaseTableMode.PerPhaseInstance:
                return phaseInstances
        }
    }, [courseInstances, phaseInstances, mode])

    const selectedPhaseInstance = useMemo(() => {
        return selectedPhaseInstanceId
            ? phaseInstancesGroupedByMode.find((p) => p._id === selectedPhaseInstanceId.selectedId) ?? null
            : null
    }, [phaseInstancesGroupedByMode, selectedPhaseInstanceId])

    const selectedCourseInstances = useMemo(() => {
        if (selectedPhaseInstance) {
            return selectedPhaseInstance.courseInstances
                .map((ci) => courseInstances.find((c) => c._id === getId(ci)))
                .filter((c): c is CourseInstanceDTO => c !== undefined)
        }
        return null
    }, [courseInstances, selectedPhaseInstance])

    const PhaseTableContent = window.PhaseTableContentStore[phase.type]
    return (
        <>
            {PhaseTableContent && (
                <Suspense>
                    <PhaseTableContent
                        {...props}
                        courseInstances={courseInstances}
                        phaseInstances={phaseInstancesGroupedByMode}
                        onRefresh={() => loadPhaseInstances()}
                        onPhaseInstanceSelected={(phaseInstance) =>
                            setSelectedPhaseInstanceId({
                                selectedId: phaseInstance.selected._id,
                                header: phaseInstance.header
                            })
                        }
                        setPhaseTableMode={setMode}
                    />
                </Suspense>
            )}
            {selectedPhaseInstanceId && selectedPhaseInstance && selectedCourseInstances && (
                <PhaseDialog
                    course={course}
                    courseInstances={selectedCourseInstances}
                    phase={phase}
                    phaseInstance={selectedPhaseInstance}
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    toast={toast}
                    onHide={() => setSelectedPhaseInstanceId(null)}
                    onRefresh={() => loadPhaseInstances()}
                    header={selectedPhaseInstanceId.header}
                />
            )}
        </>
    )
}

export default PhaseTable
