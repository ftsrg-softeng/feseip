// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import { IAppConfig } from '@/app.config'
import { LtiService } from '@/core/business/lti/lti.service'
import { AuthService } from '@/core/presentation/auth/auth.service'

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService<IAppConfig, true>,
        private readonly ltiService: LtiService,
        private readonly authService: AuthService
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        return (
            (await this.validateCloudflareAuth(context)) ||
            (await this.validateBasicAuth(context)) ||
            (await this.validateLtiAuth(context))
        )
    }

    private async validateBasicAuth(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>()
        const response = context.switchToHttp().getResponse<Response>()

        if (this.configService.get('ADMIN_BASIC_AUTH') === 'off') {
            return false
        }

        const b64auth = (request.headers.authorization || '').split(' ')[1] || ''
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

        if (!login || !password) {
            response.set('WWW-Authenticate', `Basic realm="admin"`)
            return false
        }

        const validationResult =
            login === this.configService.get('ADMIN_BASIC_AUTH_USERNAME') &&
            password === this.configService.get('ADMIN_BASIC_AUTH_PASSWORD')

        if (!validationResult) {
            response.set('WWW-Authenticate', `Basic realm="admin"`)
            return false
        }

        return validationResult
    }

    private async validateCloudflareAuth(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>()

        if (this.configService.get('ADMIN_CLOUDFLARE_AUTH') === 'off') {
            return false
        }

        const token = request.cookies['CF_Authorization']
        if (!token) {
            return false
        }

        const aud = this.configService.get('ADMIN_CLOUDFLARE_AUD')
        const teamDomain = this.configService.get('ADMIN_CLOUDFLARE_TEAM_DOMAIN')

        const client = jwksClient({
            jwksUri: `${teamDomain}/cdn-cgi/access/certs`
        })

        return await new Promise<boolean>((resolve) => {
            jwt.verify(
                token,
                (header, callback) => {
                    client.getSigningKey(header.kid, (err, key) => {
                        callback(err, key?.getPublicKey())
                    })
                },
                { audience: aud },
                (err) => {
                    if (err) resolve(false)
                    else resolve(true)
                }
            )
        })
    }

    private async validateLtiAuth(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>()
        const response = context.switchToHttp().getResponse<Response>()

        if (this.configService.get('ADMIN_LTI_AUTH') === 'off') {
            return false
        }

        const result = await new Promise<boolean>((resolve) => {
            this.ltiService.route(request, response, () => resolve(true))
            setTimeout(() => resolve(false), 1000)
        })

        if (!result) {
            return false
        }

        const isAdmin = await this.authService.getAdminStatusForExecutionContext(context)
        return isAdmin ?? false
    }
}
