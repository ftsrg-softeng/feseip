// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ToastMessage } from 'primereact/toast'
import React, { useContext, useEffect, useState } from 'react'
import SmartDataTable from '../../components/data-table/SmartDataTable'
import { Button } from 'primereact/button'
import SmartEditDialog from '../../components/edit-dialog/SmartEditDialog'
import { Api, CourseDTO, UpdateCourseArgs } from '@/api/Api'
import SwaggerSchema from '../../api/SwaggerSchema'
import { classNames } from 'primereact/utils'
import AppContext from '@/AppContext'

type Props = {
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const CoursesPanel: React.FC<Props> = ({ connection, wrapNetworkRequest }) => {
    const appContext = useContext(AppContext)

    const [courses, setCourses] = useState([] as CourseDTO[])

    const loadCourses = wrapNetworkRequest(async () => {
        const courses = await connection.api.courseAdminControllerGetCourses()
        setCourses(courses)
    })

    const addCourse = wrapNetworkRequest(async (name: string, type: any, apiKey: string) => {
        await connection.api.courseAdminControllerCreateCourse({ name, type, apiKey })
        resetEditDialog()
        await loadCourses()
    })

    const editCourse = wrapNetworkRequest(async (id: string, name: string, apiKey: string, blocked: boolean) => {
        await connection.api.courseAdminControllerUpdateCourse(id, { name, apiKey, blocked })
        resetEditDialog()
        await loadCourses()
    })

    const deleteCourse = wrapNetworkRequest(async (id: string) => {
        await connection.api.courseAdminControllerDeleteCourse(id)
        await loadCourses()
    })

    const [showEditDialog, setShowEditDialog] = useState<'no' | 'add' | 'edit'>('no')
    const [editDialogId, setEditDialogId] = useState(undefined as string | undefined)
    const [editDialogState, setEditDialogState] = useState(undefined as UpdateCourseArgs | undefined)

    function resetEditDialog() {
        setShowEditDialog('no')
        setEditDialogId(undefined)
        setEditDialogState(undefined)
    }

    useEffect(() => {
        loadCourses().then()
    }, [])

    return (
        <>
            <SmartDataTable
                values={courses}
                columns={['_id', 'name', 'type', 'apiKey', { field: 'blocked', dataType: 'boolean' }]}
                idColumn="_id"
                tableToolbar={() => (
                    <div className="flex gap-2">
                        <Button
                            size="small"
                            outlined
                            severity="info"
                            icon="pi pi-refresh"
                            label="Reload"
                            onClick={loadCourses}
                        />
                        <Button
                            size="small"
                            severity="success"
                            icon="pi pi-plus"
                            label="Add"
                            onClick={() => setShowEditDialog('add')}
                        />
                    </div>
                )}
                rowToolbar={(course) => (
                    <>
                        {appContext.dangerMode && (
                            <>
                                <Button
                                    size="small"
                                    severity="info"
                                    icon="pi pi-pencil"
                                    className="mr-2"
                                    pt={{ root: { className: classNames('p-1') } }}
                                    onClick={() => {
                                        setShowEditDialog('edit')
                                        setEditDialogId(course._id)
                                        setEditDialogState(course)
                                    }}
                                />
                                <Button
                                    size="small"
                                    severity="danger"
                                    icon="pi pi-times"
                                    pt={{ root: { className: classNames('p-1') } }}
                                    onClick={() => deleteCourse(course._id)}
                                />
                            </>
                        )}
                    </>
                )}
            />
            <SmartEditDialog
                schema={SwaggerSchema.components.schemas.CreateCourseArgs}
                show={showEditDialog === 'add'}
                header="Add course"
                onHide={resetEditDialog}
                onSave={(course) => {
                    addCourse(course.name, course.type, course.apiKey).then()
                }}
            />
            {editDialogState && (
                <SmartEditDialog
                    data={editDialogState}
                    schema={SwaggerSchema.components.schemas.UpdateCourseArgs}
                    show={showEditDialog === 'edit'}
                    header="Edit course"
                    onHide={resetEditDialog}
                    onSave={(course) => {
                        editCourse(editDialogId!, course.name, course.apiKey, course.blocked).then()
                    }}
                />
            )}
        </>
    )
}

export default CoursesPanel
