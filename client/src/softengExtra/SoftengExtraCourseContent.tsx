// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import { CourseContentProps, CourseStatus } from '@/components/course/Course'
import { useContext, useEffect, useState } from 'react'
import { SoftengExtraCourseDTO, SoftengExtraCourseInstanceDTO } from '@/api/Api'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import AppContext from '@/AppContext'

export default function SoftengExtraCourseContent({
    course,
    courseInstance,
    setCourseStatus,
    wrapNetworkRequest,
    connection,
    onRefresh,
    toast
}: CourseContentProps<SoftengExtraCourseDTO, SoftengExtraCourseInstanceDTO>) {
    const { role } = useContext(AppContext)

    useEffect(() => {
        setCourseStatus(CourseStatus.InProgress)
    }, [])

    const [githubUsername, setGithubUsername] = useState(courseInstance.githubUsername)

    const [points, setPoints] = useState(courseInstance.points?.toString() || '')
    const [imscPoints, setImscPoints] = useState(courseInstance.imscPoints?.toString() || '')

    const saveGitHubUsername = wrapNetworkRequest(async () => {
        if (githubUsername) {
            const response = await connection.api.softengExtraSetGithubUsernameCourseInstanceActionControllerDoAction(
                courseInstance._id,
                { githubUsername: githubUsername }
            )

            if (response.success) {
                onRefresh()
            } else {
                toast({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Sikertelen mentés'
                })
            }
        }
    })

    const resetGitHubUsername = wrapNetworkRequest(async () => {
        if (githubUsername) {
            await connection.api.softengExtraResetGithubUsernameCourseInstanceActionControllerDoAction(
                courseInstance._id,
                {}
            )

            onRefresh()
        }
    })

    const savePoints = wrapNetworkRequest(async () => {
        let awardedPoints: number | null
        let awardedIMScPoints: number | null

        try {
            awardedPoints = parseInt(points)
        } catch (e) {
            awardedPoints = null
        }

        try {
            awardedIMScPoints = parseInt(imscPoints)
        } catch (e) {
            awardedIMScPoints = null
        }

        await connection.api.softengExtraSavePointsCourseInstanceActionControllerDoAction(courseInstance._id, {
            points: awardedPoints,
            imscPoints: awardedIMScPoints
        })

        onRefresh()
    })

    return (
        <>
            <div className="grid">
                <div className="col-12 lg:col-6">
                    <h3>GitHub felhasználónév megadása</h3>
                    <p>
                        Add meg a GitHub felhasználónevedet. Nem kell ennek megegyeznie a házi feladat során használt
                        felhasználóddal.
                    </p>
                    <div className="field grid flex align-items-center">
                        <label htmlFor="githubUsername" className="col-fixed m-0">
                            GitHub felhasználónév
                        </label>
                        <div className="col">
                            <InputText
                                id="githubName"
                                value={githubUsername || ''}
                                onChange={(e) => setGithubUsername(e.target.value)}
                            />
                        </div>
                    </div>
                    {courseInstance.status === 'waiting_for_github_username' && (
                        <Button onClick={() => saveGitHubUsername()}>Mentés</Button>
                    )}
                    {courseInstance.status === 'done' && (
                        <Button onClick={() => resetGitHubUsername()} severity="danger">
                            GitHub felhasználónév módosítása
                        </Button>
                    )}
                </div>
                <div className="col-12 lg:col-6">
                    {courseInstance.githubUsername && (
                        <>
                            <h3>Feladat</h3>
                            {course.installersUrl && (
                                <p>
                                    <b>Telepítőkészlet: </b>
                                    <a href={course.installersUrl} target="_blank">
                                        link
                                    </a>
                                </p>
                            )}
                            <p>
                                <b>Repository: </b>
                                <a
                                    href={`https://github.com/${course.githubOrgName}/${course.repositoryNamePrefix}-${courseInstance.githubUsername}`}
                                    target="_blank"
                                >
                                    link
                                </a>
                            </p>
                            <p>
                                Kiküldésre került egy GitHub organization meghívó. A meghívó elfogadása után a fenti
                                repository-ban érhető el a feladat. A feladat megoldásához szükséges szoftverek
                                telepítőjét és licenc kulcsait a fenti telepítőkészletből érheted el.
                            </p>
                            <p>
                                <b>Fontos!</b> A szükséges licenc szerverek csak az egyetemi belső hálózatból érhetőek
                                el, ezért a feladat megoldásához a VPN kapcsolat beállítása szükséges.
                            </p>
                        </>
                    )}
                </div>
                {courseInstance.githubUsername && (
                    <div className="col-12 lg:col-6">
                        <h3>Értékelés</h3>
                        <p>A feladatokat sorban lehet csak elvégezni.</p>
                        <ul>
                            <li>
                                Elsőnek a <i>Creating a Dynamically Updating Documentation</i> feladatot kell elvégezni.
                            </li>
                            <li>
                                A <i>Model Change and 2-Way Merge</i> feladat sikeres megoldásával <b>2 extra pontot</b>
                                ,
                            </li>
                            <li>
                                a <i>Causing a Conflict and 3-Way Merge</i> feladat sikeres megoldásával{' '}
                                <b>3 extra pontot</b> kapsz.
                            </li>
                            <li>
                                Az opcionális <i>Creating an Activity Diagram</i> feladat sikeres megoldásával{' '}
                                <b>5 IMSc pontot</b> lehet szerezni.
                            </li>
                        </ul>
                        {typeof courseInstance.points === 'number' && (
                            <p>
                                <b>Pontszám: </b>
                                {courseInstance.points}
                            </p>
                        )}
                        {typeof courseInstance.imscPoints === 'number' && (
                            <p>
                                <b>IMSc pontszám: </b>
                                {courseInstance.imscPoints}
                            </p>
                        )}
                    </div>
                )}
                {courseInstance.githubUsername && role !== 'student' && (
                    <div className="col-12 lg:col-6">
                        <h3>Javítás</h3>
                        <p>
                            <b>PR-ok: </b>
                            <a
                                href={`https://github.com/${course.githubOrgName}/${course.repositoryNamePrefix}-${courseInstance.githubUsername}/pulls`}
                                target="_blank"
                            >
                                link
                            </a>
                        </p>
                        <div className="formgrid grid">
                            <div className="field col flex flex-column">
                                <label htmlFor="point">Pont</label>
                                <InputText
                                    id="point"
                                    value={points}
                                    className="w-full"
                                    onChange={(e) => setPoints(e.target.value)}
                                />
                            </div>
                            <div className="field col flex flex-column">
                                <label htmlFor="imsc">IMSc pont</label>
                                <InputText
                                    id="imsc"
                                    value={imscPoints}
                                    className="w-full"
                                    onChange={(e) => setImscPoints(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button label="Mentés" severity="success" onClick={() => savePoints()} />
                    </div>
                )}
            </div>
        </>
    )
}
