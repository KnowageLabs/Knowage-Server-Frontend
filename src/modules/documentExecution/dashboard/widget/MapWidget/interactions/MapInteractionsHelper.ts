import { ISelection, IVariable, IWidget, IWidgetInteractionParameter } from '../../../Dashboard'
import { IMapWidgetCrossNavigation, IMapWidgetCrossNavigationVisualizationTypeConfig, IMapWidgetLayer, IMapWidgetLinkConfiguration, IMapWidgetLinkVisualizationTypeConfig, IMapWidgetPreview, IMapWidgetPreviewVisualizationTypeConfig, IMapWidgetSelection, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { executeMapCrossNavigation, updateStoreSelections } from '../../interactionsHelpers/InteractionHelper'
import { resolveLayerByTarget } from '../LeafletHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import store from '../../../Dashboard.store'
import axios from 'axios'
import { openNewLinkMapWidget } from '../../interactionsHelpers/InteractionLinkHelper'
import DashboardSaveViewDialog from '../../../DashboardViews/DashboardSaveViewDialog/DashboardSaveViewDialog.vue'

const dashStore = store()

export const executeMapInteractions = (event: any, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    const li = event.currentTarget as HTMLLIElement
    const data = li.getAttribute('data-value')
    const dataMap = (event.currentTarget as any)._dataMap

    if (!data) return

    const [rawValueColumn, rawValue] = data.split(':')
    const column = rawValueColumn.trim()
    const value = rawValue.trim()

    const selectedLayer = resolveLayerByTarget(widgetModel, layerVisualizationSettings.target) as IMapWidgetLayer | null

    // Debug logging
    try {
        // eslint-disable-next-line no-console
        console.log('executeMapInteractions: data', data, 'column', column, 'value', value, 'layerVisualizationSettings', { id: layerVisualizationSettings.id, target: layerVisualizationSettings.target, label: layerVisualizationSettings.label })
        // eslint-disable-next-line no-console
        console.log('executeMapInteractions: selectedLayer', selectedLayer, 'crossNavigationEnabled?', widgetModel.settings.interactions.crossNavigation?.enabled)
    } catch (err) {
        // ignore
    }

    // Only run selection logic if we found a selectedLayer (selection needs dataset context)
    if (widgetModel.settings.interactions.selection?.enabled && selectedLayer) {
        setMapSelections(column, value, activeSelections, dashboardId, selectedLayer, widgetModel, layerVisualizationSettings)
    }

    if (widgetModel.settings.interactions.crossNavigation?.enabled) {
        startMapCrossNavigation(column, widgetModel.settings.interactions.crossNavigation, layerVisualizationSettings, dataMap, dashboardId)
    }

    if (widgetModel.settings.interactions.link?.enabled) {
        startMapLink(column, widgetModel.settings.interactions.link, layerVisualizationSettings, dataMap, dashboardId, variables)
    }

    if (widgetModel.settings.interactions.preview?.enabled) {
        startMapPreview(column, widgetModel.settings.interactions.preview, layerVisualizationSettings, dataMap, widgetModel.id)
    }
}

export const matchesVisualizationType = (configuredViz: any | null | undefined, activeViz: IMapWidgetVisualizationType) => {
    if (!configuredViz) return false

    // Prefer matching by label (visualization label) when available
    if (configuredViz.label && activeViz.label && configuredViz.label === activeViz.label) return true

    // Match by explicit id when available
    if (configuredViz.id && activeViz.id && configuredViz.id === activeViz.id) return true

    // Match by target field
    if (configuredViz.target && activeViz.target && configuredViz.target === activeViz.target) return true

    // Match by targetType if present (e.g., dataset vs other)
    if (configuredViz.targetType && activeViz.targetType && configuredViz.targetType === activeViz.targetType) return true

    return false
}

export const columnsMatch = (configuredColumn: string | null | undefined, clickedColumn: string) => {
    if (!configuredColumn) return false
    if (!clickedColumn) return false
    const a = configuredColumn.trim().toLowerCase()
    const b = clickedColumn.trim().toLowerCase()
    if (a === b) return true
    if (a.includes(b) || b.includes(a)) return true
    return false
}

const setMapSelections = (column: string, value: string, activeSelections: ISelection[], dashboardId: string, selectedLayer: IMapWidgetLayer, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType) => {
    const widgetSelections = widgetModel.settings.interactions.selection
    const widgetSelectionConfiguration = widgetSelections.selections.find((widgetSelectionConfig: IMapWidgetSelection) => matchesVisualizationType(widgetSelectionConfig.vizualizationType, layerVisualizationSettings) && columnsMatch(widgetSelectionConfig.column, column))
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

const startMapCrossNavigation = (column: string, crossNavigationConfiguration: IMapWidgetCrossNavigation, layerVisualizationSettings: IMapWidgetVisualizationType, dataMap: Record<string, string | number> | null, dashboardId: string) => {
    // Debug pre-check
    try {
        // eslint-disable-next-line no-console
        console.log('startMapCrossNavigation: enabled?', crossNavigationConfiguration?.enabled, 'looking for column', column, 'in visualization', { id: layerVisualizationSettings.id, target: layerVisualizationSettings.target, label: layerVisualizationSettings.label })
    } catch (err) {
        // ignore
    }

    const selectedCrossNavigationConfiguration = crossNavigationConfiguration.crossNavigationVizualizationTypes.find((crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig) => matchesVisualizationType(crossNavigationVisTypeConfig.vizualizationType, layerVisualizationSettings) && columnsMatch(crossNavigationVisTypeConfig.column, column))

    if (!selectedCrossNavigationConfiguration) {
        // eslint-disable-next-line no-console
        console.log('startMapCrossNavigation: no matching crossNavigation config found for column', column)
        return
    }

    // Debug matched
    try {
        // eslint-disable-next-line no-console
        console.log('startMapCrossNavigation: matched crossNavigation config', selectedCrossNavigationConfiguration)
    } catch (err) {
        // ignore
    }

    const formattedOutputParameters = getFormattedOutputParameters(dataMap, selectedCrossNavigationConfiguration.parameters)
    executeMapCrossNavigation(formattedOutputParameters, selectedCrossNavigationConfiguration, dashboardId)
}

const getFormattedOutputParameters = (dataMap: Record<string, string | number> | null, outputParameters: IWidgetInteractionParameter[]) => {
    const formattedOutputParameters = [] as IWidgetInteractionParameter[]
    outputParameters.forEach((outputParameter: IWidgetInteractionParameter) => {
        if (outputParameter.type === 'dynamic') {
            formattedOutputParameters.push(getFormattedDynamicOutputParameter(dataMap, outputParameter))
        } else {
            formattedOutputParameters.push(outputParameter)
        }
    })
    return formattedOutputParameters
}

const getFormattedDynamicOutputParameter = (dataMap: Record<string, string | number> | null, outputParameter: IWidgetInteractionParameter) => {
    let value = ''

    if (dataMap && outputParameter.column && dataMap[outputParameter.column]) value = '' + dataMap[outputParameter.column]

    return { ...outputParameter, value: value }
}

const startMapLink = (column: string, linkConfiguration: IMapWidgetLinkConfiguration, layerVisualizationSettings: IMapWidgetVisualizationType, dataMap: Record<string, string | number> | null, dashboardId: string, variables: IVariable[]) => {
    const selectedLinkConfiguration = linkConfiguration.linkVizualizationTypes.find((previewVizualizationTypeConfig: IMapWidgetLinkVisualizationTypeConfig) => matchesVisualizationType(previewVizualizationTypeConfig.vizualizationType, layerVisualizationSettings) && columnsMatch(previewVizualizationTypeConfig.column, column))
    if (!selectedLinkConfiguration) return

    openNewLinkMapWidget(dataMap, dashboardId, variables, selectedLinkConfiguration)
}

const startMapPreview = (column: string, previewConfiguration: IMapWidgetPreview, layerVisualizationSettings: IMapWidgetVisualizationType, dataMap: Record<string, string | number> | null, widgetId: string | undefined) => {
    const selectedPreviewConfiguration = previewConfiguration.previewVizualizationTypes.find((previewVizualizationTypeConfig: IMapWidgetPreviewVisualizationTypeConfig) => matchesVisualizationType(previewVizualizationTypeConfig.vizualizationType, layerVisualizationSettings) && columnsMatch(previewVizualizationTypeConfig.column, column))
    if (!selectedPreviewConfiguration) return

    const formattedOutputParameters = getFormattedOutputParameters(dataMap, selectedPreviewConfiguration.parameters)

    emitter.emit('mapDatasetInteractionPreview', { formattedOutputParameters: formattedOutputParameters, previewSettings: selectedPreviewConfiguration, widgetId: widgetId })
}
