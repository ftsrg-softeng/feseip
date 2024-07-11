// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Body, Controller, Delete, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { plainToInstance } from 'class-transformer'
import { AdminAuth } from '@/core/presentation/auth/admin-auth/admin-auth.decorator'
import { LtiService } from '@/core/business/lti/lti.service'
import { PlatformDTO } from '@/core/presentation/platform/dto/platform.dto'
import { CreatePlatformArgs } from '@/core/presentation/platform/dto/create-platform.args'
import { DeletePlatformArgs } from '@/core/presentation/platform/dto/delete-platform.args'

@Controller('/api/admin/platforms')
@ApiTags('admin')
@AdminAuth()
export class PlatformController {
    constructor(private readonly ltiService: LtiService) {}

    @Get('/')
    public async getPlatforms(): Promise<PlatformDTO[]> {
        const platforms = await this.ltiService.listRegisteredPlatforms()
        return plainToInstance(PlatformDTO, platforms, { excludeExtraneousValues: true })
    }

    @Post('/')
    public async addPlatform(@Body() { url, name, clientId }: CreatePlatformArgs) {
        return this.ltiService.registerPlatform(url, name, clientId)
    }

    @Delete('/')
    public async deletePlatform(@Body() { url, clientId }: DeletePlatformArgs) {
        return this.ltiService.deletePlatform(url, clientId)
    }
}
