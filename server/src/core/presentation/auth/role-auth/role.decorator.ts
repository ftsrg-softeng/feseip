// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { UserRole } from '@/core/data/schemas/user.schema'
import { SetMetadata } from '@nestjs/common'

export const ROLE_METADATA_KEY = 'role'
export const Role = (...roles: UserRole[]) => SetMetadata(ROLE_METADATA_KEY, roles)
