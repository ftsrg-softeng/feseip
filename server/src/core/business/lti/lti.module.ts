// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Module } from '@nestjs/common'
import { LtiService } from '@/core/business/lti/lti.service'

@Module({
    providers: [LtiService],
    exports: [LtiService]
})
export class LtiModule {}
