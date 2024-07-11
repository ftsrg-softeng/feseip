// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Api, UserDTO } from '@/api/Api'
import { ToastMessage } from 'primereact/toast'
import React, { useEffect, useState } from 'react'
import { courseControllerGetCourseData, userControllerGetUsers } from '@/api/ApiCalls'
import { CourseDTO } from '@/components/course/Course'
import { PhaseDTO } from '@/components/phase/Phase'
import { TaskDTO } from '@/components/task/Task'
import { TabPanel, TabView } from 'primereact/tabview'
import CourseTable from '@/components/course/CourseTable'
import PhaseTable from '@/components/phase/PhaseTable'
import TaskTable from '@/components/task/TaskTable'

import '@/softengExtra'

type Props = {
    courseId: string
    courseType: string
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

function TeacherTab({ courseId, courseType, wrapNetworkRequest, connection, toast }: Props) {
    const [course, setCourse] = useState(null as (CourseDTO & { phases: (PhaseDTO & { tasks: TaskDTO[] })[] }) | null)
    const [users, setUsers] = useState([] as UserDTO[])

    const loadCourseInstances = wrapNetworkRequest(async () => {
        const [course, users] = await Promise.all([
            courseControllerGetCourseData(connection, courseType, courseId),
            userControllerGetUsers(connection)
        ])
        setCourse(course)
        setUsers(users)
    })

    useEffect(() => {
        loadCourseInstances().then()
    }, [])

    if (users.length === 0 || !course) return <></>
    return (
        <TabView scrollable>
            <TabPanel header={course.type} leftIcon="pi pi-home mr-2">
                <CourseTable
                    course={course}
                    connection={connection}
                    wrapNetworkRequest={wrapNetworkRequest}
                    toast={toast}
                    users={users}
                />
            </TabPanel>
            {course.phases.flatMap((phase) => [
                <TabPanel key={phase.type} header={phase.type} leftIcon="pi pi-angle-right mr-2">
                    <PhaseTable
                        course={course}
                        phase={phase}
                        connection={connection}
                        wrapNetworkRequest={wrapNetworkRequest}
                        toast={toast}
                        users={users}
                    />
                </TabPanel>,
                ...phase.tasks.map((task) => (
                    <TabPanel
                        key={`${phase.type}.${task.type}`}
                        header={task.type}
                        leftIcon="pi pi-angle-double-right mr-2"
                    >
                        <TaskTable
                            course={course}
                            phase={phase}
                            task={task}
                            connection={connection}
                            wrapNetworkRequest={wrapNetworkRequest}
                            toast={toast}
                            users={users}
                        />
                    </TabPanel>
                ))
            ])}
        </TabView>
    )
}

export default TeacherTab
