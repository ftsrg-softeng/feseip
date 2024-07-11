// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { TaskData } from '@/decorators/task.decorator'
import { capitalize } from '@/common/capitalize.util'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ITask } from '@/core/data/interfaces/task.interface'
import mongoose, { Model } from 'mongoose'
import { Task } from '@/core/data/schemas/task.schema'
import { InjectPhaseModel, InjectTaskModel } from '@/core/data/data.module'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { Phase } from '@/core/data/schemas/phase.schema'

export interface ITaskService<T extends ITask = any> {
    getTaskData(taskId: string | mongoose.Schema.Types.ObjectId): Promise<T | null>
    getTasksForPhase(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    createTask(courseId: string | mongoose.Schema.Types.ObjectId, data: Partial<any>): Promise<T>
    updateTaskData(taskId: string | mongoose.Schema.Types.ObjectId, data: Partial<T>): Promise<void>
}

export function taskServiceInjectionToken(): string
export function taskServiceInjectionToken(courseName: string, phaseName: string, taskName: string): string
export function taskServiceInjectionToken(courseName?: string, phaseName?: string, taskName?: string) {
    if (courseName && phaseName && taskName) {
        return `${capitalize(courseName)}${capitalize(phaseName)}${capitalize(taskName)}TaskService`
    } else {
        return 'TaskService'
    }
}

export function InjectTaskService(): PropertyDecorator & ParameterDecorator
export function InjectTaskService(
    courseName: string,
    phaseName: string,
    taskName: string
): PropertyDecorator & ParameterDecorator
export function InjectTaskService(courseName?: string, phaseName?: string, taskName?: string) {
    if (courseName && phaseName && taskName) {
        return Inject(taskServiceInjectionToken(courseName, phaseName, taskName))
    } else {
        return Inject(taskServiceInjectionToken())
    }
}

@Injectable()
export class TaskService implements OnModuleInit {
    constructor(
        @InjectPhaseModel() readonly phaseModel: Model<Phase>,
        @InjectTaskModel() readonly taskModel: Model<Task>
    ) {}

    public async onModuleInit() {
        await this.taskModel.updateMany({ locked: true }, { locked: false })
    }

    public async getTaskById(id: string | mongoose.Schema.Types.ObjectId) {
        return this.taskModel.findById(id).lean()
    }

    public async getTasksForPhase(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<Task[]> {
        return this.taskModel.find({ phase: phaseId }).lean()
    }

    public async getTasksForCourse(courseId: string | mongoose.Schema.Types.ObjectId): Promise<Task[]> {
        const phases = await this.phaseModel.find({ course: courseId }).lean()
        return this.taskModel.find({ phase: { $in: phases.map((p) => p._id) } }).lean()
    }
}

export function synthesizeTaskService(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    @Injectable()
    class SynthesizedTaskService implements ITaskService {
        constructor(@InjectTaskModel(taskData) readonly taskModel: Model<Task>) {}

        public async getTaskData(taskId: string | mongoose.Schema.Types.ObjectId): Promise<any | null> {
            const task = await this.taskModel.findById(taskId).lean()
            return task ?? null
        }

        public async getTasksForPhase(phaseId: string | mongoose.Schema.Types.ObjectId) {
            return this.taskModel.find({ phase: phaseId }).lean()
        }

        public async createTask(phaseId: string | mongoose.Schema.Types.ObjectId, data: Partial<any>) {
            const newTask = new this.taskModel({ ...data, phase: phaseId })
            await newTask.save()

            return this.taskModel.findById(newTask._id).lean()
        }

        public async updateTaskData(
            taskId: string | mongoose.Schema.Types.ObjectId,
            data: Partial<any>
        ): Promise<void> {
            const taskToUpdate = await this.taskModel.findById(taskId).exec()
            if (!taskToUpdate) {
                throw new Error(`Task does not exist`)
            }

            await taskToUpdate.updateOne(data).exec()
        }
    }

    Object.defineProperty(SynthesizedTaskService, 'name', {
        value: taskServiceInjectionToken(courseData.name, phaseData.name, taskData.name)
    })

    return SynthesizedTaskService
}
