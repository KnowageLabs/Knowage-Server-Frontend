import { IDataset, IDatasetColumn, IWidget } from '../../Dashboard'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '../../interfaces/mapWidget/DashboardMapWidget'
import { removeColumnFromModel } from '../WidgetEditor/MapWidget/MapWidgetLayersTabListHelper'

export const formatMapWidgetAfterDashboardLoading = (widget: IWidget, datasets: IDataset[]) => {
    formatLayerColumnIfDatasetChanged(widget, datasets)
}

const formatLayerColumnIfDatasetChanged = (widget: IWidget, datasets: IDataset[]) => {
    widget.layers?.forEach((layer: IMapWidgetLayer) => {
        const oldSpatialAttibute = layer.columns?.find((column: IWidgetMapLayerColumn) => column.fieldType === 'SPATIAL_ATTRIBUTE')
        const layerAsDataset = datasets.find((dataset: IDataset) => dataset.id?.dsId === layer.id)

        if (layerAsDataset && layerAsDataset.metadata.fieldsMeta) {
            const existingColumns = layer.columns ?? []
            const fieldsMeta = layerAsDataset.metadata?.fieldsMeta ?? []

            const updatedColumns: IWidgetMapLayerColumn[] = []
            fieldsMeta.forEach((metaColumn: IDatasetColumn) => {
                const existing = existingColumns.find((column: IWidgetMapLayerColumn) => column.name === metaColumn.name)
                if (existing) {
                    updatedColumns.push(existing)
                } else {
                    updatedColumns.push(metaColumn as IWidgetMapLayerColumn)
                }
            })
            layer.columns = updatedColumns

            const columnsForDelete = layer.columns?.filter((layerColumn: IWidgetMapLayerColumn) => !layerAsDataset.metadata.fieldsMeta.some((datasetColumn: IDatasetColumn) => datasetColumn.name === layerColumn.name))
            columnsForDelete?.forEach((column: IWidgetMapLayerColumn) => removeColumnFromModel(layer, column, widget))
        }

        updateSpatialAttributeColumnsForDefaultValues(layer, oldSpatialAttibute)
        setDefaultMeasureValuesForMapWidgetColumns(widget)
    })
}

const updateSpatialAttributeColumnsForDefaultValues = (layer: IMapWidgetLayer, oldSpatialAttibute: IWidgetMapLayerColumn | undefined) => {
    layer.columns?.forEach((column: IWidgetMapLayerColumn) => {
        if (column.fieldType === 'SPATIAL_ATTRIBUTE' && !column.properties.coordFormat) {
            column.properties.coordType = oldSpatialAttibute ? oldSpatialAttibute.properties.coordType : 'string'
            column.properties.coordFormat = oldSpatialAttibute ? oldSpatialAttibute.properties.coordFormat : 'lon lat'
        }
    })
}

export const setDefaultMeasureValuesForMapWidgetColumns = (widgetModel: IWidget) => {
    widgetModel?.layers?.forEach((layer: IMapWidgetLayer) => {
        if (layer.type !== 'dataset') return
        layer.columns?.forEach((column: IWidgetMapLayerColumn) => {
            if (column.fieldType === 'MEASURE' && !column.aggregationSelected) column.aggregationSelected = 'SUM'
        })
    })
}
