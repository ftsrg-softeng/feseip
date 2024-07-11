// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { CourseData } from '@/decorators/course.decorator'
import { synthesizeCourseController } from '@/core/presentation/course/course.controller'
import { AdminAuthGuard } from '@/core/presentation/auth/admin-auth/admin-auth.guard'
import { RoleAuthGuard } from '@/core/presentation/auth/role-auth/role-auth.guard'
import { SerializationWithAuthInterceptor } from '@/core/presentation/auth/serialization/serialization-with-auth.interceptor'
import { ValidationWithAuthPipe } from '@/core/presentation/auth/serialization/validation-with-auth.pipe'
import { AuthService } from '@/core/presentation/auth/auth.service'
import { synthesizePhaseController } from '@/core/presentation/phase/phase.controller'
import { synthesizeTaskController } from '@/core/presentation/task/task.controller'
import { LtiMiddleware } from '@/core/presentation/lti/lti.middleware'
import { synthesizeCourseAdminController } from '@/core/presentation/course/course-admin.controller'
import { PlatformController } from '@/core/presentation/platform/platform.controller'
import { LtiController } from '@/core/presentation/lti/lti.controller'
import { synthesizeCourseInstanceController } from '@/core/presentation/course/course-instance.controller'
import { synthesizePhaseInstanceController } from '@/core/presentation/phase/phase-instance.controller'
import { synthesizeTaskInstanceController } from '@/core/presentation/task/task-instance.controller'
import { synthesizeActionController } from '@/core/presentation/action/action.controller'
import { synthesizeCourseLogController } from '@/core/presentation/log/log.controller'
import { synthesizeCourseScheduleController } from '@/core/presentation/schedule/schedule.controller'
import { UserAdminController } from '@/core/presentation/user/user-admin.controller'
import { UserController } from '@/core/presentation/user/user.controller'
import { synthesizeAuthController } from '@/core/presentation/auth/auth.controller'
import { synthesizeCourseErrorController } from '@/core/presentation/error/error.controller'

@Module({})
export class PresentationModule implements NestModule {
    static register(courseData: CourseData[], businessModule: DynamicModule): DynamicModule {
        const controllers = []
        const allPublicPaths = [] as string[]

        for (const course of courseData) {
            controllers.push(synthesizeCourseController(course))
            controllers.push(synthesizeCourseInstanceController(course))
            for (const action of course.actions) {
                const [controller, publicPaths] = synthesizeActionController(action, course)
                controllers.push(controller)
                if (publicPaths.length > 0) allPublicPaths.push(...publicPaths)
            }

            for (const phase of course.phases) {
                controllers.push(synthesizePhaseController(course, phase))
                controllers.push(synthesizePhaseInstanceController(course, phase))
                for (const action of phase.actions) {
                    const [controller, publicPaths] = synthesizeActionController(action, course, phase)
                    controllers.push(controller)
                    if (publicPaths.length > 0) allPublicPaths.push(...publicPaths)
                }

                for (const task of phase.tasks) {
                    controllers.push(synthesizeTaskController(course, phase, task))
                    controllers.push(synthesizeTaskInstanceController(course, phase, task))
                    for (const action of task.actions) {
                        const [controller, publicPaths] = synthesizeActionController(action, course, phase, task)
                        controllers.push(controller)
                        if (publicPaths.length > 0) allPublicPaths.push(...publicPaths)
                    }
                }
            }

            controllers.push(synthesizeCourseLogController(course))
            controllers.push(synthesizeCourseScheduleController(course))
            controllers.push(synthesizeCourseErrorController(course))
        }

        return {
            module: PresentationModule,
            imports: [businessModule],
            controllers: [
                synthesizeAuthController(courseData),
                synthesizeCourseAdminController(courseData),
                PlatformController,
                LtiController,
                UserAdminController,
                UserController,
                ...controllers
            ],
            providers: [
                AdminAuthGuard,
                RoleAuthGuard,
                SerializationWithAuthInterceptor,
                ValidationWithAuthPipe,
                AuthService,
                {
                    provide: 'ALL_PUBLIC_PATHS',
                    useValue: allPublicPaths
                }
            ]
        }
    }

    constructor(@Inject('ALL_PUBLIC_PATHS') private readonly allPublicPaths: string[]) {}

    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(LtiMiddleware)
            .exclude(...this.allPublicPaths)
            .forRoutes(
                'lti',
                'api/auth',
                'api/courses',
                'api/course-instances',
                'api/phases',
                'api/phase-instances',
                'api/tasks',
                'api/task-instances',
                'api/actions',
                'api/logs',
                'api/errors',
                'api/schedules',
                'api/users'
            )
    }
}
