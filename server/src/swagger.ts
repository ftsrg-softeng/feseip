// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as fs from 'node:fs'
import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '@/app.module'
import { SoftengExtraCourseDeclaration } from '@/softengExtra/softengExtra.course'

export function generateSwagger(app: INestApplication<any>) {
    const options = new DocumentBuilder()
        .setTitle('API')
        .setDescription('api')
        .setVersion('1.0')
        .addBasicAuth()
        .addBearerAuth()
        .addCookieAuth('CF_Authorization')
        .build()
    const document = SwaggerModule.createDocument(app, options)
    SwaggerModule.setup('swagger', app, document, {
        swaggerOptions: { tryItOutEnabled: true, persistAuthorization: true }
    })
    fs.writeFileSync('./dist/swagger.json', JSON.stringify(document))
}

if (require.main === module) {
    ;(async () => {
        const app = await NestFactory.create(AppModule.register(SoftengExtraCourseDeclaration))
        generateSwagger(app)
        await app.close()
        process.exit(0)
    })().then()
}
