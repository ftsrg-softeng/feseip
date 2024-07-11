// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DeclareCourse } from '@/decorators/course.decorator'
import { SoftengExtraCourseName } from '@/softengExtra/names'
import {
    SoftengExtraCourse,
    SoftengExtraCourseDocument,
    SoftengExtraCourseSchema
} from '@/softengExtra/softengExtra.course.schema'
import { SoftengExtraCourseDTO } from '@/softengExtra/softengExtra.course.dto'
import {
    SoftengExtraCourseInstanceDocument,
    SoftengExtraCourseInstanceLanguage,
    SoftengExtraCourseInstanceSchema,
    SoftengExtraCourseInstanceStatus
} from '@/softengExtra/softengExtra.course-instance.schema'
import { SoftengExtraCourseInstanceDTO } from '@/softengExtra/softengExtra.course-instance.dto'
import {
    Action,
    ActionArguments,
    CurrentCourse,
    CurrentCourseInstance,
    CurrentLogger,
    CurrentRequestResponse,
    InstanceAction
} from '@/decorators/action.decorator'
import { UserRole } from '@/core/data/schemas/user.schema'
import * as winston from 'winston'
import { DTOProperty } from '@/common/dto-property.decorator'
import simpleGit from 'simple-git'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as Twig from 'twig'
import { Queue, QueueEvents, Worker } from 'bullmq'
import { Request, Response } from 'express'
import { Provider as lti } from 'ltijs'
import { UserService } from '@/core/business/user/user.service'
import { getObjectId } from '@/common/reference-prop.decorator'

class InitActionArgs {
    @DTOProperty({ type: String, enum: SoftengExtraCourseInstanceLanguage })
    language?: SoftengExtraCourseInstanceLanguage
}

class SetGithubUsernameArgs {
    @DTOProperty({ type: String, required: true })
    githubUsername: string
}

class SetGithubUsernameDTO {
    @DTOProperty({ type: Boolean, required: true })
    success: boolean
}

class SavePointsArgs {
    @DTOProperty({ type: Number, required: true, nullable: true })
    points: number | null

    @DTOProperty({ type: Number, required: true, nullable: true })
    imscPoints: number | null
}

const personYmlTemplate = `
teams:
- members:
  - github: {{ githubUsername }}
  name: {{ repositoryNamePrefix }}-{{ githubUsername}}

template_repo: 'softeng-base'
`

type GitHubQueue = {
    repositoryRelativePath: string
    repositoryNamePrefix: string
    githubUsername: string
}

@DeclareCourse({
    name: SoftengExtraCourseName,
    phases: [],
    courseSchema: SoftengExtraCourseSchema,
    courseDTO: SoftengExtraCourseDTO,
    courseInstanceSchema: SoftengExtraCourseInstanceSchema,
    courseInstanceDTO: SoftengExtraCourseInstanceDTO
})
export class SoftengExtraCourseDeclaration {
    private readonly githubQueue: Queue<GitHubQueue>
    private readonly githubQueueEvents: QueueEvents
    private readonly githubWorker: Worker<GitHubQueue>

    constructor(private readonly userService: UserService) {
        this.githubQueue = new Queue<GitHubQueue, void>('softeng-extra')
        this.githubQueue.clean(60000, 10000, 'completed').finally()
        this.githubQueueEvents = new QueueEvents('softeng-extra')
        this.githubWorker = new Worker<GitHubQueue, void>(
            'softeng-extra',
            async (job) => {
                const { repositoryRelativePath, repositoryNamePrefix, githubUsername } = job.data
                console.log(`Processing user: ${githubUsername}`)
                try {
                    await this.generateGithubRepository(repositoryRelativePath, repositoryNamePrefix, githubUsername)
                    console.log(`Processed user: ${githubUsername}`)
                } catch (e) {
                    console.error(`Failed to process user: ${githubUsername}`, e)
                    throw new Error(e)
                }
            },
            { concurrency: 1, connection: {} }
        )
        this.githubWorker.on('error', (error) => {
            console.error(error)
        })
    }

