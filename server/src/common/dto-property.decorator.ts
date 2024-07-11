// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ApiPropertyOptions } from '@nestjs/swagger/dist/decorators/api-property.decorator'
import { applyDecorators } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { Allow, IsBoolean, IsDate, IsNumber, IsString } from 'class-validator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

function typeDecorators(schema: ApiPropertyOptions | SchemaObject, each?: boolean): any {
    if (schema.type === 'string' && schema.format === 'date-time') {
        return [Type(() => Date), IsDate({ each })]
    } else if (schema.type === 'string') {
        return [Type(() => String), IsString({ each })]
    } else if (schema.type === 'number') {
        return [Type(() => Number), IsNumber({}, { each })]
    } else if (schema.type === 'boolean') {
        return [Type(() => Boolean), IsBoolean({ each })]
    } else if (schema.type === 'array' && schema.items) {
        return [...typeDecorators(schema.items as SchemaObject, true)]
    } else if (schema.type === 'object' && schema.properties) {
        return [Allow]
    } else {
        return [Allow]
    }
}

export function DTOProperty(options?: ApiPropertyOptions, ...roles: UserRole[]) {
    const decorators = [ApiProperty(options), Expose(roles.length > 0 ? { groups: roles } : {}), Allow()]
    if (options) {
        decorators.push(...typeDecorators(options))
    }
    return applyDecorators(...decorators)
}
