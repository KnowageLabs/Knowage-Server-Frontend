import type { iDriver } from '../../DocumentDetails'

export interface iDossierTemplate {
    type: string
    prefix?: string
    name: string
    placeholders: iPlaceholder[]
    downloadable?: boolean
    uploadable?: boolean
}

export interface iPlaceholder {
    imageName: string
    label?: string
    docId?: string
    source: string
    parameters: iDossierDriver[]
    views: iViews
    viewId?: string
    sheetHeight: number
    sheetWidth: number
    deviceScaleFactor: number
    sheetNumber?: number
}

export interface iViews {
    selected?: iView
    availableViews: iView[]
}

export interface iView {
    id?: string
    name?: string
    creationDate?: Date
}

export type iDossierDriverLinkType = 'static' | 'dynamic' | 'inherit'
export type iDossierDriverType = iDossierDriverLinkType | { code: iDossierDriverLinkType; label?: string }
export type iDossierDriverSelection = string | Pick<iDriver, 'parameterUrlName' | 'label'>

export interface iDossierDriver extends Partial<iDriver> {
    type?: iDossierDriverType
    dossierUrlName?: iDossierDriverSelection
    urlName?: string
    urlNameDescription?: string
    value?: string
    inherit?: boolean
}
