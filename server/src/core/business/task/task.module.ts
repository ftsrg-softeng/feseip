// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module, Type } from '@nestjs/common'
import { CourseData } from '@/decorators/course.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { taskServiceInjectionToken, synthesizeTaskService, TaskService } from '@/core/business/task/task.service'
import { PhaseData } from '@/decorators/phase.decorator'
import {
    synthesizeTaskInstanceService,
    TaskInstanceService,
    taskInstanceServiceInjectionToken
} from '@/core/business/task/task-instance.service'
import { synthesizeTaskActionService, taskActionServiceInjectionToken } from '@/core/business/task/task-action.service'

@Module({})
export class TaskModule {
    static forTask(
        courseData: CourseData,
        phaseData: PhaseData,
        taskData: TaskData,
        taskDeclarationModule: any,
        dataModule: DynamicModule,
        errorModule: DynamicModule,
        logModule: DynamicModule
    ): DynamicModule {
        const providers = [
            {
                provide: taskServiceInjectionToken(courseData.name, phaseData.name, taskData.name),
                useClass: synthesizeTaskService(courseData, phaseData, taskData) as Type<unknown>
            },
            {
                provide: taskInstanceServiceInjectionToken(courseData.name, phaseData.name, taskData.name),
                useClass: synthesizeTaskInstanceService(courseData, phaseData, taskData) as Type<unknown>
            }
        ].concat(
            taskData.actions.map((action) => ({
                provide: taskActionServiceInjectionToken(courseData.name, phaseData.name, taskData.name, action.name),
                useClass: synthesizeTaskActionService(courseData, phaseData, taskData, action)
            }))
        )

        return {
            module: TaskModule,
            imports: [taskDeclarationModule, errorModule, logModule, dataModule],
            providers: providers,
            exports: providers
        }
    }

    static forCore(dataModule: DynamicModule): DynamicModule {
        const providers = [
            {
                provide: taskServiceInjectionToken(),
                useClass: TaskService
            },
            {
                provide: taskInstanceServiceInjectionToken(),
                useClass: TaskInstanceService
            }
        ]

        return {
            module: TaskModule,
            imports: [dataModule],
            providers: providers,
            exports: providers
        }
    }
}
