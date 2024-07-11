// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Type } from '@nestjs/common'
import { UserRole } from '@/core/data/schemas/user.schema'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'

export type ActionProps = {
    roles: UserRole[]
    returnType?: Type<unknown>
    iKnowWhatIAmDoing?: { disableLtiAuthorization?: boolean; concurrencyMode?: 'locks' | 'queue' | 'none' }
    shouldRun?: (args: {
        courseInstance?: any
        course?: any
        phaseInstance?: any
        phase?: any
        taskInstance?: any
        task?: any
    }) => boolean
}

type ParamType =
    | 'argument'
    | 'course'
    | 'course-instance'
    | 'phase'
    | 'phase-instance'
    | 'task'
    | 'task-instance'
    | 'logger'

export type ActionData = {
    name: string
    roles: UserRole[]
    instance: boolean
    returnType: Type<unknown> | null
    argumentType: Type<unknown> | 'request' | 'requestResponse' | null
    params: { index: number; type: ParamType }[]
    disableLtiAuthorization: boolean
    concurrencyMode: 'locks' | 'queue' | 'none'
    shouldRun: (
        args:
            | { courseInstance: any }
            | { course: any }
            | { phaseInstance: any }
            | { phase: any }
            | { taskInstance: any }
            | { task: any }
    ) => boolean
}

const ACTION_METADATA_KEY = 'actions'

function InternalAction(instance: boolean, actionData: ActionProps): MethodDecorator {
    return (target, propertyKey) => {
        const actionsMetadata = (Reflect.getMetadata(ACTION_METADATA_KEY, target) ?? []) as ActionData[]
        const actionMetadata = actionsMetadata.find((a) => a.name === propertyKey)
        if (!actionMetadata) {
            actionsMetadata.push({
                roles: actionData.roles,
                instance: instance,
                returnType: actionData.returnType ?? null,
                argumentType: null,
                name: propertyKey.toString(),
                params: [],
                disableLtiAuthorization: actionData.iKnowWhatIAmDoing?.disableLtiAuthorization ?? false,
                concurrencyMode: actionData.iKnowWhatIAmDoing?.concurrencyMode ?? 'locks',
                shouldRun:
                    actionData.shouldRun ??
                    function () {
                        return true
                    }
            })
        } else {
            actionMetadata.roles = actionData.roles
            actionMetadata.instance = instance
            actionMetadata.returnType = actionData.returnType ?? null
            actionMetadata.disableLtiAuthorization = actionData.iKnowWhatIAmDoing?.disableLtiAuthorization ?? false
            actionMetadata.concurrencyMode = actionData.iKnowWhatIAmDoing?.concurrencyMode ?? 'locks'
            actionMetadata.shouldRun =
                actionData.shouldRun ??
                function () {
                    return true
                }
        }
        actionsMetadata.push()
        Reflect.defineMetadata(ACTION_METADATA_KEY, actionsMetadata, target)
    }
}

export const Action = (actionData: ActionProps) => InternalAction(false, actionData)
export const InstanceAction = (actionData: ActionProps) => InternalAction(true, actionData)

function actionParam(type: ParamType): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        const actionsMetadata = (Reflect.getMetadata(ACTION_METADATA_KEY, target) ?? []) as ActionData[]
        const actionMetadata = actionsMetadata.find((a) => a.name === propertyKey)
        if (!actionMetadata) {
            actionsMetadata.push({
                roles: [],
                instance: false,
                returnType: null,
                name: propertyKey!.toString(),
                argumentType: null,
                params: [{ index: parameterIndex, type: type }],
                disableLtiAuthorization: false,
                concurrencyMode: 'locks',
                shouldRun: function () {
                    return true
                }
            })
        } else {
            actionMetadata.params.push({ index: parameterIndex, type: type })
        }

        Reflect.defineMetadata(ACTION_METADATA_KEY, actionsMetadata, target)
    }
}

export function ActionArguments(type: Type<unknown>): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        const actionsMetadata = (Reflect.getMetadata(ACTION_METADATA_KEY, target) ?? []) as ActionData[]
        const actionMetadata = actionsMetadata.find((a) => a.name === propertyKey)
        if (!actionMetadata) {
            actionsMetadata.push({
                roles: [],
                instance: false,
                returnType: null,
                name: propertyKey!.toString(),
                argumentType: type,
                params: [{ index: parameterIndex, type: 'argument' }],
                disableLtiAuthorization: false,
                concurrencyMode: 'locks',
                shouldRun: function () {
                    return true
                }
            })
        } else {
            actionMetadata.argumentType = type
            actionMetadata.params.push({ index: parameterIndex, type: 'argument' })
        }

        Reflect.defineMetadata(ACTION_METADATA_KEY, actionsMetadata, target)
    }
}

export function CurrentRequest(): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        const actionsMetadata = (Reflect.getMetadata(ACTION_METADATA_KEY, target) ?? []) as ActionData[]
        const actionMetadata = actionsMetadata.find((a) => a.name === propertyKey)
        if (!actionMetadata) {
            actionsMetadata.push({
                roles: [],
                instance: false,
                returnType: null,
                name: propertyKey!.toString(),
                argumentType: 'request',
                params: [{ index: parameterIndex, type: 'argument' }],
                disableLtiAuthorization: false,
                concurrencyMode: 'locks',
                shouldRun: function () {
                    return true
                }
            })
        } else {
            actionMetadata.argumentType = 'request'
            actionMetadata.params.push({ index: parameterIndex, type: 'argument' })
        }

        Reflect.defineMetadata(ACTION_METADATA_KEY, actionsMetadata, target)
    }
}

export function CurrentRequestResponse(): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        const actionsMetadata = (Reflect.getMetadata(ACTION_METADATA_KEY, target) ?? []) as ActionData[]
        const actionMetadata = actionsMetadata.find((a) => a.name === propertyKey)
        if (!actionMetadata) {
            actionsMetadata.push({
                roles: [],
                instance: false,
                returnType: null,
                name: propertyKey!.toString(),
                argumentType: 'requestResponse',
                params: [{ index: parameterIndex, type: 'argument' }],
                disableLtiAuthorization: false,
                concurrencyMode: 'locks',
                shouldRun: function () {
                    return true
                }
            })
        } else {
            actionMetadata.argumentType = 'requestResponse'
            actionMetadata.params.push({ index: parameterIndex, type: 'argument' })
        }

        Reflect.defineMetadata(ACTION_METADATA_KEY, actionsMetadata, target)
    }
}

export const CurrentCourse = () => actionParam('course')
export const CurrentCourseInstance = () => actionParam('course-instance')
export const CurrentPhase = () => actionParam('phase')
export const CurrentPhaseInstance = () => actionParam('phase-instance')
export const CurrentTask = () => actionParam('task')
export const CurrentTaskInstance = () => actionParam('task-instance')
export const CurrentLogger = () => actionParam('logger')

export function getActionsMetadata(target: Type<unknown>) {
    return (Reflect.getMetadata(ACTION_METADATA_KEY, target.prototype) ?? []) as ActionData[]
}

export function getActionName(
    actionData: ActionData,
    courseData: CourseData,
    phaseData?: PhaseData,
    taskData?: TaskData
) {
    return [courseData.name, phaseData?.name, taskData?.name, actionData.name].filter((n) => n !== undefined).join('.')
}
