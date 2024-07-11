// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { OmitType } from '@nestjs/swagger'
import { TaskDTO } from '@/core/presentation/task/dto/task.dto'
import { capitalize } from '@/common/capitalize.util'

export function synthesizeUpdateTaskArgs(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    class SynthesizedUpdateTaskArgs extends OmitType<TaskDTO, keyof TaskDTO>(taskData.taskDTO, [
        '_id',
        'type',
        'phase',
        'locked',
        'history'
    ]) {}

    Object.defineProperty(SynthesizedUpdateTaskArgs, 'name', {
        value: `Update${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(taskData.name)}TaskArgs`
    })

    return SynthesizedUpdateTaskArgs
}
