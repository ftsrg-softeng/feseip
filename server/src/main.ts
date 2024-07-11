// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { IAppConfig } from './app.config'
import * as process from 'node:process'
import { ValidationPipe } from '@nestjs/common'
import { generateSwagger } from '@/swagger'
import * as bodyParser from 'body-parser'
import { SoftengExtraCourseDeclaration } from '@/softengExtra/softengExtra.course'

async function bootstrap() {
    const app = await NestFactory.create(AppModule.register(SoftengExtraCourseDeclaration))
    const configService = app.get(ConfigService<IAppConfig, true>)

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }))
    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

    if (process.env.NODE_ENV !== 'production') {
        app.enableCors({ origin: 'http://localhost:5173', credentials: true })
    }

    generateSwagger(app)

    await app.listen(configService.get('PORT'))
}
bootstrap().then()
