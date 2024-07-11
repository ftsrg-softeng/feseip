// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Injectable, Logger, LoggerService, NestMiddleware } from '@nestjs/common'
import { LtiService } from '../../business/lti/lti.service'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LtiMiddleware implements NestMiddleware {
    protected readonly logger: LoggerService

    constructor(protected readonly ltiService: LtiService) {
        this.logger = new Logger(LtiMiddleware.name)
    }

    public use(req: Request, res: Response, next: NextFunction): void {
        this.ltiService.route(req, res, next)
    }
}
