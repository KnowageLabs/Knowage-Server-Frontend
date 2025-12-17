import mitt from 'mitt'

type Events = {
    kpisImported: void
    menuImported: void
    glossaryImported: void
}

export const importExportEmitter = mitt<Events>()
