import { IGalleryTemplate } from '@/modules/managers/galleryManagement/GalleryManagement'
import { ICatalogFunctionTemplate } from '@/modules/importExport/catalogFunction/ICatalogFunctionTemplate'
import { iUser } from '@/modules/managers/usersManagement/UsersManagement'
import { iMenuNode } from '../managers/menuManagement/MenuManagement'

export interface IAnalyticalDriverItem {
    id: number
    label: string
    name: string
    description: string | null
    catalogType?: string
}

export interface IKpiItem {
    id: number
    version: number
    name: string
    author: string
}

export interface IGlossaryItem {
    id: number
    name: string
}

export interface IDatasetItem {
    id: number
    name: string
    label: string
    description: string | null
    catalogType?: string
}

export interface IBusinessModelItem {
    id: number
    name: string
    label: string
    description: string | null
    catalogType?: string
}

export interface IMondrianSchemaItem {
    id: number
    name: string
    label: string
    description: string | null
    catalogType?: string
}

export interface ILayerItem {
    id: number
    name: string
    label: string
    description: string | null
    catalogType?: string
}

export interface ISelectedItems {
    gallery: IGalleryTemplate[]
    catalogFunction: ICatalogFunctionTemplate[]
    users: iUser[]
    analyticalDrivers: IAnalyticalDriverItem[]
    kpis: IKpiItem[]
    glossary: IGlossaryItem[]
    datasets: IDatasetItem[]
    businessModels: IBusinessModelItem[]
    mondrianSchemas: IMondrianSchemaItem[]
    layers: ILayerItem[]
    menu: iMenuNode[]
}
