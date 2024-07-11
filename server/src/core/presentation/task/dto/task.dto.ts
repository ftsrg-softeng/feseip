// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { SchemaToDtoClass } from '@/common/schema-to-dto.util'
import { Task } from '@/core/data/schemas/task.schema'
import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { TaskData } from '@/decorators/task.decorator'
import { OmitType } from '@nestjs/swagger'
import { DTOProperty } from '@/common/dto-property.decorator'
import { capitalize } from '@/common/capitalize.util'

export class TaskDTO extends SchemaToDtoClass(Task) {}

export function synthesizeTaskDTO(courseData: CourseData, phaseData: PhaseData, taskData: TaskData) {
    class SynthesizedTaskDTO extends OmitType<TaskDTO, keyof TaskDTO>(taskData.taskDTO, ['type']) {
        @DTOProperty({ type: String, enum: [taskData.name] })
        type: string
    }

    Object.defineProperty(SynthesizedTaskDTO, 'name', {
        value: `${capitalize(courseData.name)}${capitalize(phaseData.name)}${capitalize(taskData.name)}TaskDTO`
    })

    return SynthesizedTaskDTO
}