    @InstanceAction({ roles: [UserRole.STUDENT, UserRole.COURSE_ADMIN] })
    public async init(
        @ActionArguments(InitActionArgs) args: InitActionArgs,
        @CurrentCourseInstance() courseInstance: SoftengExtraCourseInstanceDocument
    ) {
        courseInstance.creationDate = new Date()
        courseInstance.status = SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME
        courseInstance.language = args.language ?? SoftengExtraCourseInstanceLanguage.HU
        courseInstance.history.push({
            event: `-> ${SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME}`,
            data: {},
            log: null,
            successful: true,
            timestamp: new Date()
        })
        await courseInstance.save()
    }

    @InstanceAction({ roles: [UserRole.STUDENT, UserRole.TEACHER], returnType: SetGithubUsernameDTO })
    public async setGithubUsername(
        @CurrentRequestResponse() [request, response]: [Request, Response],
        @CurrentCourse() course: SoftengExtraCourse,
        @CurrentCourseInstance() courseInstance: SoftengExtraCourseInstanceDocument,
        @CurrentLogger() logger: winston.Logger
    ) {
        const args = request.body as SetGithubUsernameArgs
        if (courseInstance.status !== SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME) {
            response.status(200).send()
            return
        } else if (!course.repositoryPath || !course.repositoryNamePrefix) {
            response.status(400).send('Prerequisites not met')
            return
        } else if (!args.githubUsername) {
            console.log(args)
            response.status(200).send({ success: false })
            return
        }

        try {
            logger.info(`Queueing job: ${args.githubUsername}`)
            const job = await this.githubQueue.add(
                args.githubUsername,
                {
                    repositoryRelativePath: course.repositoryPath,
                    repositoryNamePrefix: course.repositoryNamePrefix,
                    githubUsername: args.githubUsername
                },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 60 * 1000 },
                    removeOnComplete: true,
                    removeOnFail: false
                }
            )

            courseInstance.githubUsername = args.githubUsername
            courseInstance.status = SoftengExtraCourseInstanceStatus.DONE
            courseInstance.completionDate = new Date()
            courseInstance.history.push({
                event: `-> ${SoftengExtraCourseInstanceStatus.DONE}`,
                data: {},
                log: null,
                successful: true,
                timestamp: new Date()
            })
            await courseInstance.save()

            response.status(200).send({ success: true })

