// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Delete, Get, Param } from '@nestjs/common'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { CourseData } from '@/decorators/course.decorator'
import { capitalize } from '@/common/capitalize.util'
import { documentToDto } from '@/common/schema-to-dto.util'
import { ErrorService } from '@/core/business/error/error.service'
import { ErrorDTO } from '@/core/presentation/error/dto/error.dto'

export function synthesizeCourseErrorController(courseData: CourseData) {
    const courseParamName = 'courseId'
    const errorParamName = 'errorId'

    @Controller(`/api/errors/${courseData.name}`)
    @ApiTags(courseData.name)
    @RoleContext(RoleContextType.COURSE, courseParamName)
    @RoleAuth()
    class SynthesizedErrorController {
        constructor(readonly errorService: ErrorService) {}

        @Get(`/:${courseParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: [ErrorDTO] })
        public async getErrors(@Param(courseParamName) courseId: string): Promise<ErrorDTO[]> {
            const errors = await this.errorService.getErrors(courseId)
            return errors.map((error) => documentToDto(error, ErrorDTO))
        }

        @Delete(`/:${courseParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200 })
        public async deleteAllErrors(@Param(courseParamName) courseId: string) {
            await this.errorService.deleteAllErrors(courseId)
        }

        @Delete(`/:${courseParamName}/:${errorParamName}`)
        @Role(UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200 })
        public async deleteError(@Param(courseParamName) courseId: string, @Param(errorParamName) errorId: string) {
            await this.errorService.deleteError(courseId, errorId)
        }
    }

    Object.defineProperty(SynthesizedErrorController, 'name', {
        value: `${capitalize(courseData.name)}ErrorController`
    })

    return SynthesizedErrorController
}
