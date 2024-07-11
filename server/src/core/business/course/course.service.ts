// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { capitalize } from '@/common/capitalize.util'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ICourse } from '@/core/data/interfaces/course.interface'
import mongoose, { Error, Model } from 'mongoose'
import { Course } from '@/core/data/schemas/course.schema'
import { InjectCourseModel } from '@/core/data/data.module'
import { ModuleRef } from '@nestjs/core'

export interface ICourseService<T extends ICourse = any> {
    getCourseData(courseId: string | mongoose.Schema.Types.ObjectId): Promise<T | null>
    updateCourseData(courseId: string | mongoose.Schema.Types.ObjectId, data: Partial<T>): Promise<void>
}

export function courseServiceInjectionToken(courseName?: string) {
    if (courseName) {
        return `${capitalize(courseName)}CourseService`
    } else {
        return 'CourseService'
    }
}

export function InjectCourseService(courseName?: string) {
    return Inject(courseServiceInjectionToken(courseName))
}

export const COURSE_DATA_INJECTION_TOKEN = 'COURSE_DATA_INJECTION_TOKEN'

@Injectable()
export class CourseService implements OnModuleInit {
    constructor(
        @InjectCourseModel() readonly courseModel: Model<Course>,
        readonly moduleRef: ModuleRef,
        @Inject(COURSE_DATA_INJECTION_TOKEN) readonly courseData: CourseData[]
    ) {}

    async onModuleInit() {
        await this.courseModel.updateMany({ locked: true }, { locked: false })
    }

    async getCourseById(id: string | mongoose.Schema.Types.ObjectId) {
        const course = await this.courseModel.findById(id).lean()
        if (!course) {
            throw new Error('Course does not exist')
        }
        return course
    }

    async getCourseByApiKey(apiKey: string) {
        const course = await this.courseModel.findOne({ apiKey: apiKey }).lean()
        if (!course) {
            throw new Error('Course does not exist')
        }
        return course
    }

    async getAllCourses() {
        return this.courseModel.find().lean()
    }

    async createCourse(args: Omit<Course, '_id' | 'locked' | 'history' | 'blocked'>) {
        if (!this.courseData.map((data) => data.name).includes(args.type)) {
            throw new Error(`${args.type} is not a valid type`)
        }

        const courseModel = this.moduleRef.get(`${args.type}CourseModel`, { strict: false })

        const newCourse = new courseModel(args)
        await newCourse.save()
    }

    async updateCourse(
        id: string | mongoose.Schema.Types.ObjectId,
        args: Omit<Course, '_id' | 'locked' | 'history' | 'type'>
    ) {
        const courseToUpdate = await this.courseModel.findById(id).exec()
        if (!courseToUpdate) {
            throw new Error(`Course does not exist`)
        }

        await courseToUpdate.updateOne(args)
    }

    async deleteCourse(id: string | mongoose.Schema.Types.ObjectId) {
        const courseToDelete = await this.courseModel.findById(id).exec()
        if (!courseToDelete) {
            throw new Error(`Course does not exist`)
        }
        await courseToDelete.deleteOne()
    }

    getCourseTypes(): string[] {
        return this.courseData.map((data) => data.name)
    }
}

export function synthesizeCourseService(courseData: CourseData) {
    @Injectable()
    class SynthesizedCourseService implements ICourseService {
        constructor(@InjectCourseModel(courseData) readonly courseModel: Model<Course>) {}

        public async getCourseData(courseId: string | mongoose.Schema.Types.ObjectId): Promise<any | null> {
            const course = await this.courseModel.findById(courseId).lean()
            return course ?? null
        }

        public async updateCourseData(
            courseId: string | mongoose.Schema.Types.ObjectId,
            data: Partial<any>
        ): Promise<void> {
            const courseToUpdate = await this.courseModel.findById(courseId).exec()
            if (!courseToUpdate) {
                throw new Error(`Course does not exist`)
            }

            await courseToUpdate.updateOne(data).exec()
        }
    }

    Object.defineProperty(SynthesizedCourseService, 'name', {
        value: courseServiceInjectionToken(courseData.name)
    })

    return SynthesizedCourseService
}
