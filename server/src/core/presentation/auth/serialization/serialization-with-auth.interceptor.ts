// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import {
    CallHandler,
    ClassSerializerInterceptor,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    PlainLiteralObject,
    UnauthorizedException
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import { AuthService } from '../auth.service'
import { Reflector } from '@nestjs/core'

@Injectable()
export class SerializationWithAuthInterceptor implements NestInterceptor {
    private readonly classSerializerInterceptor: ClassSerializerInterceptor

    constructor(
        private readonly authService: AuthService,
        reflector: Reflector
    ) {
        this.classSerializerInterceptor = new ClassSerializerInterceptor(reflector)
    }

    public async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const userRole = await this.authService.getUserRoleForExecutionContext(context)
        if (!userRole) {
            throw new UnauthorizedException()
        }

        return next.handle().pipe(
            map((res: PlainLiteralObject | Array<PlainLiteralObject>) => {
                return this.classSerializerInterceptor.serialize(res, {
                    excludeExtraneousValues: true,
                    groups: [userRole]
                })
            })
        )
    }
}
