// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { capitalize } from '@/common/capitalize.util'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { IPhaseInstance } from '@/core/data/interfaces/phase-instance.interface'
import mongoose, { Error, Model, Promise } from 'mongoose'
import { PhaseInstance } from '@/core/data/schemas/phase-instance.schema'
import { PhaseData } from '@/decorators/phase.decorator'
import { InjectPhaseInstanceModel, InjectPhaseModel } from '@/core/data/data.module'
import { CourseData } from '@/decorators/course.decorator'
import { Phase } from '@/core/data/schemas/phase.schema'

export interface IPhaseInstanceService<T extends IPhaseInstance = any> {
    getPhaseInstancesForPhase(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    getPhaseInstancesForCourseInstance(courseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    getPhaseInstanceData(phaseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<T | null>
    createPhaseInstance(
        phaseId: string | mongoose.Schema.Types.ObjectId,
        courseInstanceIds: string[] | mongoose.Schema.Types.ObjectId[],
        data: Partial<T>
    ): Promise<T>
    updatePhaseInstanceData(phaseInstanceId: string | mongoose.Schema.Types.ObjectId, data: Partial<T>): Promise<void>
    deletePhaseInstanceData(phaseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<void>
}

export function phaseInstanceServiceInjectionToken(): string
export function phaseInstanceServiceInjectionToken(courseName: string, phaseName: string): string
export function phaseInstanceServiceInjectionToken(courseName?: string, phaseName?: string) {
    if (courseName && phaseName) {
        return `${capitalize(courseName)}${capitalize(phaseName)}PhaseInstanceService`
    } else {
        return 'PhaseInstanceService'
    }
}

export function InjectPhaseInstanceService(): PropertyDecorator & ParameterDecorator
export function InjectPhaseInstanceService(
    courseName: string,
    phaseName: string
): PropertyDecorator & ParameterDecorator
export function InjectPhaseInstanceService(courseName?: string, phaseName?: string) {
    if (courseName && phaseName) {
        return Inject(phaseInstanceServiceInjectionToken(courseName, phaseName))
    } else {
        return Inject(phaseInstanceServiceInjectionToken())
    }
}

@Injectable()
export class PhaseInstanceService implements OnModuleInit {
    constructor(
        @InjectPhaseModel() readonly phaseModel: Model<Phase>,
        @InjectPhaseInstanceModel() readonly phaseInstanceModel: Model<PhaseInstance>
    ) {}

    public async onModuleInit() {
        await this.phaseInstanceModel.updateMany({ locked: true }, { locked: false })
    }

    public async getPhaseInstanceById(id: string | mongoose.Schema.Types.ObjectId) {
        return this.phaseInstanceModel.findById(id).lean()
    }

    public async getPhaseInstancesForCourse(courseId: string | mongoose.Schema.Types.ObjectId) {
        const phases = await this.phaseModel.find({ course: courseId }).lean()
        return this.phaseInstanceModel.find({ phase: phases.map((p) => p._id) }).lean()
    }

    public async getPhaseInstancesForCourseInstance(courseInstanceId: string | mongoose.Schema.Types.ObjectId) {
        return this.phaseInstanceModel.find({ courseInstances: courseInstanceId }).lean()
    }
}

export function synthesizePhaseInstanceService(courseData: CourseData, phaseData: PhaseData) {
    @Injectable()
    class SynthesizedPhaseInstanceService implements IPhaseInstanceService {
        constructor(@InjectPhaseInstanceModel(phaseData) readonly phaseInstanceModel: Model<PhaseInstance>) {}

        public async getPhaseInstancesForPhase(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<any[]> {
            return this.phaseInstanceModel.find({ phase: phaseId }).lean()
        }

        public async getPhaseInstancesForCourseInstance(
            courseInstanceId: string | mongoose.Schema.Types.ObjectId
        ): Promise<any[]> {
            return this.phaseInstanceModel.find({ courseInstances: courseInstanceId }).lean()
        }

        public async getPhaseInstanceData(
            phaseInstanceId: string | mongoose.Schema.Types.ObjectId
        ): Promise<any | null> {
            const phaseInstance = await this.phaseInstanceModel.findById(phaseInstanceId).lean()
            return phaseInstance ?? null
        }

        public async createPhaseInstance(
            phaseId: string | mongoose.Schema.Types.ObjectId,
            courseInstanceIds: string[] | mongoose.Schema.Types.ObjectId[],
            data: Partial<any>
        ): Promise<any> {
            const newPhaseInstance = new this.phaseInstanceModel({
                ...data,
                courseInstances: courseInstanceIds,
                phase: phaseId
            })
            await newPhaseInstance.save()

            return this.phaseInstanceModel.findById(newPhaseInstance._id).lean()
        }

        public async updatePhaseInstanceData(
            phaseInstanceId: string | mongoose.Schema.Types.ObjectId,
            data: Partial<any>
        ): Promise<void> {
            const phaseInstanceToUpdate = await this.phaseInstanceModel.findById(phaseInstanceId).exec()
            if (!phaseInstanceToUpdate) {
                throw new Error(`PhaseInstance does not exist`)
            }

            await phaseInstanceToUpdate.updateOne(data).exec()
        }

        public async deletePhaseInstanceData(phaseInstanceId: string | mongoose.Schema.Types.ObjectId): Promise<void> {
            const phaseInstanceToDelete = await this.phaseInstanceModel.findById(phaseInstanceId).exec()
            if (!phaseInstanceToDelete) {
                throw new Error(`PhaseInstance does not exist`)
            }

            await phaseInstanceToDelete.deleteOne().exec()
        }
    }

    Object.defineProperty(SynthesizedPhaseInstanceService, 'name', {
        value: phaseInstanceServiceInjectionToken(courseData.name, phaseData.name)
    })

    return SynthesizedPhaseInstanceService
}
