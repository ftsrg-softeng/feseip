// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module, Type } from '@nestjs/common'
import { CourseData } from '@/decorators/course.decorator'
import {
    COURSE_DATA_INJECTION_TOKEN,
    CourseService,
    courseServiceInjectionToken,
    synthesizeCourseService
} from '@/core/business/course/course.service'
import {
    courseActionServiceInjectionToken,
    synthesizeCourseActionService
} from '@/core/business/course/course-action.service'
import {
    CourseInstanceService,
    courseInstanceServiceInjectionToken,
    synthesizeCourseInstanceService
} from '@/core/business/course/course-instance.service'

@Module({})
export class CourseModule {
    static forCourse(
        courseData: CourseData,
        courseDeclarationModule: any,
        dataModule: DynamicModule,
        errorModule: DynamicModule,
        logModule: DynamicModule
    ): DynamicModule {
        const providers = [
            {
                provide: courseServiceInjectionToken(courseData.name),
                useClass: synthesizeCourseService(courseData) as Type<unknown>
            },
            {
                provide: courseInstanceServiceInjectionToken(courseData.name),
                useClass: synthesizeCourseInstanceService(courseData) as Type<unknown>
            }
        ].concat(
            courseData.actions.map((action) => ({
                provide: courseActionServiceInjectionToken(courseData.name, action.name),
                useClass: synthesizeCourseActionService(courseData, action)
            }))
        )
        return {
            module: CourseModule,
            imports: [courseDeclarationModule, errorModule, logModule, dataModule],
            providers: providers,
            exports: providers
        }
    }

    static forCore(courseData: CourseData[], dataModule: DynamicModule, courseModules: DynamicModule[]): DynamicModule {
        const providers = [
            {
                provide: courseServiceInjectionToken(),
                useClass: CourseService
            },
            {
                provide: courseInstanceServiceInjectionToken(),
                useClass: CourseInstanceService
            }
        ]
        return {
            module: CourseModule,
            imports: [dataModule, ...courseModules],
            providers: [...providers, { provide: COURSE_DATA_INJECTION_TOKEN, useValue: courseData }],
            exports: providers
        }
    }
}
