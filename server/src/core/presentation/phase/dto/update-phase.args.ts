// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { OmitType } from '@nestjs/swagger'
import { PhaseDTO } from '@/core/presentation/phase/dto/phase.dto'
import { capitalize } from '@/common/capitalize.util'

export function synthesizeUpdatePhaseArgs(courseData: CourseData, phaseData: PhaseData) {
    class SynthesizedUpdatePhaseArgs extends OmitType<PhaseDTO, keyof PhaseDTO>(phaseData.phaseDTO, [
        '_id',
        'type',
        'course',
        'locked',
        'history'
    ]) {}

    Object.defineProperty(SynthesizedUpdatePhaseArgs, 'name', {
        value: `Update${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseArgs`
    })

    return SynthesizedUpdatePhaseArgs
}
