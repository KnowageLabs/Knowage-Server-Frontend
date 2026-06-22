import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationType, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'

const getVisualizations = (widget: IWidget): IMapWidgetVisualizationType[] => {
    return (widget.settings?.visualizations ?? []) as IMapWidgetVisualizationType[]
}

const isAggregateByEnabled = (column: IWidgetMapLayerColumn): boolean => {
    return column.properties?.aggregateBy !== false
}

export const getMapDatasetJoinColumns = (widget: IWidget, datasetLayerId: string): Set<string> => {
    return getVisualizations(widget).reduce((joinColumns, visualization) => {
        if (visualization.targetDataset === datasetLayerId && visualization.targetDatasetForeignKeyColumn) {
            joinColumns.add(visualization.targetDatasetForeignKeyColumn)
        }

        return joinColumns
    }, new Set<string>())
}

export const isMapDatasetDirectTarget = (widget: IWidget, datasetLayerId: string): boolean => {
    return getVisualizations(widget).some((visualization) => visualization.target === datasetLayerId)
}

export const shouldIncludeMapCategoryColumn = (widget: IWidget, datasetLayer: IMapWidgetLayer, column: IWidgetMapLayerColumn): boolean => {
    if (column.deleted || column.fieldType === 'MEASURE') return false

    const joinColumns = getMapDatasetJoinColumns(widget, datasetLayer.layerId)
    if (joinColumns.has(column.name)) return true

    if (column.fieldType === 'SPATIAL_ATTRIBUTE') {
        return isMapDatasetDirectTarget(widget, datasetLayer.layerId) || isAggregateByEnabled(column)
    }

    return isAggregateByEnabled(column)
}

export const getMapCategoryColumnsForService = (widget: IWidget, datasetLayer: IMapWidgetLayer): IWidgetMapLayerColumn[] => {
    return (datasetLayer.columns ?? []).filter((column) => shouldIncludeMapCategoryColumn(widget, datasetLayer, column))
}
