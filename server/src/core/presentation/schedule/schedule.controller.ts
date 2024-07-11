// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { ScheduleService } from '@/core/business/schedule/schedule.service'
import { capitalize } from '@/common/capitalize.util'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { documentToDto } from '@/common/schema-to-dto.util'
import { Schedule } from '@/core/data/schemas/schedule.schema'
import { AuthValidatedBody } from '@/core/presentation/auth/serialization/auth-validated-body.decorator'
import { ActionEntry, synthesizeScheduleDTO } from '@/core/presentation/schedule/dto/schedule.dto'
import { synthesizeScheduleArgs } from '@/core/presentation/schedule/dto/schedule.args'

export function synthesizeCourseScheduleController(courseData: CourseData) {
    const actions: ActionEntry[] = []

    for (const action of courseData.actions) {
        actions.push({ course: courseData, action: action })
    }
    for (const phase of courseData.phases) {
        for (const action of phase.actions) {
            actions.push({ course: courseData, phase: phase, action: action })
        }
        for (const task of phase.tasks) {
            for (const action of task.actions) {
                actions.push({ course: courseData, phase: phase, task: task, action: action })
            }
        }
    }

    const SynthesizedScheduleDTO = synthesizeScheduleDTO(courseData, actions)
    const SynthesizedScheduleArgs = synthesizeScheduleArgs(courseData, SynthesizedScheduleDTO)

    const courseParamName = 'courseId'

    @Controller(`/api/schedules/${courseData.name}`)
    @ApiTags(courseData.name)
    @RoleAuth()
    @RoleContext(RoleContextType.COURSE, courseParamName)
    class SynthesizedScheduleController {
        constructor(readonly scheduleService: ScheduleService) {}

        @Get(`/:${courseParamName}`)
        @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: [SynthesizedScheduleDTO] })
        public async getSchedules(@Param(courseParamName) courseId: string) {
            const schedules = await this.scheduleService.getSchedulesForCourse(courseId)
            return schedules.map((schedule) => documentToDto(schedule as Schedule, SynthesizedScheduleDTO))
        }

        @Post(`/:${courseParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedScheduleArgs })
        public async createSchedule(
            @Param(courseParamName) courseId: string,
            @AuthValidatedBody(SynthesizedScheduleArgs) args: any
        ) {
            await this.scheduleService.createSchedule(courseId, args)
        }

        @Put(`/:${courseParamName}/:scheduleId`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiBody({ type: SynthesizedScheduleArgs })
        public async updateSchedule(
            @Param(courseParamName) courseId: string,
            @Param('scheduleId') scheduleId: string,
            @AuthValidatedBody(SynthesizedScheduleArgs) args: any
        ) {
            await this.scheduleService.updateSchedule(courseId, scheduleId, args)
        }

        @Delete(`/:${courseParamName}/:scheduleId`)
        @Role(UserRole.COURSE_ADMIN)
        public async deleteSchedule(@Param(courseParamName) courseId: string, @Param('scheduleId') scheduleId: string) {
            await this.scheduleService.deleteSchedule(courseId, scheduleId)
        }
    }

    Object.defineProperty(SynthesizedScheduleController, 'name', {
        value: `${capitalize(courseData.name)}ScheduleController`
    })

    return SynthesizedScheduleController
}
