// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'
import App from './App'
import './index.css'

import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import { default as en } from '../../translations/en.json'
import { default as hu } from '../../translations/hu.json'

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        hu: { translation: hu }
    },
    lng: 'hu',
    fallbackLng: 'hu',
    interpolation: {
        escapeValue: false
        /*format: (value, format, lng) => {
            if (format === 'timestamp') {
                return new Intl.DateTimeFormat(lng, { dateStyle: 'long', timeStyle: 'long' }).format(value)
            }

            return value
        }*/
    }
})

i18n.services.formatter?.addCached('timestamp', (lng?: string) => {
    const formatter = new Intl.DateTimeFormat(lng, { dateStyle: 'long', timeStyle: 'long' })
    return (val: any) => formatter.format(val)
})

i18n.services.formatter?.addCached('deadline', (lng?: string) => {
    const formatter = new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        timeZoneName: 'short'
    })
    return (val: any) => formatter.format(val)
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <PrimeReactProvider>
            <App />
        </PrimeReactProvider>
    </React.StrictMode>
)
