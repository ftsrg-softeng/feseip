// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Api, UserDTO } from '@/api/Api'
import { ToastMessage } from 'primereact/toast'
import React, { useEffect, useState } from 'react'
import { courseControllerGetCourseData, courseInstanceControllerGetCourseInstanceData } from '@/api/ApiCalls'
import Course, { CourseDTO, CourseInstanceDTO } from '@/components/course/Course'
import { PhaseDTO, PhaseInstanceDTO } from '@/components/phase/Phase'
import { TaskDTO, TaskInstanceDTO } from '@/components/task/Task'

import '@/softengExtra'

type Props = {
    courseId: string
    courseInstanceId: string
    courseType: string
    user: UserDTO
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

function StudentTab({ courseId, courseInstanceId, courseType, user, wrapNetworkRequest, connection, toast }: Props) {
    const [course, setCourse] = useState(null as (CourseDTO & { phases: (PhaseDTO & { tasks: TaskDTO[] })[] }) | null)
    const [courseInstance, setCourseInstance] = useState(
        null as
            | (CourseInstanceDTO & { phaseInstances: (PhaseInstanceDTO & { taskInstances: TaskInstanceDTO[] })[] })
            | null
    )

    const loadCourseInstance = wrapNetworkRequest(async () => {
        const [course, courseInstance] = await Promise.all([
            courseControllerGetCourseData(connection, courseType, courseId),
            courseInstanceControllerGetCourseInstanceData(connection, courseType, courseInstanceId)
        ])
        setCourse(course)
        setCourseInstance(courseInstance)
    })

    useEffect(() => {
        loadCourseInstance().then()
    }, [])

    if (!courseInstance || !course) return <></>
    return (
        <Course
            user={user}
            course={course}
            courseInstance={courseInstance}
            connection={connection}
            wrapNetworkRequest={wrapNetworkRequest}
            toast={toast}
            onRefresh={() => loadCourseInstance()}
        />
    )
}

export default StudentTab
