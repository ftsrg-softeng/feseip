// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Module, Type } from '@nestjs/common'
import AppConfig from './app.config'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '@nestjs/config'
import { getCourseData } from '@/decorators/course.decorator'
import { DataModule } from '@/core/data/data.module'
import { BusinessModule } from '@/core/business/business.module'
import { PresentationModule } from '@/core/presentation/presentation.module'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
    imports: [
        AppConfig,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '../..', 'client/dist')
        }),
        MongooseModule.forRootAsync({
            imports: [AppConfig],
            useFactory: async (configService: ConfigService) => ({
                uri: `mongodb://${configService.get('DATABASE_HOST')}:${configService.get('DATABASE_PORT')}/${configService.get('DATABASE_NAME')}?authSource=admin`,
                user: configService.get('DATABASE_USERNAME'),
                pass: configService.get('DATABASE_PASSWORD')
            }),
            inject: [ConfigService]
        }),
        ScheduleModule.forRoot()
    ]
})
export class AppModule {
    static register(...courses: Type<unknown>[]) {
        const courseData = courses.map(getCourseData)

        const dataModule = DataModule.register(courseData)
        const businessModule = BusinessModule.register(courseData, dataModule)
        const presentationModule = PresentationModule.register(courseData, businessModule)

        return {
            module: AppModule,
            imports: [presentationModule, businessModule, dataModule]
        }
    }
}
