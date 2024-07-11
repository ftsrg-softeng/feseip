// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { UserRole } from '@/core/data/schemas/user.schema'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { UserDTO } from '@/core/presentation/user/dto/user.dto'
import { Allow } from 'class-validator'

class RoleArgs {
    @Allow()
    course: string

    @Allow()
    role: UserRole
}

export class UpdateUserArgs extends OmitType(UserDTO, ['_id', 'moodleId', 'roles']) {
    @ApiProperty({
        type: 'array',
        items: {
            type: 'object',
            properties: { course: { type: 'string' }, role: { type: 'string', enum: Object.values(UserRole) } },
            required: ['course', 'role']
        }
    })
    @Allow()
    roles: RoleArgs[]
}
