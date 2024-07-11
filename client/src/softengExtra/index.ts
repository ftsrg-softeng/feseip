// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { registerCourseTableContent } from '@/components/course/CourseTable'
import { lazy } from 'react'
import { registerCourseContent } from '@/components/course/Course'

registerCourseContent(
    'softengExtra',
    lazy(() => import('@/softengExtra/SoftengExtraCourseContent'))
)
registerCourseTableContent(
    'softengExtra',
    lazy(() => import('@/softengExtra/SoftengExtraCourseTableContent'))
)
