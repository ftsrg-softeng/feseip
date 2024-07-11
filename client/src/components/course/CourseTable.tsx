// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseContentProps, CourseDTO, CourseInstanceDTO } from '@/components/course/Course'
import { PhaseDTO } from '@/components/phase/Phase'
import { TaskDTO } from '@/components/task/Task'
import { UserDTO } from '@/api/Api'
import { ReactNode, Suspense, useEffect, useMemo, useState } from 'react'
import CourseDialog from '@/components/course/CourseDialog'
import { getId } from '@/utils/get-id'
import { courseInstanceControllerGetCourseInstanceDataForCourse } from '@/api/ApiCalls'

export type CourseTableContentProps<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO
> = Omit<CourseContentProps<C, CI>, 'user' | 'courseInstance' | 'setCourseStatus' | 'onRefresh'> & {
    users: UserDTO[]
    course: { phases: (PhaseDTO & { tasks: TaskDTO[] })[] }
    courseInstances: CI[]
    onRefresh: () => void
    onCourseInstanceSelected: (courseInstance: CI) => void
}

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        CourseTableContentStore: { [type: string]: ((props: CourseTableContentProps) => ReactNode) | undefined }
    }
}
window.CourseTableContentStore = window.CourseTableContentStore || {}

export function registerCourseTableContent<
    C extends CourseDTO = CourseDTO,
    CI extends CourseInstanceDTO = CourseInstanceDTO
>(type: string, content: (props: CourseTableContentProps<C, CI>) => ReactNode) {
    window.CourseTableContentStore[type] = content as any
}

type CourseTableProps = Omit<CourseTableContentProps, 'onCourseInstanceSelected' | 'onRefresh' | 'courseInstances'>

function CourseTable(props: CourseTableProps): ReactNode {
    const { users, course, connection, wrapNetworkRequest, toast } = props

    const [courseInstances, setCourseInstances] = useState([] as CourseInstanceDTO[])

    const loadCourseInstances = wrapNetworkRequest(async () => {
        const courseInstances = await courseInstanceControllerGetCourseInstanceDataForCourse(
            connection,
            course.type,
            course._id
        )
        setCourseInstances(courseInstances)
    })

    useEffect(() => {
        loadCourseInstances().then()
    }, [connection, course])

    const [selectedCourseInstanceId, setSelectedCourseInstanceId] = useState(null as string | null)
    const selectedCourseInstance = useMemo(
        () =>
            selectedCourseInstanceId ? courseInstances.find((c) => c._id === selectedCourseInstanceId) ?? null : null,
        [courseInstances, selectedCourseInstanceId]
    )
    const user = useMemo(
        () =>
            selectedCourseInstanceId && selectedCourseInstance
                ? users.find((u) => u._id === getId(selectedCourseInstance.user)) ?? null
                : null,
        [users, courseInstances, selectedCourseInstance]
    )

    const CourseTableContent = window.CourseTableContentStore[course.type]
    return (
        <>
            {CourseTableContent && (
                <Suspense>
                    <CourseTableContent
                        {...props}
                        courseInstances={courseInstances}
                        onRefresh={() => loadCourseInstances()}
                        onCourseInstanceSelected={(courseInstance) => setSelectedCourseInstanceId(courseInstance._id)}
                    />
                </Suspense>
            )}
            {selectedCourseInstance && user && (
                <CourseDialog
                    user={user}
                    course={course}
                    courseInstance={selectedCourseInstance}
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    toast={toast}
                    onRefresh={() => loadCourseInstances()}
                    onHide={() => setSelectedCourseInstanceId(null)}
                />
            )}
        </>
    )
}

export default CourseTable
