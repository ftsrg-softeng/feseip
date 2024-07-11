// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Api } from './Api'
import { capitalize } from '@/utils/capitalize'

export function courseControllerGetCourseData(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}CourseControllerGetCourseData`](...args)
}

export function courseControllerUpdateCourseData(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}CourseControllerUpdateCourseData`](...args)
}

export function phaseControllerUpdatePhaseData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}${capitalize(phaseType)}PhaseControllerUpdatePhaseData`](...args)
}

export function taskControllerUpdateTaskData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}TaskControllerUpdateTaskData`
    ](...args)
}

export function courseActionControllerDoAction(
    connection: Api<unknown>,
    courseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}${capitalize(actionType)}CourseActionControllerDoAction`](...args)
}

export function courseActionControllerDoActionInBackground(
    connection: Api<unknown>,
    courseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}${capitalize(actionType)}CourseActionControllerDoActionInBackground`](
        ...args
    )
}

export function courseInstanceActionControllerDoAction(
    connection: Api<unknown>,
    courseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}${capitalize(actionType)}CourseInstanceActionControllerDoAction`](
        ...args
    )
}

export function courseInstanceActionControllerDoActionInBackground(
    connection: Api<unknown>,
    courseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(actionType)}CourseInstanceActionControllerDoActionInBackground`
    ](...args)
}

export function phaseActionControllerDoAction(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(actionType)}PhaseActionControllerDoAction`
    ](...args)
}

export function phaseActionControllerDoActionInBackground(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(actionType)}PhaseActionControllerDoActionInBackground`
    ](...args)
}

export function phaseInstanceActionControllerDoAction(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(actionType)}PhaseInstanceActionControllerDoAction`
    ](...args)
}

export function phaseInstanceActionControllerDoActionInBackground(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(actionType)}PhaseInstanceActionControllerDoActionInBackground`
    ](...args)
}

export function taskActionControllerDoAction(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}${capitalize(actionType)}TaskActionControllerDoAction`
    ](...args)
}

export function taskActionControllerDoActionInBackground(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}${capitalize(actionType)}TaskActionControllerDoActionInBackground`
    ](...args)
}

export function taskInstanceActionControllerDoAction(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}${capitalize(actionType)}TaskInstanceActionControllerDoAction`
    ](...args)
}

export function taskInstanceActionControllerDoActionInBackground(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    actionType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}${capitalize(actionType)}TaskInstanceActionControllerDoActionInBackground`
    ](...args)
}

export function courseLogControllerGetLogs(connection: Api<unknown>, courseType: string, ...args: any[]): Promise<any> {
    return (connection.api as any)[`${courseType}LogControllerGetLogs`](...args)
}

export function courseErrorControllerGetErrors(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ErrorControllerGetErrors`](...args)
}

export function courseErrorControllerDeleteAllErrors(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ErrorControllerDeleteAllErrors`](...args)
}

export function courseErrorControllerDeleteError(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ErrorControllerDeleteError`](...args)
}

export function userControllerGetUsers(connection: Api<unknown>): Promise<any> {
    return connection.api.userControllerGetUsers()
}

export function courseInstanceControllerGetCourseInstanceDataForCourse(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}CourseInstanceControllerGetCourseInstanceDataForCourse`](...args)
}

export function courseInstanceControllerGetCourseInstanceData(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}CourseInstanceControllerGetCourseInstanceData`](...args)
}

export function courseInstanceControllerUpdateCourseInstanceData(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}CourseInstanceControllerUpdateCourseInstanceData`](...args)
}

export function courseInstanceControllerDeleteCourseInstanceData(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}CourseInstanceControllerDeleteCourseInstanceData`](...args)
}

export function phaseInstanceControllerGetPhaseInstanceData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}${capitalize(phaseType)}PhaseInstanceControllerGetPhaseInstanceData`](
        ...args
    )
}

export function phaseInstanceControllerGetPhaseInstanceDataForPhase(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}PhaseInstanceControllerGetPhaseInstanceDataForPhase`
    ](...args)
}

export function phaseInstanceControllerUpdatePhaseInstanceData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}PhaseInstanceControllerUpdatePhaseInstanceData`
    ](...args)
}

export function phaseInstanceControllerDeletePhaseInstanceData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}PhaseInstanceControllerDeletePhaseInstanceData`
    ](...args)
}

export function taskInstanceControllerGetTaskInstanceDataForTask(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}TaskInstanceControllerGetTaskInstanceDataForTask`
    ](...args)
}

export function taskInstanceControllerUpdateTaskInstanceData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}TaskInstanceControllerUpdateTaskInstanceData`
    ](...args)
}

export function taskInstanceControllerDeleteTaskInstanceData(
    connection: Api<unknown>,
    courseType: string,
    phaseType: string,
    taskType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[
        `${courseType}${capitalize(phaseType)}${capitalize(taskType)}TaskInstanceControllerDeleteTaskInstanceData`
    ](...args)
}

export function courseScheduleControllerGetSchedules(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ScheduleControllerGetSchedules`](...args)
}

export function courseScheduleControllerAddSchedule(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ScheduleControllerCreateSchedule`](...args)
}

export function courseScheduleControllerUpdateSchedule(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ScheduleControllerUpdateSchedule`](...args)
}

export function courseScheduleControllerDeleteSchedule(
    connection: Api<unknown>,
    courseType: string,
    ...args: any[]
): Promise<any> {
    return (connection.api as any)[`${courseType}ScheduleControllerDeleteSchedule`](...args)
}
