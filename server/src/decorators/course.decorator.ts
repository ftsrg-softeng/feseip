// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { applyDecorators, Injectable, SetMetadata, Type } from '@nestjs/common'
import mongoose, { HydratedDocument } from 'mongoose'
import { getPhaseData, PhaseData } from './phase.decorator'
import { ActionData, getActionsMetadata } from './action.decorator'
import { ICourseInstance } from '@/core/data/interfaces/course-instance.interface'
import { ICourse } from '@/core/data/interfaces/course.interface'
import { SchemaToDtoType } from '@/common/schema-to-dto.util'

export type CourseProps<
    CSchema extends ICourse = ICourse,
    CISchema extends ICourseInstance = ICourseInstance,
    CDTO = SchemaToDtoType<CSchema>,
    CIDTO = SchemaToDtoType<CISchema>
> = {
    name: string

    phases: Type<unknown>[]

    courseSchema: mongoose.Schema<CSchema>
    courseDTO: Type<CDTO>
    courseDocumentToDto?: (document: CSchema | HydratedDocument<CSchema>) => CDTO

    courseInstanceSchema: mongoose.Schema<CISchema>
    courseInstanceDTO: Type<CIDTO>
    courseInstanceDocumentToDto?: (document: CISchema | HydratedDocument<CISchema>) => CIDTO
}

export type CourseData = Omit<CourseProps, 'phases'> & {
    phases: PhaseData[]
    target: Type<unknown>
    actions: ActionData[]
}

const COURSE_METADATA_KEY = 'course'

export const DeclareCourse = <CSchema extends ICourse, CISchema extends ICourseInstance, CDTO, CIDTO>(
    courseData: CourseProps<CSchema, CISchema, CDTO, CIDTO>
) => applyDecorators(Injectable(), SetMetadata(COURSE_METADATA_KEY, courseData))

export function getCourseData(course: Type<unknown>): CourseData {
    const courseData = Reflect.getMetadata(COURSE_METADATA_KEY, course) as CourseProps | undefined
    if (!courseData) {
        throw new Error(`Course must be annotated with @${DeclareCourse.name}`)
    }
    return {
        ...courseData,
        phases: courseData.phases.map(getPhaseData),
        target: course,
        actions: getActionsMetadata(course)
    }
}
