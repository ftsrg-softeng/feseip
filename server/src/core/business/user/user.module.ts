// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DynamicModule, Module } from '@nestjs/common'
import { UserService } from './user.service'

@Module({})
export class UserModule {
    static register(courseAdminModule: DynamicModule, dataModule: DynamicModule): DynamicModule {
        return {
            module: UserModule,
            imports: [courseAdminModule, dataModule],
            providers: [UserService],
            exports: [UserService]
        }
    }
}
