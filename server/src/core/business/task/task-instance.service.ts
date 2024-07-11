// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { capitalize } from '@/common/capitalize.util'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ITaskInstance } from '@/core/data/interfaces/task-instance.interface'
import mongoose, { Error, Model, Promise } from 'mongoose'
import { TaskInstance } from '@/core/data/schemas/task-instance.schema'
import { TaskData } from '@/decorators/task.decorator'
import {
    InjectPhaseInstanceModel,
    InjectPhaseModel,
    InjectTaskInstanceModel,
    InjectTaskModel
} from '@/core/data/data.module'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { Task } from '@/core/data/schemas/task.schema'
import { Phase } from '@/core/data/schemas/phase.schema'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'

export interface ITaskInstanceService<T extends ITaskInstance = any> {
    getTaskInstancesForTask(taskId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    getTaskInstancesForPhaseInstance(phaseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    getTaskInstanceData(taskInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<T | null>
    createTaskInstance(
        taskId: string | mongoose.Schema.Types.ObjectId,
        phaseInstanceIds: string[] | mongoose.Schema.Types.ObjectId[],
        data: Partial<T>
    ): Promise<T>
    updateTaskInstanceData(taskInstanceId: string | mongoose.Schema.Types.ObjectId, data: Partial<T>): Promise<void>
    deleteTaskInstanceData(taskInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<void>
}

export function taskInstanceServiceInjectionToken(): string
export function taskInstanceServiceInjectionToken(courseName: string, phaseName: string, taskName: string): string
export function taskInstanceServiceInjectionToken(courseName?: string, phaseName?: string, taskName?: string) {
    if (courseName && phaseName && taskName) {
        return `${capitalize(courseName)}${capitalize(phaseName)}${capitalize(taskName)}TaskInstanceService`
    } else {
        return 'TaskInstanceService'
    }
}

export function InjectTaskInstanceService(): PropertyDecorator & ParameterDecorator
export function InjectTaskInstanceService(
    courseName: string,
    phaseName: string,
    taskName: string
): PropertyDecorator & ParameterDecorator
export function InjectTaskInstanceService(courseName?: string, phaseName?: string, taskName?: string) {
    if (courseName && phaseName && taskName) {
        return Inject(taskInstanceServiceInjectionToken(courseName, phaseName, taskName))
    } else {
        return Inject(taskInstanceServiceInjectionToken())
    }
}

@Injectable()
export class TaskInstanceService implements OnModuleInit {
    constructor(
        @InjectPhaseModel() readonly phaseModel: Model<Phase>,
        @InjectTaskModel() readonly taskModel: Model<Task>,
        @InjectPhaseInstanceModel() readonly phaseInstanceModel: Model<PhaseInstance>,
        @InjectTaskInstanceModel() readonly taskInstanceModel: Model<TaskInstance>
    ) {}

    public async onModuleInit() {
        await this.taskInstanceModel.updateMany({ locked: true }, { locked: false })
    }

    public async getTaskInstanceById(id: string | mongoose.Schema.Types.ObjectId) {
        return this.taskInstanceModel.findById(id).lean()
    }

    public async getTaskInstancesForPhase(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<TaskInstance[]> {
        const tasks = await this.taskModel.find({ phase: phaseId }).lean()
        return this.taskInstanceModel.find({ task: { $in: tasks.map((t) => t._id) } }).lean()
    }

    public async getTaskInstancesForPhaseInstance(
        phaseInstanceId: string | mongoose.Schema.Types.ObjectId
    ): Promise<TaskInstance[]> {
        return this.taskInstanceModel.find({ phaseInstances: phaseInstanceId }).lean()
    }

    public async getTaskInstancesForCourse(courseId: string | mongoose.Schema.Types.ObjectId): Promise<TaskInstance[]> {
        const phases = await this.phaseModel.find({ course: courseId }).lean()
        const tasks = await this.taskModel.find({ phase: { $in: phases.map((p) => p._id) } }).lean()
        return this.taskInstanceModel.find({ task: { $in: tasks.map((t) => t._id) } }).lean()
    }

    public async getTaskInstancesForCourseInstance(courseInstanceId: string | mongoose.Schema.Types.ObjectId) {
        const phaseInstanceIds = (await this.phaseInstanceModel.find({ courseInstances: courseInstanceId }).lean()).map(
            (p) => p._id.toString()
        )
        const taskInstances = (await this.taskInstanceModel.find().lean()) as TaskInstance[]
        return taskInstances.filter((taskInstance) => {
            return (taskInstance.phaseInstances as mongoose.Schema.Types.ObjectId[]).some((phaseInstanceId) =>
                phaseInstanceIds.includes(phaseInstanceId.toString())
            )
        })
    }
}

export function synthesizeTaskInstanceService(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    @Injectable()
    class SynthesizedTaskInstanceService implements ITaskInstanceService {
        constructor(@InjectTaskInstanceModel(taskData) readonly taskInstanceModel: Model<TaskInstance>) {}

        public async getTaskInstancesForTask(taskId: string | mongoose.Schema.Types.ObjectId): Promise<any[]> {
            return this.taskInstanceModel.find({ task: taskId }).lean()
        }

        public async getTaskInstancesForPhaseInstance(
            phaseInstanceId: string | mongoose.Schema.Types.ObjectId
        ): Promise<any[]> {
            return this.taskInstanceModel.find({ phaseInstances: phaseInstanceId }).lean()
        }

        public async getTaskInstanceData(taskInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<any | null> {
            const taskInstance = await this.taskInstanceModel.findById(taskInstanceId).lean()
            return taskInstance ?? null
        }

        public async createTaskInstance(
            taskId: string | mongoose.Schema.Types.ObjectId,
            taskInstanceIds: string[] | mongoose.Schema.Types.ObjectId[],
            data: Partial<any>
        ): Promise<any> {
            const newTaskInstance = new this.taskInstanceModel({
                ...data,
                phaseInstances: taskInstanceIds,
                task: taskId
            })
            await newTaskInstance.save()

            return this.taskInstanceModel.findById(newTaskInstance._id).lean()
        }

        public async updateTaskInstanceData(
            taskInstanceId: string | mongoose.Schema.Types.ObjectId,
            data: Partial<any>
        ): Promise<void> {
            const taskInstanceToUpdate = await this.taskInstanceModel.findById(taskInstanceId).exec()
            if (!taskInstanceToUpdate) {
                throw new Error(`TaskInstance does not exist`)
            }

            await taskInstanceToUpdate.updateOne(data).exec()
        }

        public async deleteTaskInstanceData(taskInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<void> {
            const taskInstanceToDelete = await this.taskInstanceModel.findById(taskInstanceId).exec()
            if (!taskInstanceToDelete) {
                throw new Error(`TaskInstance does not exist`)
            }

            await taskInstanceToDelete.deleteOne().exec()
        }
    }

    Object.defineProperty(SynthesizedTaskInstanceService, 'name', {
        value: taskInstanceServiceInjectionToken(courseData.name, phaseData.name, taskData.name)
    })

    return SynthesizedTaskInstanceService
}
