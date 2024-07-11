// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-SnippetCopyrightText: Copyright 2025 Budapest University of Technology and Economics
// SPDX-FileContributor: Critical Systems Research Group (FTSRG), Department of Artificial Intelligence and Systems Engineering
// SPDX-FileContributor: Mihály Dobos-Kovács

import React from 'react'

function Loading() {
    return (
        <div className="block mx-auto my-5 text-center">
            <i className="pi pi-spin pi-spinner " style={{ fontSize: '3rem' }}></i>
        </div>
    )
}

export default Loading
