// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module } from '@nestjs/common'
import { CourseData } from '@/decorators/course.decorator'
import { InjectModel, MongooseModule } from '@nestjs/mongoose'
import { DiscriminatorOptions } from '@nestjs/mongoose/dist/interfaces/model-definition.interface'
import { Course, CourseSchema } from '@/core/data/schemas/course.schema'
import { Phase, PhaseSchema } from '@/core/data/schemas/phase.schema'
import { Task, TaskSchema } from '@/core/data/schemas/task.schema'
import { User, UserSchema } from '@/core/data/schemas/user.schema'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { CourseInstance, CourseInstanceSchema } from '@/core/data/schemas/course-instance.schema'
import { PhaseInstance, PhaseInstanceSchema } from '@/core/data/schemas/phase-instance.schema'
import { TaskInstance, TaskInstanceSchema } from '@/core/data/schemas/task-instance.schema'
import { Log, LogSchema } from '@/core/data/schemas/log.schema'
import { Schedule, ScheduleSchema } from '@/core/data/schemas/schedule.schema'
import { InternalError, InternalErrorSchema } from '@/core/data/schemas/internal-error.schema'

export function InjectCourseModel(courseData?: CourseData) {
    return courseData ? InjectModel(`${courseData.name}Course`) : InjectModel(Course.name)
}

export function InjectCourseInstanceModel(courseData?: CourseData) {
    return courseData ? InjectModel(`${courseData.name}CourseInstance`) : InjectModel(CourseInstance.name)
}

export function InjectPhaseModel(phaseData?: PhaseData) {
    return phaseData ? InjectModel(`${phaseData.name}Phase`) : InjectModel(Phase.name)
}

export function InjectPhaseInstanceModel(phaseData?: PhaseData) {
    return phaseData ? InjectModel(`${phaseData.name}PhaseInstance`) : InjectModel(PhaseInstance.name)
}

export function InjectTaskModel(taskData?: TaskData) {
    return taskData ? InjectModel(`${taskData.name}Task`) : InjectModel(Task.name)
}

export function InjectTaskInstanceModel(taskData?: TaskData) {
    return taskData ? InjectModel(`${taskData.name}TaskInstance`) : InjectModel(TaskInstance.name)
}

@Module({})
export class DataModule {
    static register(courseData: CourseData[]): DynamicModule {
        const courseDiscriminators = [] as DiscriminatorOptions[]
        const courseInstanceDiscriminators = [] as DiscriminatorOptions[]
        const phaseDiscriminators = [] as DiscriminatorOptions[]
        const phaseInstanceDiscriminators = [] as DiscriminatorOptions[]
        const taskDiscriminators = [] as DiscriminatorOptions[]
        const taskInstanceDiscriminators = [] as DiscriminatorOptions[]

        for (const course of courseData) {
            courseDiscriminators.push({
                name: `${course.name}Course`,
                schema: course.courseSchema,
                value: course.name
            })

            courseInstanceDiscriminators.push({
                name: `${course.name}CourseInstance`,
                schema: course.courseInstanceSchema,
                value: course.name
            })

            for (const phase of course.phases) {
                if (!phaseDiscriminators.find((p) => p.value === phase.name)) {
                    phaseDiscriminators.push({
                        name: `${phase.name}Phase`,
                        schema: phase.phaseSchema,
                        value: phase.name
                    })

                    phaseInstanceDiscriminators.push({
                        name: `${phase.name}PhaseInstance`,
                        schema: phase.phaseInstanceSchema,
                        value: phase.name
                    })
                }

                for (const task of phase.tasks) {
                    if (!taskDiscriminators.find((t) => t.value === task.name)) {
                        taskDiscriminators.push({
                            name: `${task.name}Task`,
                            schema: task.taskSchema,
                            value: task.name
                        })

                        taskInstanceDiscriminators.push({
                            name: `${task.name}TaskInstance`,
                            schema: task.taskInstanceSchema,
                            value: task.name
                        })
                    }
                }
            }
        }

        return {
            module: DataModule,
            imports: [
                MongooseModule.forFeature([
                    {
                        name: Course.name,
                        schema: CourseSchema,
                        discriminators: courseDiscriminators
                    },
                    {
                        name: CourseInstance.name,
                        schema: CourseInstanceSchema,
                        discriminators: courseInstanceDiscriminators
                    },
                    {
                        name: Phase.name,
                        schema: PhaseSchema,
                        discriminators: phaseDiscriminators
                    },
                    {
                        name: PhaseInstance.name,
                        schema: PhaseInstanceSchema,
                        discriminators: phaseInstanceDiscriminators
                    },
                    {
                        name: Task.name,
                        schema: TaskSchema,
                        discriminators: taskDiscriminators
                    },
                    {
                        name: TaskInstance.name,
                        schema: TaskInstanceSchema,
                        discriminators: taskInstanceDiscriminators
                    },
                    { name: User.name, schema: UserSchema },
                    { name: Log.name, schema: LogSchema },
                    { name: Schedule.name, schema: ScheduleSchema },
                    { name: InternalError.name, schema: InternalErrorSchema }
                ])
            ],
            exports: [MongooseModule]
        }
    }
}
