export interface IDocument {
    biObjId: number
    functId: number
    objId: number
    subObjId: number
    requestTime: number
    subObjName?: string
    documentDescription?: string
    documentLabel?: string
    documentName?: string
    documentPath?: string
    documentType?: string
    previewFile?: string
    engineName?: any
}

export interface IFolder {
    id: string | null,
    parentId: string | null,
    name: string,
    description: string,
    progr: number,
    created: string,
    children: IFolder[]
}

export type WsTab = 'documents' | 'datasets' | 'models' | 'scheduled'
export type WsScope = 'all' | 'recent' | 'fav' | 'mine'
export type WsDataScope = 'all' | 'mine' | 'available'
export type WsScheduledView = 'outputs' | 'jobs'

// linkId: the SBI_VIEW_FOR_DOC id of a document link (views have no link id, only their one folder)
export interface WsLink {
    linkId?: string
    folderId: string
}

export interface WsDocumentRow {
    kind: 'DOCUMENT' | 'VIEW'
    key: string
    id: number | string
    biObjectId: number
    label: string
    name: string
    description?: string
    typeCode: string
    viewOf?: { biObjectId: number; name: string; label: string }
    creationUser?: string
    creationDate?: string
    stateCode?: string
    previewFile?: string
    lastRun?: number
    personal: boolean
    links: WsLink[]
}

// A workspace folder flattened for lists and menus. path is "Parent › Child".
export interface WsCollection {
    id: string
    name: string
    description: string
    parentId: string | null
    depth: number
    path: string
    created?: string
    progr: number
    childCount: number
}

export interface WsDataRow {
    kind: 'DATASET' | 'MODEL'
    key: string
    id: number
    label?: string
    name: string
    description?: string
    dsTypeCd?: string
    category?: string
    tags: string[]
    owner?: string
    modified?: string
    dataSourceLabel?: string
    mine: boolean
    raw: any
}

export interface WsOutputRow {
    key: string
    snapshotId: number
    biObjectId: number
    documentName: string
    jobName: string
    jobGroup: string
    name: string
    created: number
    contentType: string
    format: string
}

export interface WsJobRow {
    key: string
    jobName: string
    jobGroup: string
    description: string
    documents: string[]
    triggers: ITrigger[]
}

export interface WsDocumentFilters {
    scope: WsScope
    types: string[]
    collection: string | null
    q: string
}

export interface WsDataFilters {
    scope: WsDataScope
    dsTypes: string[]
    categories: string[]
    q: string
}

export interface WsScheduledFilters {
    view: WsScheduledView
    jobs: string[]
    formats: string[]
    q: string
}

export interface IPackage {
    jobName: string
    jobGroup: string
    jobDescription: string
    jobClass: string
    jobDurability: boolean
    jobRequestRecovery: boolean
    jobMergeAllSnapshots: boolean
    jobCollateSnapshots: boolean
    useVolatility: boolean
    jobParameters: { name: string; value: string }[]
    documents: any[]
    triggers: iTrigger[]
    edit?: boolean
    numberOfDocuments?: number
}

export interface ITrigger {
    jobName: string
    jobGroup: string
    triggerName: string
    triggerGroup: string
}

export interface ISchedulation {
    id: number
    biobjId: number
    name: string
    description: string
    dateCreation: number
    time: string
    binId: any
    content: any
    contentType: any
    schedulation: any
    scheduler: any
    schedulationStartDate: any
    sequence: any
    urlPath?: string
}

export interface IBusinessModel {
    id: number
    name: string
    description: string
    category: number
    dataSourceLabel: string
    dataSourceId: number
    modelLocked: boolean
    modelLocker: any
    smartView: boolean
    tablePrefixLike: any
    tablePrefixNotLike: any
    drivers: any[]
    metamodelDrivers: any
}

export interface IFederatedDataset {
    federation_id?: number
    name: string
    label: string
    description: string
    relationships: any
    degenerated?: boolean
    owner?: any
}

export interface INode {
    key: number | string
    icon?: string
    id: number
    parentId?: number
    label: string
    children?: iNode[]
    selectable?: Boolean
    data: string | any
    customIcon?: string
}

export interface IDataset {
    actions: any[]
    usedByNDocs: number
    drivers: any[]
    meta: IDatasetMetadata
    dateIn: string
    description: string
    tags: string[]
    author: string
    name: string
    id: number
    owner: string
    label: string
    catTypeId: number
    catTypeCd: string
    pars: any[]
}

export interface IDatasetMetadata {
    dataset: any[]
    columns: any[]
}
