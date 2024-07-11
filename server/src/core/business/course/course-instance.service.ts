// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { capitalize } from '@/common/capitalize.util'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ICourseInstance } from '@/core/data/interfaces/course-instance.interface'
import mongoose, { Error, Model, Promise } from 'mongoose'
import { CourseInstance } from '@/core/data/schemas/course-instance.schema'
import { InjectCourseInstanceModel, InjectCourseModel } from '@/core/data/data.module'
import { CourseData } from '@/decorators/course.decorator'
import { ModuleRef } from '@nestjs/core'
import { COURSE_DATA_INJECTION_TOKEN } from '@/core/business/course/course.service'
import { Course } from '@/core/data/schemas/course.schema'
import { courseActionServiceInjectionToken, ICourseActionService } from '@/core/business/course/course-action.service'
import * as winston from 'winston'

export interface ICourseInstanceService<T extends ICourseInstance = ICourseInstance> {
    getCourseInstancesForCourse(courseId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    getCourseInstanceData(courseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<T | null>
    updateCourseInstanceData(courseInstanceId: string | mongoose.Schema.Types.ObjectId, data: Partial<T>): Promise<void>
    deleteCourseInstanceData(courseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<void>
}

export function courseInstanceServiceInjectionToken(courseName?: string) {
    if (courseName) {
        return `${capitalize(courseName)}CourseInstanceService`
    } else {
        return 'CourseInstanceService'
    }
}

export function InjectCourseInstanceService(courseName?: string) {
    return Inject(courseInstanceServiceInjectionToken(courseName))
}

@Injectable()
export class CourseInstanceService implements OnModuleInit {
    constructor(
        @InjectCourseModel() readonly courseModel: Model<Course>,
        @InjectCourseInstanceModel() readonly courseInstanceModel: Model<CourseInstance>,
        readonly moduleRef: ModuleRef,
        @Inject(COURSE_DATA_INJECTION_TOKEN) readonly courseData: CourseData[]
    ) {}

    async onModuleInit() {
        await this.courseInstanceModel.updateMany({ locked: true }, { locked: false })
    }

    public async getCourseInstancesForCourse(id: string | mongoose.Schema.Types.ObjectId) {
        return this.courseInstanceModel.find({ course: id }).lean()
    }

    public async getCourseInstancesByFilter(filter: any) {
        return this.courseInstanceModel.find(filter).lean()
    }

    public async getCourseInstancesForUser(id: string | mongoose.Schema.Types.ObjectId) {
        return this.courseInstanceModel.find({ user: id }).lean()
    }

    public async getCourseInstanceById(id: string | mongoose.Schema.Types.ObjectId) {
        return this.courseInstanceModel.findById(id).lean()
    }

    public async createCourseInstance(
        courseId: string | mongoose.Schema.Types.ObjectId,
        userId: string | mongoose.Schema.Types.ObjectId,
        data: any
    ) {
        const course = await this.courseModel.findById(courseId).lean()
        if (!course) {
            throw new Error('Course not found')
        }

        const courseInstanceModel = this.moduleRef.get(`${course.type}CourseInstanceModel`, { strict: false })

        const newCourseInstance = new courseInstanceModel({ course: courseId, user: userId })
        await newCourseInstance.save()

        try {
            const initActionService = this.moduleRef.get(courseActionServiceInjectionToken(course.type, 'init'), {
                strict: false
            }) as ICourseActionService
            await initActionService.doAction(newCourseInstance._id, data, winston.createLogger())
        } finally {
        }

        return newCourseInstance
    }
}

export function synthesizeCourseInstanceService(courseData: CourseData) {
    @Injectable()
    class SynthesizedCourseInstanceService implements ICourseInstanceService {
        constructor(@InjectCourseInstanceModel(courseData) readonly courseInstanceModel: Model<CourseInstance>) {}

        public async getCourseInstancesForCourse(courseId: string | mongoose.Schema.Types.ObjectId): Promise<any[]> {
            return this.courseInstanceModel.find({ course: courseId }).lean()
        }

        public async getCourseInstanceData(
            courseInstanceId: string | mongoose.Schema.Types.ObjectId
        ): Promise<any | null> {
            const courseInstance = await this.courseInstanceModel.findById(courseInstanceId).lean()
            return courseInstance ?? null
        }

        public async updateCourseInstanceData(
            courseInstanceId: string | mongoose.Schema.Types.ObjectId,
            data: Partial<any>
        ): Promise<void> {
            const courseInstanceToUpdate = await this.courseInstanceModel.findById(courseInstanceId).exec()
            if (!courseInstanceToUpdate) {
                throw new Error(`CourseInstance does not exist`)
            }

            await courseInstanceToUpdate.updateOne(data).exec()
        }

        public async deleteCourseInstanceData(
            courseInstanceId: string | mongoose.Schema.Types.ObjectId
        ): Promise<void> {
            const courseInstanceToDelete = await this.courseInstanceModel.findById(courseInstanceId).exec()
            if (!courseInstanceToDelete) {
                throw new Error(`CourseInstance does not exist`)
            }

            await courseInstanceToDelete.deleteOne().exec()
        }
    }

    Object.defineProperty(SynthesizedCourseInstanceService, 'name', {
        value: courseInstanceServiceInjectionToken(courseData.name)
    })

    return SynthesizedCourseInstanceService
}
