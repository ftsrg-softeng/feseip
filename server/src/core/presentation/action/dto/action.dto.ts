// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { ActionData } from '@/decorators/action.decorator'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { OmitType } from '@nestjs/swagger'
import { capitalize } from '@/common/capitalize.util'

export function synthesizeActionDTO(
    actionData: ActionData,
    courseData: CourseData,
    phaseData?: PhaseData,
    taskData?: TaskData
) {
    class SynthesizedActionDTO extends OmitType(actionData.returnType!, []) {}

    Object.defineProperty(SynthesizedActionDTO, 'name', {
        value: `${capitalize(courseData.name)}${phaseData ? capitalize(phaseData.name) : ''}${taskData ? capitalize(taskData.name) : ''}${capitalize(actionData.name)}ActionDTO`
    })

    return SynthesizedActionDTO
}
