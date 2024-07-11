// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Delete, Get, Param, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CourseData } from '@/decorators/course.decorator'
import {
    synthesizeCourseInstanceDTO,
    synthesizeCourseInstanceWithPhaseAndTaskInstancesDTO
} from '@/core/presentation/course/dto/course-instance.dto'
import { capitalize } from '@/common/capitalize.util'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { CourseInstance } from '@/core/data/schemas/course-instance.schema'
import { ICourseInstanceService, InjectCourseInstanceService } from '@/core/business/course/course-instance.service'
import { plainToInstance } from 'class-transformer'
import { InjectPhaseInstanceService, PhaseInstanceService } from '@/core/business/phase/phase-instance.service'
import { InjectTaskInstanceService, TaskInstanceService } from '@/core/business/task/task-instance.service'
import { getObjectIds } from '@/common/reference-prop.decorator'
import { synthesizeUpdateCourseInstanceArgs } from '@/core/presentation/course/dto/update-course-instance.args'

export function synthesizeCourseInstanceController(courseData: CourseData) {
    const SynthesizedCourseInstanceDTO = synthesizeCourseInstanceDTO(courseData)
    const SynthesizedCourseInstanceWithPhaseAndTaskInstancesDTO =
        synthesizeCourseInstanceWithPhaseAndTaskInstancesDTO(courseData)
    const SynthesizedUpdateCourseInstanceArgs = synthesizeUpdateCourseInstanceArgs(courseData)

    const courseInstanceParamName = 'courseInstanceId'
    const courseParamName = 'courseId'

    @Controller()
    @ApiTags(courseData.name)
    @RoleAuth()
    class SynthesizedCourseInstanceController {
        constructor(
            @InjectCourseInstanceService(courseData.name)
            readonly courseInstanceService: ICourseInstanceService<CourseInstance>,
            @InjectPhaseInstanceService()
            readonly phaseInstanceService: PhaseInstanceService,
            @InjectTaskInstanceService()
            readonly taskInstanceService: TaskInstanceService
        ) {}

        @Get(`/api/course-instances/${courseData.name}/:${courseInstanceParamName}`)
        @Role(UserRole.STUDENT, UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse(
            { status: 200, type: SynthesizedCourseInstanceWithPhaseAndTaskInstancesDTO },
            { overrideExisting: true }
        )
        @RoleContext(RoleContextType.COURSE_INSTANCE, courseInstanceParamName)
        public async getCourseInstanceData(@Param(courseInstanceParamName) id: string) {
            const courseInstance = await this.courseInstanceService.getCourseInstanceData(id)
            if (!courseInstance) {
                throw new Error('Course instance does not exist')
            }

            const phaseInstances = await this.phaseInstanceService.getPhaseInstancesForCourseInstance(
                courseInstance._id
            )
            const taskInstances = await this.taskInstanceService.getTaskInstancesForCourseInstance(courseInstance._id)

            return plainToInstance(
                SynthesizedCourseInstanceWithPhaseAndTaskInstancesDTO,
                {
                    ...(courseData.courseInstanceDocumentToDto?.(courseInstance) ??
                        documentToDto(courseInstance, courseData.courseInstanceDTO)),
                    phaseInstances: phaseInstances
                        .filter((phaseInstance) =>
                            getObjectIds(phaseInstance.courseInstances)?.some(
                                (c) => c.toString() === courseInstance._id.toString()
                            )
                        )
                        .map((phaseInstance) => {
                            const phaseData = courseData.phases.find((p) => p.name === phaseInstance.type)
                            if (!phaseData) return undefined

                            return {
                                ...(phaseData?.phaseInstanceDocumentToDto?.(phaseInstance) ??
                                    documentToDto(phaseInstance, phaseData.phaseInstanceDTO)),
                                taskInstances: taskInstances
                                    .filter((t) =>
                                        getObjectIds(t.phaseInstances)?.some(
                                            (p) => p.toString() === phaseInstance._id.toString()
                                        )
                                    )
                                    .map((taskInstance) => {
                                        const taskData = phaseData.tasks.find((t) => t.name === taskInstance.type)
                                        if (!taskData) return undefined
                                        return (
                                            taskData.taskInstanceDocumentToDto?.(taskInstance) ??
                                            documentToDto(taskInstance, taskData.taskInstanceDTO)
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

        @Get(`/api/courses/${courseData.name}/:${courseParamName}/instances`)
        @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: [SynthesizedCourseInstanceDTO] }, { overrideExisting: true })
        @RoleContext(RoleContextType.COURSE, courseParamName)
        public async getCourseInstanceDataForCourse(@Param(courseParamName) id: string) {
            const courseInstances = (await this.courseInstanceService.getCourseInstancesForCourse(id)).map((ci) => {
                // TODO: Find a better way to do this
                ci.history = []
                return ci
            })
            return courseInstances.map((courseInstance) =>
                plainToInstance(
                    SynthesizedCourseInstanceDTO,
                    courseData.courseInstanceDocumentToDto?.(courseInstance) ??
                        documentToDto(courseInstance, courseData.courseInstanceDTO),
                    { groups: Object.values(UserRole) }
                )
            )
        }

        @Put(`/api/course-instances/${courseData.name}/:${courseInstanceParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedUpdateCourseInstanceArgs })
        @RoleContext(RoleContextType.COURSE_INSTANCE, courseInstanceParamName)
        public async updateCourseInstanceData(
            @Param(courseInstanceParamName) id: string,
            @AuthValidatedBody(SynthesizedUpdateCourseInstanceArgs) data: any
        ) {
            await this.courseInstanceService.updateCourseInstanceData(id, data)
        }

        @Delete(`/api/course-instances/${courseData.name}/:${courseInstanceParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @RoleContext(RoleContextType.COURSE_INSTANCE, courseInstanceParamName)
        public async deleteCourseInstanceData(@Param(courseInstanceParamName) id: string) {
            await this.courseInstanceService.deleteCourseInstanceData(id)
        }
    }

    // Override class name
    Object.defineProperty(SynthesizedCourseInstanceController, 'name', {
        value: `${capitalize(courseData.name)}CourseInstanceController`
    })

    return SynthesizedCourseInstanceController
}
