// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Get, Req, Res, UnauthorizedException } from '@nestjs/common'
import { Request, Response } from 'express'
import { UserService } from '../../business/user/user.service'
import { User, UserRole } from '../../data/schemas/user.schema'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { getObjectId } from '@/common/reference-prop.decorator'
import { CourseService, InjectCourseService } from '@/core/business/course/course.service'
import { AdminAuth } from '@/core/presentation/auth/admin-auth/admin-auth.decorator'
import { documentToDto } from '@/common/schema-to-dto.util'
import { UserDTO } from '@/core/presentation/user/dto/user.dto'
import { CourseInstanceService, InjectCourseInstanceService } from '@/core/business/course/course-instance.service'
import { CourseData } from '@/decorators/course.decorator'
import { synthesizeAuthDTO } from '@/core/presentation/auth/dto/auth.dto'

export function synthesizeAuthController(courseData: CourseData[]) {
    const AuthDTO = synthesizeAuthDTO(courseData)

    @Controller()
    class AuthController {
        constructor(
            readonly userService: UserService,
            @InjectCourseService() readonly courseService: CourseService,
            @InjectCourseInstanceService() readonly courseInstanceService: CourseInstanceService
        ) {}

        @Get('/api/admin/auth')
        @AdminAuth()
        @ApiTags('admin')
        @ApiResponse({ status: 200, type: Object }, { overrideExisting: true })
        public async adminAuth() {
            return { success: true }
        }

        @Get('/api/auth')
        @ApiBearerAuth()
        @ApiResponse({ status: 200, type: AuthDTO }, { overrideExisting: true })
        public async auth(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
            const token = res.locals.token
            if (!token) {
                throw new UnauthorizedException()
            }

            const platformContext = (token as any)['platformContext'] as any
            if (!platformContext) {
                throw new UnauthorizedException()
            }

            const apiKey = platformContext.custom['api-key'] as string | undefined
            if (!apiKey) {
                throw new UnauthorizedException()
            }

            const course = await this.courseService.getCourseByApiKey(apiKey)
            if (!course) {
                throw new UnauthorizedException()
            }

            const moodleId = parseInt(token.user)
            let user = await this.userService.findUserByMoodleId(moodleId)
            if (!user) {
                user = await this.userService.createUser(
                    moodleId,
                    token.userInfo.given_name,
                    token.userInfo.family_name
                )
            }

            const isStudent =
                platformContext.roles?.indexOf('http://purl.imsglobal.org/vocab/lis/v2/membership#Learner') >= 0
            const isTeacher =
                platformContext.roles?.indexOf('http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor') >= 0
            if (!isStudent && !isTeacher) {
                throw new UnauthorizedException()
            }

            const courseInstances = (await this.courseInstanceService.getCourseInstancesForUser(user._id)).filter(
                (courseInstance) => getObjectId(courseInstance.course)!.toString() === course._id.toString()
            )
            if (courseInstances.length === 0 && isStudent) {
                courseInstances.push(
                    await this.courseInstanceService.createCourseInstance(course._id, user._id, platformContext.custom)
                )
            }

            const roles = user.roles?.map((r) => ({ course: getObjectId(r.course)!, role: r.role })) ?? []
            let roleAssignment = roles.find((r) => r.course.toString() === course._id.toString())
            if (!roleAssignment) {
                roleAssignment = { course: course._id, role: isTeacher ? UserRole.TEACHER : UserRole.STUDENT }
                roles.push(roleAssignment)
                await this.userService.updateUser(user._id, user, roles)
            } else if (roleAssignment.role !== UserRole.COURSE_ADMIN) {
                roleAssignment.role = isTeacher ? UserRole.TEACHER : UserRole.STUDENT
                await this.userService.updateUser(user._id, user, roles)
            }

            return instanceToPlain(
                plainToInstance(AuthDTO, {
                    user: documentToDto(user as User, UserDTO),
                    courseId: course._id.toString(),
                    courseType: course.type,
                    courseInstanceIds: courseInstances.map((c) => c._id.toString()),
                    language: platformContext.custom['language'] ?? 'en'
                }),
                {
                    excludeExtraneousValues: true,
                    groups: [roleAssignment.role]
                }
            )
        }
    }

    return AuthController
}
