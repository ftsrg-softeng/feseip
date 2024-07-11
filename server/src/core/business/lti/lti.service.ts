// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Injectable, Logger, LoggerService } from '@nestjs/common'
import { IdToken, Provider as lti } from 'ltijs'
import { ConfigService } from '@nestjs/config'
import { IAppConfig } from '@/app.config'
import { NextFunction, Request, Response, Router } from 'express'
import * as path from 'node:path'

@Injectable()
export class LtiService {
    protected readonly logger: LoggerService

    constructor(private readonly configService: ConfigService<IAppConfig, true>) {
        this.logger = new Logger(LtiService.name)

        lti.setup(
            this.configService.get('LTI_KEY'),
            {
                url: `mongodb://${this.configService.get('DATABASE_HOST')}:${this.configService.get('DATABASE_PORT')}/${this.configService.get('DATABASE_NAME')}?authSource=admin`,
                connection: {
                    user: this.configService.get('DATABASE_USERNAME'),
                    pass: this.configService.get('DATABASE_PASSWORD')
                }
            },
            {
                cookies: {
                    secure: true,
                    sameSite: 'None'
                },
                cors: true,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                devMode: this.configService.get('ENVIRONMENT') === 'development'
            }
        )

        lti.onConnect((_token: IdToken, _req: Request, _res: Response, next: NextFunction) => {
            return next()
        })

        const router = Router()
        router.all(/.*/, (req, res, next) => {
            next()
        })
        lti.app.use(router)
        lti.deploy({ serverless: true }).then()
    }

    public route(req: Request, res: Response, next: NextFunction): void {
        req.baseUrl = path.join('/', req.baseUrl)
        lti.app(req, res, next)
    }

    public redirect(res: Response, path: string) {
        lti.redirect(res, path)
    }

    public async listRegisteredPlatforms() {
        const platforms = await lti.getAllPlatforms()
        if (platforms === false) {
            return []
        }

        return await Promise.all(
            platforms.map(async (platform) => ({
                url: (await platform.platformUrl()).toString(),
                name: (await platform.platformName()).toString(),
                clientId: (await platform.platformClientId()).toString()
            }))
        )
    }

    public async deletePlatform(url: string, clientId: string) {
        this.logger.log(`Deleting platform with url=${url} and clientId=${clientId}...`)
        const result = await lti.deletePlatform(url, clientId)
        this.logger.log(`Success: ${result}`)
        if (!result) {
            throw new Error(`Could not delete platform with url=${url} and clientId=${clientId}`)
        }
    }

    public async registerPlatform(url: string, name: string, clientId: string) {
        this.logger.log(`Registering platform with url=${url} and clientId=${clientId}...`)
        url = url.replace(/\/$/, '')

        const platform = await lti.registerPlatform({
            url: url,
            name: name,
            clientId: clientId,
            authenticationEndpoint: `${url}/mod/lti/auth.php`,
            accesstokenEndpoint: `${url}/mod/lti/token.php`,
            authConfig: { method: 'JWK_SET', key: `${url}/mod/lti/certs.php` }
        })

        if (platform === false) {
            throw new Error('Unable to register platform with')
        }

        this.logger.log('Registered platform with url=${url} and clientId=${clientId}')
    }
}
