// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import Course, { CourseInstanceDTO, CourseProps } from './Course'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import React, { useEffect, useState } from 'react'
import { PhaseInstanceDTO } from '@/components/phase/Phase'
import { TaskInstanceDTO } from '@/components/task/Task'
import { courseInstanceControllerGetCourseInstanceData } from '@/api/ApiCalls'

type CourseDialogProps = Omit<CourseProps, 'courseInstance'> & {
    courseInstance: CourseInstanceDTO
    onHide: () => void
    onRefresh: () => void
}

function CourseDialog(props: CourseDialogProps) {
    const { courseInstance, onHide, wrapNetworkRequest, connection, course } = props

    const [courseInstanceWithPhaseAndTaskInstances, setCourseInstanceWithPhaseAndTaskInstances] = useState(
        null as
            | (CourseInstanceDTO & { phaseInstances: (PhaseInstanceDTO & { taskInstances: TaskInstanceDTO[] })[] })
            | null
    )

    const loadCourseInstance = wrapNetworkRequest(async () => {
        const courseInstanceWithPhaseAndTaskInstances = await courseInstanceControllerGetCourseInstanceData(
            connection,
            course.type,
            courseInstance._id
        )
        setCourseInstanceWithPhaseAndTaskInstances(courseInstanceWithPhaseAndTaskInstances)
    })

    useEffect(() => {
        loadCourseInstance().then()
    }, [connection, course, courseInstance])

    return (
        <>
            {courseInstanceWithPhaseAndTaskInstances && (
                <Dialog
                    visible={true}
                    dismissableMask={true}
                    onHide={onHide}
                    className="max-w-screen p-2 max-h-screen overflow-y-auto"
                    style={{ width: '1200px' }}
                    content={({ hide }) => (
                        <Course
                            {...props}
                            courseInstance={courseInstanceWithPhaseAndTaskInstances}
                            headerSuffix={
                                <>
                                    <Button
                                        text
                                        severity="secondary"
                                        className="p-panel-header-icon"
                                        icon="pi pi-times"
                                        onClick={hide}
                                    />
                                </>
                            }
                        />
                    )}
                />
            )}
        </>
    )
}

export default CourseDialog
