// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Get } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { UserService } from '@/core/business/user/user.service'
import { documentToDto } from '@/common/schema-to-dto.util'
import { User, UserRole } from '@/core/data/schemas/user.schema'
import { UserDTO } from '@/core/presentation/user/dto/user.dto'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'

@Controller('/api/users')
@RoleAuth()
@RoleContext(RoleContextType.NULL)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('/')
    @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
    @ApiResponse({ status: 200, type: [UserDTO] })
    public async getUsers() {
        const users = await this.userService.getAllUsers()
        return users.map((user) => documentToDto(user as User, UserDTO))
    }
}
