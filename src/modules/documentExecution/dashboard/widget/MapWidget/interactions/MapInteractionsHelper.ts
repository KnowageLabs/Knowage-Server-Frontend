import { ISelection, IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetSelection, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { updateStoreSelections } from '../../interactionsHelpers/InteractionHelper'
import store from '../../../Dashboard.store'
import axios from 'axios'

const dashStore = store()

export const executeMapInteractions = (event: any, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, activeSelections: ISelection[], dashboardId: string) => {
    const li = event.currentTarget as HTMLLIElement
    const data = li.getAttribute('data-value')

    if (!data) return

    const [rawValueColumn, rawValue] = data.split(':')
    const column = rawValueColumn.trim()
    const value = rawValue.trim()

    const selectedLayer = widgetModel.layers?.find((layer: IMapWidgetLayer) => layer.layerId === layerVisualizationSettings.target)
    if (!selectedLayer) return

    if (widgetModel.settings.interactions.selection?.enabled) {
        setMapSelections(column, value, activeSelections, dashboardId, selectedLayer, widgetModel, layerVisualizationSettings)
    }
}

const setMapSelections = (column: string, value: string, activeSelections: ISelection[], dashboardId: string, selectedLayer: IMapWidgetLayer, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType) => {
    const widgetSelections = widgetModel.settings.interactions.selection
    const widgetSelectionConfiguration = widgetSelections.selections.find((widgetSelectionConfig: IMapWidgetSelection) => widgetSelectionConfig.vizualizationType?.target === layerVisualizationSettings.target && widgetSelectionConfig.column === column)
    if (!widgetSelectionConfiguration) return

    const selection = createNewSelection(column, [value], selectedLayer)
    updateStoreSelections(selection, activeSelections, dashboardId, dashStore.setSelections, axios)
}

const createNewSelection = (column: string, value: (string | number)[], selectedLayer: IMapWidgetLayer) => {
    const selection = {
        datasetId: selectedLayer.id,
        datasetLabel: dashStore.getDatasetLabel(selectedLayer.id),
        columnName: column,
        value: value,
        aggregated: false,
        timestamp: new Date().getTime()
    }
    return selection
}
