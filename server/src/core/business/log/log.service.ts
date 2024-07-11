// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { Injectable } from '@nestjs/common'
import mongoose, { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { Log, LogDocument, LogType } from '@/core/data/schemas/log.schema'
import { ActionData, getActionName } from '@/decorators/action.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { ConfigService } from '@nestjs/config'
import { IAppConfig } from '@/app.config'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as winston from 'winston'
import { Schedule } from '@/core/data/schemas/schedule.schema'

@Injectable()
export class LogService {
    private readonly logDir: string

    constructor(
        @InjectModel(Log.name) private readonly logModel: Model<Log>,
        private readonly configService: ConfigService<IAppConfig, true>
    ) {
        this.logDir = path.join(__dirname, '../../../..', this.configService.get('LOG_DIR'))
    }

    public async getLogs(courseId: string | mongoose.Schema.Types.ObjectId): Promise<Log[]> {
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        return this.logModel.find({ course: courseId, timestamp: { $gte: threeDaysAgo } }).lean()
    }

    public async getLog(
        courseId: string | mongoose.Schema.Types.ObjectId,
        logId: string | mongoose.Schema.Types.ObjectId,
        streamed?: number
    ) {
        const log = await this.logModel.findOne({ _id: logId, course: courseId }).lean()
        if (!log) {
            throw new Error('Log not found')
        }

        const logPath = path.join(this.logDir, `${log._id.toString()}.log`)

        if (fs.existsSync(logPath)) {
            return fs.createReadStream(logPath, {
                encoding: 'utf8',
                start: streamed ?? 0
            })
        } else {
            return null
        }
    }

    public async createActionLog(
        courseId: string | mongoose.Schema.Types.ObjectId,
        actionData: ActionData,
        courseData: CourseData,
        phaseData?: PhaseData,
        taskData?: TaskData
    ) {
        const log = new this.logModel({
            course: courseId,
            type: LogType.ACTION,
            timestamp: new Date(),
            name: getActionName(actionData, courseData, phaseData, taskData)
        })
        await log.save()
        return [this.createLogger(log), (await this.logModel.findById(log._id).lean())!] as const
    }

    public async createScheduleLog(courseId: string | mongoose.Schema.Types.ObjectId, schedule: Schedule) {
        const log = new this.logModel({
            course: courseId,
            type: LogType.SCHEDULE,
            timestamp: new Date(),
            name: schedule.name
        })
        await log.save()
        return [this.createLogger(log), (await this.logModel.findById(log._id).lean())!] as const
    }

    public async createScheduleActionLog(
        courseId: string | mongoose.Schema.Types.ObjectId,
        actionData: ActionData,
        courseData: CourseData,
        phaseData?: PhaseData,
        taskData?: TaskData
    ) {
        const log = new this.logModel({
            course: courseId,
            type: LogType.ACTION,
            timestamp: new Date(),
            name: getActionName(actionData, courseData, phaseData, taskData)
        })
        await log.save()
        return [
            new winston.transports.File({
                filename: `${log._id.toString()}.log`,
                dirname: this.logDir,
                level: ''
            }),
            (await this.logModel.findById(log._id).lean())!
        ] as const
    }

    private createLogger(log: LogDocument) {
        return winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`
                })
            ),
            transports: [
                new winston.transports.File({
                    filename: `${log._id.toString()}.log`,
                    dirname: this.logDir,
                    level: ''
                }),
                new winston.transports.Console()
            ]
        })
    }
}
