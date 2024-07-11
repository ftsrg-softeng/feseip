// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Injectable } from '@nestjs/common'
import { User, UserRole } from '../../data/schemas/user.schema'
import mongoose, { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { CourseService, InjectCourseService } from '@/core/business/course/course.service'

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectCourseService() private readonly courseService: CourseService
    ) {}

    public async findUserByMoodleId(moodleId: number) {
        const user = await this.userModel.findOne({ moodleId: moodleId }).lean()
        if (!user) {
            return null
        }
        return user
    }

    public async findUserById(id: string | mongoose.Schema.Types.ObjectId) {
        const user = await this.userModel.findById(id).lean()
        if (!user) {
            return null
        }
        return user
    }

    public async getAllUsers() {
        return this.userModel.find().lean()
    }

    public async createUser(moodleId: number, givenName: string, familyName: string) {
        const user = new this.userModel({
            moodleId,
            givenName,
            familyName,
            roles: [],
            isAdmin: false
        })
        await user.save()
        const newUser = await this.userModel.findById(user._id).lean()
        return newUser!
    }

    public async updateUser(
        id: string | mongoose.Schema.Types.ObjectId,
        data: Partial<User>,
        roles: { course: string | mongoose.Schema.Types.ObjectId; role: UserRole }[]
    ) {
        const user = await this.userModel.findById(id).exec()
        if (!user) {
            throw new Error('User not found')
        }

        data.roles = await Promise.all(
            roles.map(async (role) => ({
                course: (await this.courseService.getCourseById(role.course))._id,
                role: role.role
            }))
        )

        await user.updateOne(data).exec()
    }

    public async deleteUser(id: string | mongoose.Schema.Types.ObjectId) {
        const user = await this.userModel.findById(id).exec()
        if (!user) {
            throw new Error('User not found')
        }

        await user.deleteOne()
    }
}
