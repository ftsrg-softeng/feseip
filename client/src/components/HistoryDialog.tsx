// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import React, { useState } from 'react'
import SmartDataTable from '@/components/data-table/SmartDataTable'
import { useTranslation } from 'react-i18next'
import { classNames } from 'primereact/utils'
import { Button } from 'primereact/button'
import { Api, LogDTO } from '@/api/Api'
import LogDialog from '@/components/LogDialog'
import { CourseDTO } from '@/components/course/Course'

type Props = {
    show: boolean
    onHide: () => void
    advancedMode?: boolean
    course: CourseDTO
    connection: Api<unknown>
    history: { event: string; timestamp: string; successful: boolean; log?: string; data: any }[]
}

function HistoryDialog({ show, onHide, advancedMode, course, connection, history }: Props) {
    const { t } = useTranslation()

    const [selectedLog, setSelectedLog] = useState(null as LogDTO | null)

    return (
        <>
            {history && (
                <>
                    <Dialog
                        visible={show}
                        dismissableMask={true}
                        modal
                        header={t('common.history.title')}
                        style={{ width: '60vw' }}
                        contentStyle={{ height: '1000px', maxHeight: '90vh' }}
                        onHide={onHide}
                    >
                        {advancedMode && (
                            <SmartDataTable
                                values={history.map((entry, index) => ({
                                    ...entry,
                                    timestamp: new Date(entry.timestamp),
                                    index
                                }))}
                                columns={[
                                    { field: 'event', dataType: 'enum' },
                                    { field: 'timestamp', dataType: 'date' },
                                    { field: 'successful', dataType: 'boolean' }
                                ]}
                                rowToolbar={(entry) =>
                                    entry.log ? (
                                        <Button
                                            size="small"
                                            severity="secondary"
                                            outlined
                                            icon="pi pi-book"
                                            className="mr-2"
                                            pt={{ root: { className: classNames('p-1') } }}
                                            onClick={() => {
                                                setSelectedLog({
                                                    _id: entry.log!,
                                                    course: course,
                                                    type: 'action',
                                                    timestamp: entry.timestamp.toUTCString(),
                                                    name: entry.event
                                                })
                                            }}
                                        />
                                    ) : (
                                        <></>
                                    )
                                }
                                rowToolbarPosition="first"
                                idColumn="index"
                                columnTemplates={{
                                    timestamp: (timestamp) => <span>{timestamp.toLocaleString()}</span>,
                                    successful: (successful) => (
                                        <span className={successful ? 'pi pi-check' : 'pi pi-times'} />
                                    )
                                }}
                            />
                        )}
                        {!advancedMode && (
                            <DataTable value={history} scrollable scrollHeight="flex" size="small">
                                <Column field="event" header={t('common.history.event')} />
                                <Column
                                    field="timestamp"
                                    header={t('common.history.timestamp')}
                                    body={(entry) => (
                                        <span>{t('common.timestamp', { date: new Date(entry.timestamp) })}</span>
                                    )}
                                />
                                <Column
                                    field="successful"
                                    header={t('common.history.successful')}
                                    body={(entry) => (
                                        <span className={entry.successful ? 'pi pi-check' : 'pi pi-times'} />
                                    )}
                                />
                            </DataTable>
                        )}
                    </Dialog>
                    {selectedLog && (
                        <LogDialog
                            log={selectedLog}
                            courseType={course.type}
                            connection={connection}
                            onHide={() => setSelectedLog(null)}
                        />
                    )}
                </>
            )}
        </>
    )
}

export default HistoryDialog
