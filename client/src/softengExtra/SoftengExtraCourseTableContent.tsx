// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseTableContentProps } from '@/components/course/CourseTable'
import TeacherTable from '@/components/TeacherTable'
import { SoftengExtraCourseDTO, SoftengExtraCourseInstanceDTO } from '@/api/Api'
import { courseTableContent, courseTableOnCourseSelected, defaultTeacherTableColumns } from '@/softengExtra/utils'

export default function SoftengExtraCourseTableContent({
    users,
    course,
    courseInstances,
    onCourseInstanceSelected,
    onRefresh,
    toast
}: CourseTableContentProps<SoftengExtraCourseDTO, SoftengExtraCourseInstanceDTO>) {
    const rows = courseTableContent(users, course, courseInstances).map((row) => ({
        ...row,
        'courseInstance.creationDate': row['courseInstance.creationDate']
            ? new Date(row['courseInstance.creationDate'])
            : null,
        'courseInstance.completionDate': row['courseInstance.completionDate']
            ? new Date(row['courseInstance.completionDate'])
            : null
    }))

    return (
        <TeacherTable
            values={rows}
            columns={[
                ...defaultTeacherTableColumns,
                { field: 'courseInstance.status', header: 'Status', dataType: 'enum' },
                { field: 'courseInstance.githubUsername', header: 'GitHub' },
                { field: 'courseInstance.points', header: 'Points', dataType: 'numeric' },
                { field: 'courseInstance.imscPoints', header: 'IMSc points', dataType: 'numeric' },
                { field: 'courseInstance.creationDate', header: 'Creation Date', dataType: 'date' },
                { field: 'courseInstance.completionDate', header: 'Completion Date', dataType: 'date' }
            ]}
            columnTemplates={{
                'courseInstance.creationDate': (value) => (value ? value.toLocaleDateString() : ''),
                'courseInstance.completionDate': (value) => (value ? value.toLocaleDateString() : '')
            }}
            idColumn={'courseInstance._id'}
            courseInstanceIdColumn={'courseInstance._id'}
            persistenceKey="softengExtra-teacher"
            onRowSelected={courseTableOnCourseSelected(onCourseInstanceSelected, courseInstances)}
            onRefresh={onRefresh}
            toast={toast}
        />
    )
}
