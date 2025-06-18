import { IDataset, IDatasetColumn, IWidget } from '../../Dashboard'
import { IMapWidgetCrossNavigation, IMapWidgetLayer, IMapWidgetLinkConfiguration, IMapWidgetPreview, IMapWidgetSelectionConfiguration, IWidgetMapLayerColumn } from '../../interfaces/mapWidget/DashboardMapWidget'
import { removeColumnFromModel } from '../WidgetEditor/MapWidget/MapWidgetLayersTabListHelper'
import * as mapWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export const formatMapWidgetAfterDashboardLoading = (widget: IWidget, datasets: IDataset[]) => {
    formatLayerColumnIfDatasetChanged(widget, datasets)
    formatMapInteractions(widget)
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

            existingColumns.forEach((column: IWidgetMapLayerColumn) => {
                if (column.isCalculatedField) updatedColumns.push(column)
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
            if (column.fieldType === 'MEASURE' && !column.aggregationSelected && !column.isCalculatedField) column.aggregationSelected = 'SUM'
        })
    })
}

const formatMapInteractions = (widget: IWidget) => {
    formatMapSelectioConfigurationn(widget)
    formatMapCrossNavigationConfiguration(widget)
    formatMapLinkConfiguration(widget)
    formatMapPreviewConfiguration(widget)
}

const formatMapSelectioConfigurationn = (widget: IWidget) => {
    const selectionConfiguration = (widget?.settings?.interactions?.selection ?? null) as IMapWidgetSelectionConfiguration | null
    if (!selectionConfiguration) return false

    if (selectionConfiguration.selections == undefined) widget.settings.interactions.selection = mapWidgetDefaultValues.getDefaultMapSelectionConfiguration()
}
const formatMapCrossNavigationConfiguration = (widget: IWidget) => {
    const crossNavigationConfiguration = (widget?.settings?.interactions?.crossNavigation ?? null) as IMapWidgetCrossNavigation | null
    if (!crossNavigationConfiguration) return false

    if (crossNavigationConfiguration.crossNavigationVizualizationTypes == undefined) widget.settings.interactions.crossNavigation = mapWidgetDefaultValues.getDefaultMapCrossNavigationConfiguration()
}

const formatMapLinkConfiguration = (widget: IWidget) => {
    const linkConfiguration = (widget?.settings?.interactions?.link ?? null) as IMapWidgetLinkConfiguration | null
    if (!linkConfiguration) return false

    if (linkConfiguration.linkVizualizationTypes == undefined) widget.settings.interactions.link = mapWidgetDefaultValues.getDefaultMapLinkConfiguration()
}

const formatMapPreviewConfiguration = (widget: IWidget) => {
    const previewConfiguration = (widget?.settings?.interactions?.preview ?? null) as IMapWidgetPreview | null
    if (!previewConfiguration) return false

    if (previewConfiguration.previewVizualizationTypes == undefined) widget.settings.interactions.preview = mapWidgetDefaultValues.getDefaultMapPreviewConfiguration()
}
