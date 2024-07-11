// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import {
    Injectable,
    PipeTransform,
    ArgumentMetadata,
    ExecutionContext,
    ValidationPipe,
    Type,
    UnauthorizedException
} from '@nestjs/common'
import { AuthService } from '../auth.service'

@Injectable()
export class ValidationWithAuthPipe implements PipeTransform<{ context: ExecutionContext; body: any }, any> {
    constructor(private readonly authService: AuthService) {}

    public async transform(value: { context: ExecutionContext; body: any }, metadata: ArgumentMetadata) {
        const { context, body } = value
        const { data } = metadata

        const userRole = await this.authService.getUserRoleForExecutionContext(context)
        if (!userRole) {
            throw new UnauthorizedException()
        }

        const validationPipe = new ValidationPipe({
            expectedType: data as unknown as Type<unknown>,
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
            groups: [userRole]
        })

        return validationPipe.transform(body, metadata)
    }
}
