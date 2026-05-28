import { IWidget } from '../../Dashboard'
import { IMapNormalisedInteractionColumn, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType, IWidgetMapLayerColumn } from '../../interfaces/mapWidget/DashboardMapWidget'
import { resolveLayerByTarget } from './LeafletHelper'
import * as mapWidgetDefaultValues from '../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export type MapFilterColumnsCache = Map<string, IMapNormalisedInteractionColumn[]>

export const createMapFilterColumn = (column: any): IMapNormalisedInteractionColumn => {
    const name = column?.name ?? column?.property ?? column ?? ''
    return {
        name,
        alias: column?.alias ?? name,
        type: column?.fieldType ?? column?.type ?? 'ATTRIBUTE'
    }
}

export const getMapFilterColumnsFromProperties = (properties: IMapWidgetLayerProperty[] | undefined): IMapNormalisedInteractionColumn[] => {
    return (properties ?? [])
        .map((property: IMapWidgetLayerProperty) => createMapFilterColumn({ property: property.property, alias: property.property, type: 'ATTRIBUTE' }))
        .filter((column: IMapNormalisedInteractionColumn) => !!column.name)
}

const getMapFilterColumnsFromDatasetLayer = (columns: IWidgetMapLayerColumn[] | undefined): IMapNormalisedInteractionColumn[] => {
    return (columns ?? [])
        .filter((column: IWidgetMapLayerColumn) => !column.deleted && column.fieldType !== 'SPATIAL_ATTRIBUTE')
        .map((column: IWidgetMapLayerColumn) => createMapFilterColumn(column))
}

const getLayerFilterColumns = (layer: IMapWidgetLayer | null | undefined, propertiesCache: MapFilterColumnsCache): IMapNormalisedInteractionColumn[] => {
    if (!layer) return []
    if (layer.type === 'dataset') return getMapFilterColumnsFromDatasetLayer(layer.columns)
    return propertiesCache.get(layer.layerId) ?? []
}

const getUniqueMapFilterColumns = (...groups: IMapNormalisedInteractionColumn[][]) => {
    return Array.from(
        new Map(
            groups
                .flat()
                .filter((column: IMapNormalisedInteractionColumn) => !!column.name)
                .map((column: IMapNormalisedInteractionColumn) => [column.name, column])
        ).values()
    )
}

const resolveVisualization = (widgetModel: IWidget, visualization: IMapWidgetVisualizationType) => {
    return (
        widgetModel?.settings?.visualizations?.find((tempVisualization: IMapWidgetVisualizationType) => {
            if (visualization.id && tempVisualization.id === visualization.id) return true
            if (visualization.label && tempVisualization.label === visualization.label) return true
            return !!(visualization.target && visualization.type && tempVisualization.target === visualization.target && tempVisualization.type === visualization.type)
        }) ?? visualization
    )
}

export const ensureMapVisualizationFilter = (visualization: IMapWidgetVisualizationType) => {
    if (!visualization.filter) visualization.filter = mapWidgetDefaultValues.getDefaultVisualizationMapFilter()
    return visualization.filter
}

export const getAvailableMapFilterColumns = (widgetModel: IWidget, visualization: IMapWidgetVisualizationType, propertiesCache: MapFilterColumnsCache): IMapNormalisedInteractionColumn[] => {
    if (!widgetModel || !visualization) return []

    const resolvedVisualization = resolveVisualization(widgetModel, visualization)
    const layer = resolvedVisualization.target ? (resolveLayerByTarget(widgetModel, resolvedVisualization.target) as IMapWidgetLayer | null) : null
    const datasetLayer = resolvedVisualization.targetDataset ? (resolveLayerByTarget(widgetModel, resolvedVisualization.targetDataset) as IMapWidgetLayer | null) : null

    if (datasetLayer) {
        return getUniqueMapFilterColumns(getLayerFilterColumns(layer, propertiesCache), getLayerFilterColumns(datasetLayer, propertiesCache))
    }

    return getLayerFilterColumns(layer, propertiesCache)
}

export const getConfiguredMapFilterColumns = (visualization: IMapWidgetVisualizationType): IMapNormalisedInteractionColumn[] | null => {
    return Array.isArray(visualization.filter?.columns) ? visualization.filter?.columns ?? [] : null
}

export const getSelectedMapFilterColumnNames = (visualization: IMapWidgetVisualizationType): string[] => {
    return (visualization.filter?.columns ?? []).map((column: IMapNormalisedInteractionColumn) => column.name).filter((columnName: string) => !!columnName)
}

export const updateMapFilterColumns = (visualization: IMapWidgetVisualizationType, selectedColumnNames: string[] | null, availableColumns: IMapNormalisedInteractionColumn[]) => {
    const filter = ensureMapVisualizationFilter(visualization)
    const existingColumns = new Map((filter.columns ?? []).map((column: IMapNormalisedInteractionColumn) => [column.name, column]))
    const availableColumnsMap = new Map((availableColumns ?? []).map((column: IMapNormalisedInteractionColumn) => [column.name, column]))

    filter.columns = (selectedColumnNames ?? []).map((columnName: string) => {
        return existingColumns.get(columnName) ?? availableColumnsMap.get(columnName) ?? createMapFilterColumn(columnName)
    })

    if (filter.column && !filter.columns.some((column: IMapNormalisedInteractionColumn) => column.name === filter.column)) {
        filter.column = null
    }
}
