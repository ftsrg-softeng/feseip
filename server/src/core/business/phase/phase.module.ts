// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module, Type } from '@nestjs/common'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { PhaseService, phaseServiceInjectionToken, synthesizePhaseService } from '@/core/business/phase/phase.service'
import {
    PhaseInstanceService,
    phaseInstanceServiceInjectionToken,
    synthesizePhaseInstanceService
} from '@/core/business/phase/phase-instance.service'
import {
    phaseActionServiceInjectionToken,
    synthesizePhaseActionService
} from '@/core/business/phase/phase-action.service'

@Module({})
export class PhaseModule {
    static forPhase(
        courseData: CourseData,
        phaseData: PhaseData,
        phaseDeclarationModule: any,
        dataModule: DynamicModule,
        errorModule: DynamicModule,
        logModule: DynamicModule
    ): DynamicModule {
        const providers = [
            {
                provide: phaseServiceInjectionToken(courseData.name, phaseData.name),
                useClass: synthesizePhaseService(courseData, phaseData) as Type<unknown>
            },
            {
                provide: phaseInstanceServiceInjectionToken(courseData.name, phaseData.name),
                useClass: synthesizePhaseInstanceService(courseData, phaseData)
            }
        ].concat(
            phaseData.actions.map((action) => ({
                provide: phaseActionServiceInjectionToken(courseData.name, phaseData.name, action.name),
                useClass: synthesizePhaseActionService(courseData, phaseData, action)
            }))
        )

        return {
            module: PhaseModule,
            imports: [phaseDeclarationModule, errorModule, logModule, dataModule],
            providers: providers,
            exports: providers
        }
    }

    static forCore(dataModule: DynamicModule): DynamicModule {
        const providers = [
            {
                provide: phaseServiceInjectionToken(),
                useClass: PhaseService
            },
            {
                provide: phaseInstanceServiceInjectionToken(),
                useClass: PhaseInstanceService
            }
        ]

        return {
            module: PhaseModule,
            imports: [dataModule],
            providers: providers,
            exports: providers
        }
    }
}
