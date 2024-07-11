// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Controller, Get, Param, Res, Sse } from '@nestjs/common'
import { RoleAuth } from '@/core/presentation/auth/role-auth/role-auth.decorator'
import { RoleContext, RoleContextType } from '@/core/presentation/auth/role-auth/role-context.decorator'
import { LogService } from '@/core/business/log/log.service'
import { Observable } from 'rxjs'
import { Response } from 'express'
import { Role } from '@/core/presentation/auth/role-auth/role.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { CourseData } from '@/decorators/course.decorator'
import { capitalize } from '@/common/capitalize.util'
import { LogDTO } from '@/core/presentation/log/dto/log.dto'
import { documentToDto } from '@/common/schema-to-dto.util'
import * as readline from 'node:readline'

export function synthesizeCourseLogController(courseData: CourseData) {
    const courseParamName = 'courseId'

    @Controller(`/api/logs/${courseData.name}`)
    @ApiTags(courseData.name)
    @RoleAuth()
    @RoleContext(RoleContextType.COURSE, courseParamName)
    class SynthesizedLogController {
        constructor(readonly logService: LogService) {}

        @Get(`/:${courseParamName}`)
        @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({ status: 200, type: [LogDTO] })
        public async getLogs(@Param(courseParamName) courseId: string): Promise<LogDTO[]> {
            const logs = await this.logService.getLogs(courseId)
            return logs.map((log) => documentToDto(log, LogDTO))
        }

        @Sse(`/:${courseParamName}/:logId`)
        @Role(UserRole.TEACHER, UserRole.COURSE_ADMIN)
        @ApiResponse({
            status: 200,
            content: { 'text/event-stream': { schema: { type: 'string' } } }
        })
        public async getLog(
            @Param(courseParamName) courseId: string,
            @Param('logId') logId: string,
            @Res({ passthrough: true }) response: Response
        ): Promise<Observable<string>> {
            const starterStream = await this.logService.getLog(courseId, logId, 0)

            return new Observable<string>((subscriber) => {
                if (!starterStream) {
                    subscriber.complete()
                    return
                }

                let timeoutId: NodeJS.Timeout | null = null
                let streamed = 0

                const rl = readline.createInterface({
                    input: starterStream,
                    crlfDelay: Infinity
                })

                rl.on('line', (line) => {
                    subscriber.next(line + '\n')
                })

                const readLog = async () => {
                    timeoutId = setTimeout(readLog, 1000)
                    return this.logService.getLog(courseId, logId, streamed).then((stream) => {
                        const chunks: any[] = []
                        if (!stream) {
                            subscriber.complete()
                        }
                        return new Promise((resolve, reject) => {
                            stream!.on('data', (chunk) => {
                                streamed += chunk.length
                                chunks.push(Buffer.from(chunk))
                            })
                            stream!.on('error', (err) => reject(err))
                            stream!.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
                        })
                            .then((s) => {
                                subscriber.next(s as string)
                            })
                            .catch((e) => {
                                subscriber.error(e.toString())
                            })
                    })
                }

                rl.on('close', () => {
                    streamed = starterStream.bytesRead
                    readLog()
                })

                response.on('close', () => {
                    clearTimeout(timeoutId!)
                    subscriber.complete()
                })
            })
        }
    }

    Object.defineProperty(SynthesizedLogController, 'name', {
        value: `${capitalize(courseData.name)}LogController`
    })

    return SynthesizedLogController
}
