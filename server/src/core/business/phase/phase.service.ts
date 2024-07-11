// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { PhaseData } from '@/decorators/phase.decorator'
import { capitalize } from '@/common/capitalize.util'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { IPhase } from '@/core/data/interfaces/phase.interface'
import mongoose, { Model } from 'mongoose'
import { Phase } from '@/core/data/schemas/phase.schema'
import { InjectPhaseModel } from '@/core/data/data.module'
import { CourseData } from '@/decorators/course.decorator'

export interface IPhaseService<T extends IPhase = any> {
    getPhaseData(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<T | null>
    getPhasesForCourse(courseId: string | mongoose.Schema.Types.ObjectId): Promise<T[]>
    createPhase(courseId: string | mongoose.Schema.Types.ObjectId, data: Partial<any>): Promise<T>
    updatePhaseData(phaseId: string | mongoose.Schema.Types.ObjectId, data: Partial<T>): Promise<void>
}

export function phaseServiceInjectionToken(): string
export function phaseServiceInjectionToken(courseName: string, phaseName: string): string
export function phaseServiceInjectionToken(courseName?: string, phaseName?: string) {
    if (courseName && phaseName) {
        return `${capitalize(courseName)}${capitalize(phaseName)}PhaseService`
    } else {
        return 'PhaseService'
    }
}

export function InjectPhaseService(): PropertyDecorator & ParameterDecorator
export function InjectPhaseService(courseName: string, phaseName: string): PropertyDecorator & ParameterDecorator
export function InjectPhaseService(courseName?: string, phaseName?: string) {
    if (courseName && phaseName) {
        return Inject(phaseServiceInjectionToken(courseName, phaseName))
    } else {
        return Inject(phaseServiceInjectionToken())
    }
}

@Injectable()
export class PhaseService implements OnModuleInit {
    constructor(@InjectPhaseModel() readonly phaseModel: Model<Phase>) {}

    public async onModuleInit() {
        await this.phaseModel.updateMany({ locked: true }, { locked: false })
    }

    public async getPhaseById(id: string | mongoose.Schema.Types.ObjectId) {
        return this.phaseModel.findById(id).lean()
    }

    public async getPhasesForCourse(courseId: string | mongoose.Schema.Types.ObjectId) {
        return this.phaseModel.find({ course: courseId }).lean()
    }
}

export function synthesizePhaseService(courseData: CourseData, phaseData: PhaseData) {
    @Injectable()
    class SynthesizedPhaseService implements IPhaseService {
        constructor(@InjectPhaseModel(phaseData) readonly phaseModel: Model<Phase>) {}

        public async getPhaseData(phaseId: string | mongoose.Schema.Types.ObjectId): Promise<any | null> {
            const phase = await this.phaseModel.findById(phaseId).lean()
            return phase ?? null
        }

        public async getPhasesForCourse(courseId: string | mongoose.Schema.Types.ObjectId) {
            return this.phaseModel.find({ course: courseId }).lean()
        }

        public async createPhase(courseId: string | mongoose.Schema.Types.ObjectId, data: Partial<any>) {
            const newPhase = new this.phaseModel({ ...data, course: courseId })
            await newPhase.save()

            return this.phaseModel.findById(newPhase._id).lean()
        }

        public async updatePhaseData(
            phaseId: string | mongoose.Schema.Types.ObjectId,
            data: Partial<any>
        ): Promise<void> {
            const phaseToUpdate = await this.phaseModel.findById(phaseId).exec()
            if (!phaseToUpdate) {
                throw new Error(`Phase does not exist`)
            }

            await phaseToUpdate.updateOne(data).exec()
        }
    }

    Object.defineProperty(SynthesizedPhaseService, 'name', {
        value: phaseServiceInjectionToken(courseData.name, phaseData.name)
    })

    return SynthesizedPhaseService
}
