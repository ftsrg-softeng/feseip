// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { UserRole } from '@/core/data/schemas/user.schema'
import { Reflector } from '@nestjs/core'
import { AuthService } from '../auth.service'
import { ROLE_METADATA_KEY } from './role.decorator'

@Injectable()
export class RoleAuthGuard implements CanActivate {
    constructor(
        private readonly authService: AuthService,
        private readonly reflector: Reflector
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const expectedRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLE_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ])
        if (!expectedRoles) {
            return true
        }

        const userRole = await this.authService.getUserRoleForExecutionContext(context)
        if (!userRole) {
            return false
        }

        return expectedRoles.some((expectedRole) => {
            if (expectedRole === UserRole.STUDENT) {
                return userRole === UserRole.STUDENT
            } else if (expectedRole === UserRole.TEACHER) {
                return userRole === UserRole.TEACHER || userRole === UserRole.COURSE_ADMIN
            } else if (expectedRole === UserRole.COURSE_ADMIN) {
                return userRole === UserRole.COURSE_ADMIN
            } else {
                throw new Error('Unknown role')
            }
        })
    }
}
