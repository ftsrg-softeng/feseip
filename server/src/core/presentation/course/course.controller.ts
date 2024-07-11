// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Get, Param, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CourseData } from '@/decorators/course.decorator'
import { synthesizeCourseDTO } from '@/core/presentation/course/dto/course.dto'
import { capitalize } from '@/common/capitalize.util'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Course } from '@/core/data/schemas/course.schema'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { ICourseService, InjectCourseService } from '@/core/business/course/course.service'
import { InjectPhaseService, PhaseService } from '@/core/business/phase/phase.service'
import { InjectTaskService, TaskService } from '@/core/business/task/task.service'
import { getObjectId } from '@/common/reference-prop.decorator'
import { plainToInstance } from 'class-transformer'
import { synthesizeUpdateCourseArgs } from '@/core/presentation/course/dto/update-course.args'

export function synthesizeCourseController(courseData: CourseData) {
    const SynthesizedCourseDTO = synthesizeCourseDTO(courseData)
    const SynthesizedUpdateCourseArgs = synthesizeUpdateCourseArgs(courseData)

    const courseParamName = 'courseId'

    @Controller(`/api/courses/${courseData.name}`)
    @ApiTags(courseData.name)
    @RoleAuth()
    @RoleContext(RoleContextType.COURSE, courseParamName)
    class SynthesizedCourseController {
        constructor(
            @InjectCourseService(courseData.name)
            readonly courseService: ICourseService<Course>,
            @InjectPhaseService() readonly phaseService: PhaseService,
            @InjectTaskService() readonly taskService: TaskService
        ) {}

        @Get(`/:${courseParamName}`)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: SynthesizedCourseDTO }, { overrideExisting: true })
        public async getCourseData(@Param(courseParamName) id: string) {
            const course = await this.courseService.getCourseData(id)
            if (!course) {
                throw new Error('Course does not exist')
            }
            // TODO: Find a better way to do this
            course.history = []

            // TODO: Find a better way to do this
            const phases = (await this.phaseService.getPhasesForCourse(course._id)).map((phase) => {
                phase.history = []
                return phase
            })
            // TODO: Find a better way to do this
            const tasks = (await this.taskService.getTasksForCourse(course._id)).map((task) => {
                task.history = []
                return task
            })

            return plainToInstance(
                SynthesizedCourseDTO,
                {
                    ...(courseData.courseDocumentToDto?.(course) ?? documentToDto(course, courseData.courseDTO)),
                    phases: phases
                        .map((phase) => {
                            const phaseData = courseData.phases.find((p) => p.name === phase.type)
                            if (!phaseData) return undefined
                            return {
                                ...(phaseData?.phaseDocumentToDto?.(phase) ?? documentToDto(phase, phaseData.phaseDTO)),
                                tasks: tasks
                                    .filter((t) => getObjectId(t.phase)?.toString() === phase._id.toString())
                                    .map((task) => {
                                        const taskData = phaseData.tasks.find((t) => t.name === task.type)
                                        if (!taskData) return undefined
                                        return (
                                            taskData.taskDocumentToDto?.(task) ?? documentToDto(task, taskData.taskDTO)
                                        )
                                    })
                                    .filter((t) => t !== undefined)
                            }
                        })
                        .filter((p) => p !== undefined)
                },
                { groups: Object.values(UserRole) }
            )
        }

        @Put(`/:${courseParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedUpdateCourseArgs })
        public async updateCourseData(
            @Param(courseParamName) id: string,
            @AuthValidatedBody(SynthesizedUpdateCourseArgs) data: any
        ) {
            await this.courseService.updateCourseData(id, data)
        }
    }

    // Override class name
    Object.defineProperty(SynthesizedCourseController, 'name', {
        value: `${capitalize(courseData.name)}CourseController`
    })

    return SynthesizedCourseController
}
