// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseDTO, CourseInstanceDTO } from '@/components/course/Course'
import { UserDTO } from '@/api/Api'
import { getId } from '@/utils/get-id'
import { PhaseDTO, PhaseInstanceDTO } from '@/components/phase/Phase'
import { mergeAndFlatten } from '@/components/TeacherTable'
import React, { ReactNode } from 'react'
import { TaskDTO, TaskInstanceDTO } from '@/components/task/Task'

export const defaultTeacherTableColumns = [
    { field: 'user.moodleId', header: '#' },
    { field: 'user.familyName', header: 'Family name' },
    { field: 'user.givenName', header: 'Given name' },
    { field: 'courseInstance.language', header: 'Lang', dataType: 'enum' }
] as const

export function courseTableContent<C extends CourseDTO, CI extends CourseInstanceDTO>(
    users: UserDTO[],
    course: C,
    courseInstances: CI[]
) {
    return courseInstances.map((courseInstance) =>
        mergeAndFlatten(
            { key: 'user', value: users.find((u) => u._id === getId(courseInstance.user)) },
            { key: 'course', value: course },
            { key: 'courseInstance', value: courseInstance }
        )
    )
}

export function courseTableOnCourseSelected<CI extends CourseInstanceDTO>(
    onCourseInstanceSelected: (courseInstance: CI) => void,
    courseInstances: CI[]
) {
    return (row: { 'courseInstance._id': string }) =>
        onCourseInstanceSelected(courseInstances.find((c) => c._id === row['courseInstance._id'])!)
}

export function phaseTableContent<
    C extends CourseDTO,
    CI extends CourseInstanceDTO,
    P extends PhaseDTO,
    PI extends PhaseInstanceDTO
>(users: UserDTO[], course: C, courseInstances: CI[], phase: P, phaseInstances: PI[]) {
    return phaseInstances.map((phaseInstance) => {
        const courseInstance = courseInstances.find((c) => c._id === getId(phaseInstance.courseInstances[0]))!

        return mergeAndFlatten(
            { key: 'user', value: users.find((u) => u._id === getId(courseInstance.user)) },
            { key: 'course', value: course },
            { key: 'courseInstance', value: courseInstance },
            { key: 'phase', value: phase },
            { key: 'phaseInstance', value: phaseInstance }
        )
    })
}

export function phaseTableOnCourseSelected<PI extends PhaseInstanceDTO>(
    onPhaseInstanceSelected: (phaseInstance: { selected: PI; header: ReactNode }) => void,
    phaseInstances: PI[]
) {
    return (row: { 'phaseInstance._id': string; 'user.givenName': string; 'user.familyName': string }) =>
        onPhaseInstanceSelected({
            selected: phaseInstances.find((p) => p._id === row['phaseInstance._id'])!,
            header: (
                <>
                    <span className="pi pi-user text-2xl mr-2" />
                    <span className="text-lg">
                        {row['user.givenName']} {row['user.familyName']}
                    </span>
                    <span>-</span>
                </>
            )
        })
}

export function taskTableContent<
    C extends CourseDTO,
    CI extends CourseInstanceDTO,
    P extends PhaseDTO,
    PI extends PhaseInstanceDTO,
    T extends TaskDTO,
    TI extends TaskInstanceDTO
>(users: UserDTO[], course: C, courseInstances: CI[], phase: P, phaseInstances: PI[], task: T, taskInstances: TI[]) {
    return taskInstances.map((taskInstance) => {
        const phaseInstance = phaseInstances.find((p) => p._id === getId(taskInstance.phaseInstances[0]))!
        const courseInstance = courseInstances.find((c) => c._id === getId(phaseInstance.courseInstances[0]))!

        return mergeAndFlatten(
            { key: 'user', value: users.find((u) => u._id === getId(courseInstance.user)) },
            { key: 'course', value: course },
            { key: 'courseInstance', value: courseInstance },
            { key: 'phase', value: phase },
            { key: 'phaseInstance', value: phaseInstance },
            { key: 'task', value: task },
            { key: 'taskInstance', value: taskInstance }
        )
    })
}

export function taskTableOnCourseSelected<TI extends TaskInstanceDTO>(
    onTaskInstanceSelected: (taskInstance: { selected: TI; header: ReactNode }) => void,
    taskInstances: TI[]
) {
    return (row: { 'taskInstance._id': string; 'user.givenName': string; 'user.familyName': string }) =>
        onTaskInstanceSelected({
            selected: taskInstances.find((t) => t._id === row['taskInstance._id'])!,
            header: (
                <>
                    <span className="pi pi-user text-2xl mr-2" />
                    <span className="text-lg">
                        {row['user.givenName']} {row['user.familyName']}
                    </span>
                    <span>-</span>
                </>
            )
        })
}
