// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { AdminAuth } from '../auth/admin-auth/admin-auth.decorator'
import { CourseDTO } from '@/core/presentation/course/dto/course.dto'
import { CreateCourseArgs, synthesizeCreateCourseArgs } from '@/core/presentation/course/dto/create-course.args'
import { UpdateCourseArgs } from '@/core/presentation/course/dto/update-course.args'
import { documentToDto } from '@/common/schema-to-dto.util'
import { CourseService, InjectCourseService } from '@/core/business/course/course.service'
import { CourseData } from '@/decorators/course.decorator'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'

export function synthesizeCourseAdminController(courseData: CourseData[]) {
    const SynthesizedCreateCourseArgs = synthesizeCreateCourseArgs(courseData)

    @Controller()
    class CourseAdminController {
        constructor(@InjectCourseService() readonly courseService: CourseService) {}

        @Get('/api/courses/:courseId')
        @RoleAuth()
        @RoleContext(RoleContextType.NULL)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        public async getCourse(@Param('courseId') id: string): Promise<CourseDTO> {
            const course = await this.courseService.getCourseById(id)
            return documentToDto(course, CourseDTO)
        }

        @Get('/api/admin/courses')
        @ApiTags('admin')
        @AdminAuth()
        public async getCourses(): Promise<CourseDTO[]> {
            const courses = await this.courseService.getAllCourses()
            return courses.map((course) => documentToDto(course, CourseDTO))
        }

        @Post('/api/admin/courses')
        @ApiTags('admin')
        @AdminAuth()
        @ApiBody({ type: SynthesizedCreateCourseArgs })
        public async createCourse(@Body() args: CreateCourseArgs) {
            await this.courseService.createCourse(args)
        }

        @Put('/api/admin/courses/:courseId')
        @ApiTags('admin')
        @AdminAuth()
        public async updateCourse(@Param('courseId') id: string, @Body() args: UpdateCourseArgs) {
            await this.courseService.updateCourse(id, args)
        }

        @Delete('/api/admin/courses/:courseId')
        @ApiTags('admin')
        @AdminAuth()
        public async deleteCourse(@Param('courseId') id: string) {
            await this.courseService.deleteCourse(id)
        }
    }

    return CourseAdminController
}