            await job.waitUntilFinished(this.githubQueueEvents)
            logger.info(`Job processed: ${args.githubUsername}`)
        } catch (e) {
            response.status(500).send('Error')
        }
    }

    @InstanceAction({ roles: [UserRole.STUDENT, UserRole.TEACHER] })
    public async resetGithubUsername(
        _: never,
        @CurrentCourseInstance() courseInstance: SoftengExtraCourseInstanceDocument
    ) {
        courseInstance.githubUsername = null
        courseInstance.status = SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME
        courseInstance.completionDate = null
        courseInstance.history.push({
            event: `-> ${SoftengExtraCourseInstanceStatus.WAITING_FOR_GITHUB_USERNAME}`,
            data: {},
            log: null,
            successful: true,
            timestamp: new Date()
        })
        await courseInstance.save()
    }

    @InstanceAction({ roles: [UserRole.COURSE_ADMIN] })
    public async doGenerateGithubRepository(
        _: never,
        @CurrentCourse() course: SoftengExtraCourse,
        @CurrentCourseInstance() courseInstance: SoftengExtraCourseInstanceDocument,
        @CurrentLogger() logger: winston.Logger
    ) {
        if (courseInstance.status !== SoftengExtraCourseInstanceStatus.DONE) {
            logger.info('skip')
            return
        } else if (!course.repositoryPath || !course.repositoryNamePrefix || !courseInstance.githubUsername) {
            throw new Error('Prerequisites not met')
        }

        logger.info(`Queueing job: ${courseInstance.githubUsername}`)
        const job = await this.githubQueue.add(
            courseInstance.githubUsername,
            {
                repositoryRelativePath: course.repositoryPath,
                repositoryNamePrefix: course.repositoryNamePrefix,
                githubUsername: courseInstance.githubUsername
            },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 60 * 1000 },
                removeOnComplete: true,
                removeOnFail: false
            }
        )

        await job.waitUntilFinished(this.githubQueueEvents)
        logger.info(`Job processed: ${courseInstance.githubUsername}`)
    }

    private async generateGithubRepository(
        repositoryRelativePath: string,
        repositoryNamePrefix: string,
        githubUsername: string
    ) {
        const repositoryPath = path.join(__dirname, '../../..', repositoryRelativePath)
        const gitClient = simpleGit(repositoryPath)

        await fs.promises.writeFile(
            path.join(repositoryPath, 'person.yml'),
            Twig.twig({ data: personYmlTemplate }).render({
                repositoryNamePrefix: repositoryNamePrefix,
                githubUsername: githubUsername
            })
        )

        await gitClient.add('person.yml')
        await gitClient.commit(`Generate repository for ${githubUsername}`)
        await gitClient.push()
    }

    @Action({ roles: [UserRole.COURSE_ADMIN] })
    public async createLineItems(
        @CurrentRequestResponse() [, response]: [Request, Response],
        @CurrentCourse() course: SoftengExtraCourseDocument,
        @CurrentLogger() logger: winston.Logger
    ) {
        const token = response.locals.token
        const platformContext = (token as any)['platformContext'] as any
        const gradeService = lti.Grade as any

        try {
            logger.info('Creating line items')

            const pointLineItem = await gradeService.createLineItem(token, {
                scoreMaximum: 5,
                label: 'Pontszám',
                tag: 'grade',
                resourceLinkId: platformContext.resource.id
            })
            logger.info(`Point line item created: ${pointLineItem.id}`)

            const imscPointLineItem = await gradeService.createLineItem(token, {
                scoreMaximum: 5,
                label: 'IMSc pontszám',
                tag: 'grade',
                resourceLinkId: platformContext.resource.id
            })
            logger.info(`IMSc point line item created: ${imscPointLineItem.id}`)

            await course.save()

            response.status(200).send()
        } catch (e) {
            logger.error(e.stack)
            response.status(400).send()
        }
    }

    @InstanceAction({ roles: [UserRole.TEACHER] })
    public async savePoints(
        @ActionArguments(SavePointsArgs) { points, imscPoints }: SavePointsArgs,
        @CurrentCourse() course: SoftengExtraCourse,
        @CurrentCourseInstance() courseInstance: SoftengExtraCourseInstanceDocument
    ) {
        const gradeService = lti.Grade as any

        const platformIss = course.platformIss?.[courseInstance.language]
        const platformClientId = course.platformClientId?.[courseInstance.language]
        const pointsLineId = course.pointsLineIds?.[courseInstance.language]
        const imscPointsLineId = course.imscPointsLineIds?.[courseInstance.language]

        if (!platformIss || !platformClientId || !pointsLineId || !imscPointsLineId) {
            throw new Error('Prerequisites not met')
        }

        const token = { iss: platformIss, clientId: platformClientId }

        const user = await this.userService.findUserById(getObjectId(courseInstance.user)!)
        if (!user) {
            throw new Error('User not found')
        }

        if (typeof points === 'number') {
            courseInstance.points = points
            await gradeService.submitScore(token, pointsLineId, {
                userId: user.moodleId,
                scoreGiven: points,
                scoreMaximum: 5,
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            })
        }
        if (typeof imscPoints === 'number') {
            courseInstance.imscPoints = imscPoints
            await gradeService.submitScore(token, imscPointsLineId, {
                userId: user.moodleId,
                scoreGiven: imscPoints,
                scoreMaximum: 5,
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            })
        }

        await courseInstance.save()
    }

    @InstanceAction({ roles: [UserRole.COURSE_ADMIN] })
    public async setDefaultLanguage(
        _: never,
        @CurrentCourseInstance() courseInstance: SoftengExtraCourseInstanceDocument
    ) {
        courseInstance.language = SoftengExtraCourseInstanceLanguage.HU
        await courseInstance.save()
    }
}
