import mitt from 'mitt'

type Events = {
    kpisImported: void
    menuImported: void
    glossaryImported: void
    datasetImported: void
    businessModelImported: void
    schemaImported: void
    layerImported: void
}

export const importExportEmitter = mitt<Events>()
