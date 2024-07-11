// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { createParamDecorator, ExecutionContext, Type } from '@nestjs/common'
import { Request } from 'express'
import { ValidationWithAuthPipe } from './validation-with-auth.pipe'

const helper = createParamDecorator(async (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>()
    return { context, body: request.body }
})

export const AuthValidatedBody = (type: Type<unknown>) => helper(type, ValidationWithAuthPipe)
