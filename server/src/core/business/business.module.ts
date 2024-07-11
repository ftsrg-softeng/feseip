// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, forwardRef, Module } from '@nestjs/common'
import { CourseModule } from './course/course.module'
import { CourseData } from '@/decorators/course.decorator'
import { UserModule } from '@/core/business/user/user.module'
import { synthesizeCourseDeclarationModule } from '@/core/business/course/course-declaration.module'
import { synthesizePhaseDeclarationModule } from '@/core/business/phase/phase-declaration.module'
import { PhaseModule } from '@/core/business/phase/phase.module'
import { synthesizeTaskDeclarationModule } from '@/core/business/task/task-declaration.module'
import { TaskModule } from '@/core/business/task/task.module'
import { LtiModule } from '@/core/business/lti/lti.module'
import { LogModule } from '@/core/business/log/log.module'
import { ScheduleModule } from '@/core/business/schedule/schedule.module'
import { ErrorModule } from '@/core/business/error/error.module'

@Module({})
export class BusinessModule {
    static register(courseData: CourseData[], dataModule: DynamicModule): DynamicModule {
        const errorModule = ErrorModule.register(dataModule)
        const logModule = LogModule.register(dataModule)

        const courseModules = [] as DynamicModule[]
        const courseDeclarationModules = []

        const phaseModules = [] as DynamicModule[]
        const phaseDeclarationModules = []

        const taskModules = [] as DynamicModule[]
        const taskDeclarationModules = []

        for (const course of courseData) {
            const courseDependencies = []

            for (const phase of course.phases) {
                const phaseDependencies = []

                for (const task of phase.tasks) {
                    let taskModule: DynamicModule | null = null
                    const taskDeclarationModule = synthesizeTaskDeclarationModule(
                        course,
                        phase,
                        task,
                        forwardRef(() => taskModule),
                        forwardRef(() => userModule)
                    )
                    taskModule = TaskModule.forTask(
                        course,
                        phase,
                        task,
                        taskDeclarationModule,
                        dataModule,
                        errorModule,
                        logModule
                    )
                    taskModules.push(taskModule)
                    taskDeclarationModules.push(taskDeclarationModule)

                    phaseDependencies.push(
                        forwardRef(() => taskModule),
                        taskDeclarationModule
                    )
                    courseDependencies.push(
                        forwardRef(() => taskModule),
                        taskDeclarationModule
                    )
                }

                let phaseModule: DynamicModule | null = null
                const phaseDeclarationModule = synthesizePhaseDeclarationModule(
                    course,
                    phase,
                    forwardRef(() => phaseModule),
                    forwardRef(() => userModule),
                    ...phaseDependencies
                )
                phaseModule = PhaseModule.forPhase(
                    course,
                    phase,
                    phaseDeclarationModule,
                    dataModule,
                    errorModule,
                    logModule
                )
                phaseModules.push(phaseModule)
                phaseDeclarationModules.push(phaseDeclarationModule)

                courseDependencies.push(
                    forwardRef(() => phaseModule),
                    phaseDeclarationModule
                )
            }

            let courseModule: DynamicModule | null = null
            const courseDeclarationModule = synthesizeCourseDeclarationModule(
                course,
                forwardRef(() => courseModule),
                forwardRef(() => userModule),
                ...courseDependencies
            )
            courseModule = CourseModule.forCourse(course, courseDeclarationModule, dataModule, errorModule, logModule)
            courseModules.push(courseModule)
            courseDeclarationModules.push(courseDeclarationModule)
        }

        const courseAdminModule = CourseModule.forCore(courseData, dataModule, courseModules)
        const phaseAdminModule = PhaseModule.forCore(dataModule)
        const taskAdminModule = TaskModule.forCore(dataModule)
        const userModule = UserModule.register(courseAdminModule, dataModule)
        const scheduleModule = ScheduleModule.register(
            courseData,
            courseAdminModule,
            phaseAdminModule,
            taskAdminModule,
            ...courseModules,
            ...phaseModules,
            ...taskModules,
            logModule,
            errorModule,
            dataModule
        )

        return {
            module: BusinessModule,
            imports: [
                dataModule,
                ...courseModules,
                ...courseDeclarationModules,
                courseAdminModule,
                ...phaseModules,
                ...phaseDeclarationModules,
                phaseAdminModule,
                ...taskModules,
                ...taskDeclarationModules,
                taskAdminModule,
                userModule,
                LtiModule,
                logModule,
                scheduleModule,
                errorModule
            ],
            providers: [],
            exports: [
                ...courseModules,
                courseAdminModule,
                ...phaseModules,
                phaseAdminModule,
                ...taskModules,
                taskAdminModule,
                userModule,
                LtiModule,
                logModule,
                scheduleModule,
                errorModule
            ]
        }
    }
}
