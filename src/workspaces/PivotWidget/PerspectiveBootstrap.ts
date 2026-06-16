import perspective from '@perspective-dev/client'
import perspective_viewer from '@perspective-dev/viewer'
import type { Client } from '@perspective-dev/client'

import SERVER_WASM from '@perspective-dev/server/dist/wasm/perspective-server.wasm?url'
import CLIENT_WASM from '@perspective-dev/viewer/dist/wasm/perspective-viewer.wasm?url'

let workerPromise: Promise<Client> | null = null

export async function getPerspectiveWorker(): Promise<Client> {
    if (!workerPromise) {
        workerPromise = (async () => {
            await Promise.all([perspective.init_server(fetch(SERVER_WASM)), perspective_viewer.init_client(fetch(CLIENT_WASM))])
            return perspective.worker()
        })()
    }
    return workerPromise
}
