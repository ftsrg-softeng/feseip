// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { All, Controller, Res } from '@nestjs/common'
import { LtiService } from '@/core/business/lti/lti.service'
import { ConfigService } from '@nestjs/config'
import { IAppConfig } from '@/app.config'
import { Response } from 'express'
import { ApiBearerAuth } from '@nestjs/swagger'

@Controller('/lti')
export class LtiController {
    constructor(
        private readonly ltiService: LtiService,
        private readonly configService: ConfigService<IAppConfig, true>
    ) {}

    @All('*')
    @ApiBearerAuth()
    public get(@Res() response: Response) {
        this.ltiService.redirect(response, this.configService.get('LTI_REDIRECT_URI'))
    }
}
