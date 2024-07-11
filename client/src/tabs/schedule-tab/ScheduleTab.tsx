// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Api } from '@/api/Api'
import { ToastMessage } from 'primereact/toast'
import React, { useEffect, useState } from 'react'
import {
    courseScheduleControllerAddSchedule,
    courseScheduleControllerDeleteSchedule,
    courseScheduleControllerGetSchedules,
    courseScheduleControllerUpdateSchedule
} from '@/api/ApiCalls'
import SmartDataTable from '@/components/data-table/SmartDataTable'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'
import ScheduleDialog from '@/components/ScheduleDialog'

type Props = {
    courseId: string
    courseType: string
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const ScheduleTab: React.FC<Props> = ({ courseId, courseType, connection, wrapNetworkRequest }) => {
    const [schedules, setSchedules] = useState([] as any[])

    const loadSchedules = wrapNetworkRequest(async () => {
        const schedules = await courseScheduleControllerGetSchedules(connection, courseType, courseId)
        setSchedules(schedules)
    })

    const addSchedule = wrapNetworkRequest(async (schedule: any) => {
        await courseScheduleControllerAddSchedule(connection, courseType, courseId, schedule)
        setShowEditDialog(false)
        setSelectedSchedule(null)
        await loadSchedules()
    })

    const editSchedule = wrapNetworkRequest(async (scheduleId: string, schedule: any) => {
        await courseScheduleControllerUpdateSchedule(connection, courseType, courseId, scheduleId, schedule)
        setShowEditDialog(false)
        setSelectedSchedule(null)
        await loadSchedules()
    })

    const deleteSchedule = wrapNetworkRequest(async (scheduleId: string) => {
        await courseScheduleControllerDeleteSchedule(connection, courseType, courseId, scheduleId)
        await loadSchedules()
    })

    useEffect(() => {
        loadSchedules().then()
    }, [])

    const [selectedSchedule, setSelectedSchedule] = useState(null as null | any)
    const [showEditDialog, setShowEditDialog] = useState(false)

    return (
        <>
            <SmartDataTable
                values={schedules}
                columns={['name', 'cron', 'courseInstanceFilter', 'running']}
                idColumn={'_id'}
                tableToolbar={() => (
                    <div className="flex gap-2">
                        <Button
                            size="small"
                            outlined
                            severity="info"
                            icon="pi pi-refresh"
                            label="Reload"
                            onClick={loadSchedules}
                        />
                        <Button
                            size="small"
                            severity="success"
                            icon="pi pi-plus"
                            label="Add"
                            onClick={() => setShowEditDialog(true)}
                        />
                    </div>
                )}
                rowToolbar={(schedule) => (
                    <>
                        <Button
                            size="small"
                            severity="info"
                            outlined
                            icon="pi pi-pencil"
                            className="mr-2"
                            pt={{ root: { className: classNames('p-1') } }}
                            onClick={() => {
                                setSelectedSchedule(schedule)
                                setShowEditDialog(true)
                            }}
                        />
                        <Button
                            size="small"
                            severity="danger"
                            outlined
                            icon="pi pi-times"
                            className="mr-2"
                            pt={{ root: { className: classNames('p-1') } }}
                            onClick={() => deleteSchedule(schedule._id)}
                        />
                    </>
                )}
                rowToolbarPosition="last"
                onRowSelected={(schedule) => setSelectedSchedule(schedule)}
            />
            <ScheduleDialog
                show={showEditDialog}
                courseType={courseType}
                schedule={selectedSchedule}
                onSave={(schedule) => {
                    if (selectedSchedule) {
                        editSchedule(selectedSchedule._id, schedule).finally()
                    } else {
                        addSchedule(schedule).finally()
                    }
                }}
                onHide={() => {
                    setShowEditDialog(false)
                    setSelectedSchedule(null)
                }}
            />
        </>
    )
}

export default ScheduleTab
