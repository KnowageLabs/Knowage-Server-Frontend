import mitt from 'mitt'

type Events = {
    kpisImported: void
    menuImported: void
}

export const importExportEmitter = mitt<Events>()
