// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module } from '@nestjs/common'
import { ErrorService } from '@/core/business/error/error.service'

@Module({})
export class ErrorModule {
    static register(dataModule: DynamicModule): DynamicModule {
        return {
            module: ErrorModule,
            imports: [dataModule],
            providers: [ErrorService],
            exports: [ErrorService]
        }
    }
}
