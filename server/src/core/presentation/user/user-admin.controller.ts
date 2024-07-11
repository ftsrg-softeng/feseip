// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { AdminAuth } from '@/core/presentation/auth/admin-auth/admin-auth.decorator'
import { UserService } from '@/core/business/user/user.service'
import { documentToDto } from '@/common/schema-to-dto.util'
import { UserDTO } from '@/core/presentation/user/dto/user.dto'
import { User } from '@/core/data/schemas/user.schema'
import { UpdateUserArgs } from '@/core/presentation/user/dto/update-user.args'

@Controller('/api/admin/users')
@ApiTags('admin')
@AdminAuth()
export class UserAdminController {
    constructor(private readonly userService: UserService) {}

    @Get('/')
    @ApiResponse({ status: 200, type: [UserDTO] })
    public async getUsers() {
        const users = await this.userService.getAllUsers()
        return users.map((user) => documentToDto(user as User, UserDTO))
    }

    @Put('/:userId')
    public async updateUser(@Param('userId') id: string, @Body() args: UpdateUserArgs) {
        await this.userService.updateUser(id, { ...args, roles: undefined }, args.roles)
    }

    @Delete('/:userId')
    public async deleteUser(@Param('userId') id: string) {
        await this.userService.deleteUser(id)
    }
}
