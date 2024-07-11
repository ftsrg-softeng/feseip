// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React, { useContext, useEffect, useState } from 'react'
import SmartDataTable from '../../components/data-table/SmartDataTable'
import { Button } from 'primereact/button'
import { ToastMessage } from 'primereact/toast'
import SmartEditDialog from '../../components/edit-dialog/SmartEditDialog'
import { Api, CourseDTO, UpdateUserArgs, UserDTO } from '@/api/Api'
import SwaggerSchema from '../../api/SwaggerSchema'
import { getId } from '@/utils/get-id'
import { sanitize } from '@/utils/sanitize'
import AppContext from '@/AppContext'
import { classNames } from 'primereact/utils'

type Props = {
    connection: Api<unknown>
    wrapNetworkRequest: <T extends (...args: any) => Promise<void>>(networkRequest: T) => T
    toast: (toast: ToastMessage) => void
}

const UserPanel: React.FC<Props> = ({ connection, wrapNetworkRequest }) => {
    const appContext = useContext(AppContext)

    const [users, setUsers] = useState([] as UserDTO[])
    const [courses, setCourses] = useState([] as CourseDTO[])

    const loadUsers = wrapNetworkRequest(async () => {
        const [users, courses] = await Promise.all([
            connection.api.userAdminControllerGetUsers(),
            connection.api.courseAdminControllerGetCourses()
        ])
        setUsers(users)
        setCourses(courses)
    })

    const editUser = wrapNetworkRequest(async (id: string, user: UpdateUserArgs) => {
        await connection.api.userAdminControllerUpdateUser(
            id,
            sanitize(user, SwaggerSchema.components.schemas.UpdateUserArgs)
        )
        resetEditDialog()
        await loadUsers()
    })

    const deleteUser = wrapNetworkRequest(async (user: UserDTO) => {
        await connection.api.userAdminControllerDeleteUser(user._id)
        await loadUsers()
    })

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editDialogId, setEditDialogId] = useState(undefined as string | undefined)
    const [editDialogState, setEditDialogState] = useState(undefined as UpdateUserArgs | undefined)

    function resetEditDialog() {
        setShowEditDialog(false)
        setEditDialogId(undefined)
        setEditDialogState(undefined)
    }

    useEffect(() => {
        loadUsers().then()
    }, [])

    return (
        <>
            <SmartDataTable
                values={users}
                columns={[
                    { field: '_id' },
                    { field: 'moodleId', dataType: 'numeric' },
                    'familyName',
                    'givenName',
                    { field: 'isAdmin', dataType: 'boolean' },
                    'roles'
                ]}
                idColumn="_id"
                columnTemplates={{
                    roles: (roles) =>
                        roles.map((role, index) => (
                            <span key={index}>
                                {courses.find((c) => c._id === getId(role.course))?.name ?? getId(role.course)}:{' '}
                                {role.role}
                                <br />
                            </span>
                        ))
                }}
                tableToolbar={() => (
                    <div className="flex gap-2">
                        <Button
                            size="small"
                            outlined
                            severity="info"
                            icon="pi pi-refresh"
                            label="Reload"
                            onClick={loadUsers}
                        />
                    </div>
                )}
                rowToolbar={(user) => (
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
                                        setShowEditDialog(true)
                                        setEditDialogId(user._id)
                                        setEditDialogState({
                                            ...user,
                                            roles: user.roles.map((role) => ({
                                                ...role,
                                                course: getId(role.course)
                                            }))
                                        })
                                    }}
                                />
                                <Button
                                    size="small"
                                    severity="danger"
                                    icon="pi pi-times"
                                    pt={{ root: { className: classNames('p-1') } }}
                                    onClick={() => deleteUser(user)}
                                />
                            </>
                        )}
                    </>
                )}
            />
            {editDialogState && (
                <SmartEditDialog
                    header="Edit user"
                    data={editDialogState}
                    schema={SwaggerSchema.components.schemas.UpdateUserArgs}
                    show={showEditDialog}
                    onHide={resetEditDialog}
                    onSave={(user) => {
                        editUser(editDialogId!, user).then()
                    }}
                />
            )}
        </>
    )
}

export default UserPanel
