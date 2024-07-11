// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module } from '@nestjs/common'
import { COURSE_DATA_INJECTION_TOKEN, ScheduleService } from '@/core/business/schedule/schedule.service'
import { CourseData } from '@/decorators/course.decorator'

@Module({})
export class ScheduleModule {
    static register(courseData: CourseData[], ...dependencies: DynamicModule[]): DynamicModule {
        return {
            module: ScheduleModule,
            imports: [...dependencies],
            providers: [ScheduleService, { provide: COURSE_DATA_INJECTION_TOKEN, useValue: courseData }],
            exports: [ScheduleService]
        }
    }
}
