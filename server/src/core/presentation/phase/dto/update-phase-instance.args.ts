// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseData } from '@/decorators/course.decorator'
import { PhaseData } from '@/decorators/phase.decorator'
import { OmitType } from '@nestjs/swagger'
import { PhaseInstanceDTO } from '@/core/presentation/phase/dto/phase-instance.dto'
import { capitalize } from '@/common/capitalize.util'

export function synthesizeUpdatePhaseInstanceArgs(courseData: CourseData, phaseData: PhaseData) {
    class SynthesizedUpdatePhaseInstanceArgs extends OmitType<PhaseInstanceDTO, keyof PhaseInstanceDTO>(
        phaseData.phaseInstanceDTO,
        ['_id', 'type', 'courseInstances', 'phase', 'locked', 'history']
    ) {}

    Object.defineProperty(SynthesizedUpdatePhaseInstanceArgs, 'name', {
        value: `Update${capitalize(courseData.name)}${capitalize(phaseData.name)}PhaseInstanceArgs`
    })

    return SynthesizedUpdatePhaseInstanceArgs
}
