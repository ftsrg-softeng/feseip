// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import * as Joi from 'joi'
import { ConfigModule } from '@nestjs/config'

export interface IAppConfig {
    PORT: number

    DATABASE_HOST: string
    DATABASE_PORT: number
    DATABASE_NAME: string
    DATABASE_USERNAME: string
    DATABASE_PASSWORD: string

    ENVIRONMENT: 'production' | 'development'

    LTI_KEY: string
    LTI_REDIRECT_URI: string

    ADMIN_BASIC_AUTH: 'on' | 'off'
    ADMIN_BASIC_AUTH_USERNAME: string
    ADMIN_BASIC_AUTH_PASSWORD: string
    ADMIN_CLOUDFLARE_AUTH: 'on' | 'off'
    ADMIN_CLOUDFLARE_AUD: string
    ADMIN_CLOUDFLARE_TEAM_DOMAIN: string
    ADMIN_LTI_AUTH: 'on' | 'off'

    LOG_DIR: string
}

const AppConfigSchema = Joi.object<IAppConfig, true>({
    PORT: Joi.number().port().default(3000),

    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().port().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USERNAME: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),

    ENVIRONMENT: Joi.string().valid('production', 'development').default('development'),

    LTI_KEY: Joi.string().required(),
    LTI_REDIRECT_URI: Joi.string().required(),

    ADMIN_BASIC_AUTH: Joi.string().valid('on', 'off').default('off'),
    ADMIN_BASIC_AUTH_USERNAME: Joi.string().when('ADMIN_BASIC_AUTH', {
        is: 'on',
        then: Joi.required()
    }),
    ADMIN_BASIC_AUTH_PASSWORD: Joi.string().when('ADMIN_BASIC_AUTH', {
        is: 'on',
        then: Joi.required()
    }),
    ADMIN_CLOUDFLARE_AUTH: Joi.string().valid('on', 'off').default('off'),
    ADMIN_CLOUDFLARE_AUD: Joi.string().when('ADMIN_CLOUDFLARE_AUTH', {
        is: 'on',
        then: Joi.required()
    }),
    ADMIN_CLOUDFLARE_TEAM_DOMAIN: Joi.string().when('ADMIN_CLOUDFLARE_AUTH', {
        is: 'on',
        then: Joi.required()
    }),
    ADMIN_LTI_AUTH: Joi.string().valid('on', 'off').default('off'),
    LOG_DIR: Joi.string().required()
})

export default ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: AppConfigSchema,
    validationOptions: {
        allowUnknown: true
    }
})
