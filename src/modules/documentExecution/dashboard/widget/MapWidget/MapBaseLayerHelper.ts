import { IMapWidgetBaseLayerType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'

export interface IMapWidgetBaseLayerDefinition {
    value: IMapWidgetBaseLayerType
    labelKey: string
    url: string
    options: {
        maxZoom: number
        attribution: string
        subdomains?: string
    }
}

export const DEFAULT_MAP_BASE_LAYER: IMapWidgetBaseLayerType = 'cartoLight'

const mapBaseLayerDefinitions: Record<IMapWidgetBaseLayerType, IMapWidgetBaseLayerDefinition> = {
    osmStandard: {
        value: 'osmStandard',
        labelKey: 'dashboard.widgetEditor.map.baseLayer.osmStandard',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    cartoLight: {
        value: 'cartoLight',
        labelKey: 'dashboard.widgetEditor.map.baseLayer.cartoLight',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        options: {
            maxZoom: 20,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd'
        }
    },
    cartoDark: {
        value: 'cartoDark',
        labelKey: 'dashboard.widgetEditor.map.baseLayer.cartoDark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        options: {
            maxZoom: 20,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd'
        }
    },
    esriSatellite: {
        value: 'esriSatellite',
        labelKey: 'dashboard.widgetEditor.map.baseLayer.esriSatellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        }
    }
}

export const isMapBaseLayerType = (value: string | null | undefined): value is IMapWidgetBaseLayerType => {
    return !!value && value in mapBaseLayerDefinitions
}

export const getMapBaseLayerDefinition = (value: string | null | undefined): IMapWidgetBaseLayerDefinition => {
    return isMapBaseLayerType(value) ? mapBaseLayerDefinitions[value] : mapBaseLayerDefinitions[DEFAULT_MAP_BASE_LAYER]
}

export const getMapBaseLayerOptions = () => {
    return Object.values(mapBaseLayerDefinitions).map(({ value, labelKey }) => ({ value, labelKey }))
}
