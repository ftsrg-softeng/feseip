// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { applyDecorators, Injectable, SetMetadata, Type } from '@nestjs/common'
import mongoose, { HydratedDocument } from 'mongoose'
import { SchemaToDtoType } from '@/common/schema-to-dto.util'
import { ITask } from '@/core/data/interfaces/task.interface'
import { ActionData, getActionsMetadata } from '@/decorators/action.decorator'
import { ITaskInstance } from '@/core/data/interfaces/task-instance.interface'

export type TaskProps<
    TSchema extends ITask = ITask,
    TISchema extends ITaskInstance = ITaskInstance,
    TDTO = SchemaToDtoType<TSchema>,
    TIDTO = SchemaToDtoType<TISchema>
> = {
    name: string

    taskSchema: mongoose.Schema<TSchema>
    taskDTO: Type<TDTO>
    taskDocumentToDto?: (document: TSchema | HydratedDocument<TSchema>) => TDTO

    taskInstanceSchema: mongoose.Schema<TISchema>
    taskInstanceDTO: Type<TIDTO>
    taskInstanceDocumentToDto?: (document: TISchema | HydratedDocument<TISchema>) => TIDTO
}

export type TaskData<
    TSchema extends ITask = ITask,
    TISchema extends ITaskInstance = ITaskInstance,
    TDTO = SchemaToDtoType<TSchema>,
    TIDTO = SchemaToDtoType<TISchema>
> = TaskProps<TSchema, TISchema, TDTO, TIDTO> & {
    target: Type<unknown>
    actions: ActionData[]
}

const TASK_METADATA_KEY = 'task'

export const DeclareTask = (taskData: TaskProps) =>
    applyDecorators(Injectable(), SetMetadata(TASK_METADATA_KEY, taskData))

export function getTaskData(task: Type<unknown>): TaskData {
    const taskData = Reflect.getMetadata(TASK_METADATA_KEY, task) as TaskProps | undefined
    if (!taskData) {
        throw new Error(`Task must be annotated with @${DeclareTask.name}`)
    }
    return {
        ...taskData,
        target: task,
        actions: getActionsMetadata(task)
    }
}
