// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module } from '@nestjs/common'
import { LogService } from '@/core/business/log/log.service'

@Module({})
export class LogModule {
    static register(dataModule: DynamicModule): DynamicModule {
        return {
            module: LogModule,
            imports: [dataModule],
            providers: [LogService],
            exports: [LogService]
        }
    }
}
