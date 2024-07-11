// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { applyDecorators, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { RoleAuthGuard } from './role-auth.guard'
import { SerializationWithAuthInterceptor } from '@/core/presentation/auth/serialization/serialization-with-auth.interceptor'

export const RoleAuth = () =>
    applyDecorators(ApiBearerAuth(), UseGuards(RoleAuthGuard), UseInterceptors(SerializationWithAuthInterceptor))
