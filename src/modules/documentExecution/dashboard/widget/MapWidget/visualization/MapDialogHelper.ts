import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsVisualizations, IMapWidgetCrossNavigation, IMapWidgetLayer, IMapWidgetLinkConfiguration, IMapWidgetPreview, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName } from '../LeafletHelper'
import L from 'leaflet'
import { ChartValuesRecord } from './MapChartsVizualizationHelper'
import { executeMapInteractions } from '../interactions/MapInteractionsHelper'
import { getInteractionDataMap } from './MapVisualizationHelper'
import { getMapInfoColumnName } from '../MapWidgetInfoSettingsHelper'

interface IListItemStyle {
    'justify-content': string
    'font-family': string
    'font-size': string
    'font-style': string
    'font-weight': string
    color: string
    'background-color': string
}

// Function that creates popup/tooltip for the maps that use dataset as the target
const createPopupContainer = (tooltip: boolean, title: string) => {
    const container = document.createElement('div')
    container.classList.add('customLeafletPopupCard')

    if (!tooltip && title) {
        const header = document.createElement('div')
        header.classList.add('customLeafletPopupHeader')
        header.innerText = title
        container.appendChild(header)
    }

    return container
}

export const createDialogFromDataset = (tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, meta: any, row: any, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    const container = createPopupContainer(tooltip, layerVisualizationSettings.label ?? '')
    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    const visualizationList = settings.visualizations.filter((visualization: IMapTooltipSettingsVisualizations) => visualization.label === layerVisualizationSettings.label)
    visualizationList.forEach((item: IMapTooltipSettingsVisualizations) => {
        const dataMap = {}

        meta?.metaData?.fields.forEach((field: any) => {
            if (field.dataIndex === undefined || field.dataIndex === null) return
            dataMap[field.header] = row[field.dataIndex]
            if (field.name) dataMap[field.name] = row[field.dataIndex]
        })

        item.columns.forEach((column: any) => {
            const columnName = getMapInfoColumnName(column)
            if (!columnName) return
            const rowColumnName = getColumnName(columnName, meta) || columnName
            const columnValue = row[rowColumnName]
            if (columnValue === undefined || columnValue === null || columnValue === '') return
            const value = `${columnName}: ${columnValue}`
            list.append(createTooltipListItem(value, (settings as IMapDialogSettings).style, item, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, dataMap))
        })
    })

    if (!list.childElementCount) return null

    container.appendChild(list)
    if (tooltip) return L.tooltip({ className: 'kn-map-tooltip' }).setContent(container)
    else return L.popup({ className: 'kn-map-popup' }).setContent(container)
}

export const addDialogToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    if (model.settings.dialog?.enabled) {
        const popup = createDialogFromDataset(false, layerVisualizationSettings, model.settings.dialog, data[target.id], row, model, activeSelections, dashboardId, variables)
        if (popup) marker.bindPopup(popup)
    }
}

export const addTooltipToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    if (model.settings.tooltips?.enabled) {
        const tooltip = createDialogFromDataset(true, layerVisualizationSettings, model.settings.tooltips, data[target.id], row, model, activeSelections, dashboardId, variables)
        if (tooltip) marker.bindTooltip(tooltip)
    }
}

export const addDialogToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null, targetDatasetData?: any, mappedData?: any, additionalMappedData?: Record<string, Record<string, any>> | null) => {
    if (!model.settings.dialog?.enabled) return
    const popup = createDialogForLayerData(feature, false, layerVisualizationSettings, model.settings.dialog, value, model, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData, additionalMappedData)
    if (popup) marker.bindPopup(popup)
}

export const addTooltipToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null, targetDatasetData?: any, mappedData?: any, additionalMappedData?: Record<string, Record<string, any>> | null) => {
    if (!model.settings.tooltips?.enabled) return
    const tooltip = createDialogForLayerData(feature, true, layerVisualizationSettings, model.settings.tooltips, value, model, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData, additionalMappedData)
    if (tooltip) marker.bindTooltip(tooltip)
}

// Function that creates popup/tooltip for the maps that use layers as the target
export const createDialogForLayerData = (feature: ILayerFeature, tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, value: string | number | ChartValuesRecord, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null, targetDatasetData?: any, mappedData?: any, additionalMappedData?: Record<string, Record<string, any>> | null) => {
    const container = createPopupContainer(tooltip, layerVisualizationSettings.label ?? '')
    const visualizationList = settings.visualizations.filter((visualization: IMapTooltipSettingsVisualizations) => visualization.label === layerVisualizationSettings.label) as any
    if (visualizationList?.length === 0) return null

    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    const targetDatasetList = document.createElement('ul')
    targetDatasetList.classList.add('customLeafletPopup')
    const mergedDataMap = getInteractionDataMap(feature, layerVisualizationSettings, mappedData, targetDatasetData, null, additionalMappedData)

    visualizationList.forEach((item: IMapTooltipSettingsVisualizations) => {
        item.columns.forEach((property: any) => {
            const propertyName = getMapInfoColumnName(property)
            if (!propertyName) return

            const featureValue = feature.properties?.[propertyName]
            if (featureValue !== undefined && featureValue !== null && featureValue !== '') {
                list.append(createTooltipListItem(`${propertyName}: ${featureValue ?? ''}`, (settings as IMapDialogSettings).style, item, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, mergedDataMap))
            }

            if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetDatasetForeignKeyColumn) {
                const targetDatasetValue = mergedDataMap[propertyName]
                if ((featureValue === undefined || featureValue === null || featureValue === '') && targetDatasetValue !== undefined && targetDatasetValue !== null && targetDatasetValue !== '') {
                    const value = `${propertyName}: ${targetDatasetValue}`
                    targetDatasetList.append(createTooltipListItem(value, (settings as IMapDialogSettings).style, item, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, mergedDataMap))
                }
            }
        })
    })

    if (!list.childElementCount && !targetDatasetList.childElementCount) return null

    if (list.childElementCount) container.appendChild(list)
    if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        if (targetDatasetList.childElementCount) container.appendChild(targetDatasetList)
    }
    if (tooltip) return L.tooltip({ className: 'kn-map-tooltip' }).setContent(container)
    else return L.popup({ className: 'kn-map-popup' }).setContent(container)
}

const createTooltipListItem = (value: string, style: IListItemStyle | undefined, visualizationDialogSettings: IMapTooltipSettingsVisualizations | null | undefined, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], dataMap?: Record<string, string | number> | null) => {
    const li = document.createElement('li')
    const [rawValueColumn, rawValue] = value.split(':')
    const column = rawValueColumn.trim()
    const formattedValue = rawValue.trim()

    li.classList.add('customLeafletPopupItem')

    const label = document.createElement('span')
    label.classList.add('customLeafletPopupLabel')
    label.innerText = column

    const itemValue = document.createElement('span')
    itemValue.classList.add('customLeafletPopupValue')
    itemValue.innerText = (visualizationDialogSettings?.prefix || '') + getFormattedValueForTheTooltipListItem(formattedValue, visualizationDialogSettings?.precision) + (visualizationDialogSettings?.suffix || '')

    li.appendChild(label)
    li.appendChild(itemValue)

    li.classList.add('kn-cursor-pointer')

    li.setAttribute('data-value', value)
    li.setAttribute('data-layerId', layerVisualizationSettings.target)

    if (checkInteractionsIfColumnIsClickable(value, widgetModel, layerVisualizationSettings)) {
        li.classList.add('clickable-custom-leaflet-list-item')
    }

    if (dataMap) (li as any)._dataMap = dataMap

    if (style) {
        Object.entries(style).forEach(([key, val]) => {
            if (val) {
                li.style.setProperty(key, val)
            }
        })
    }

    li.addEventListener('click', (event) => executeMapInteractions(event, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables))

    return li
}

const getFormattedValueForTheTooltipListItem = (value: string, precision: number | undefined) => {
    if (!precision) return value

    const floatValue = parseFloat(value)

    if (!isNaN(floatValue) && Number.isFinite(floatValue) && !Number.isInteger(floatValue)) {
        return floatValue.toFixed(precision)
    }

    return value
}

const checkInteractionsIfColumnIsClickable = (value: string, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType) => {
    const [rawValueColumn] = value.split(':')
    const column = rawValueColumn.trim()

    const selectionConfiguration = (widgetModel?.settings?.interactions?.selection ?? null) as IMapWidgetSelectionConfiguration | null
    if (!selectionConfiguration) return false

    for (let i = selectionConfiguration.selections.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === selectionConfiguration.selections[i].vizualizationType?.id && selectionConfiguration.selections[i].column?.name === column) return true
    }

    const crossNavigationConfiguration = (widgetModel?.settings?.interactions?.crossNavigation ?? null) as IMapWidgetCrossNavigation | null
    if (!crossNavigationConfiguration) return false

    for (let i = crossNavigationConfiguration.crossNavigationVizualizationTypes.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === crossNavigationConfiguration.crossNavigationVizualizationTypes[i].vizualizationType?.id && crossNavigationConfiguration.crossNavigationVizualizationTypes[i].column.name === column) return true
    }

    const linkConfiguration = (widgetModel?.settings?.interactions?.link ?? null) as IMapWidgetLinkConfiguration | null
    if (!linkConfiguration) return false

    for (let i = linkConfiguration.linkVizualizationTypes.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === linkConfiguration.linkVizualizationTypes[i].vizualizationType?.id && linkConfiguration.linkVizualizationTypes[i].column?.name === column) return true
    }

    const previewConfiguration = (widgetModel?.settings?.interactions?.preview ?? null) as IMapWidgetPreview | null
    if (!previewConfiguration) return false

    for (let i = previewConfiguration.previewVizualizationTypes.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === previewConfiguration.previewVizualizationTypes[i].vizualizationType?.id && previewConfiguration.previewVizualizationTypes[i].column?.name === column) return true
    }

    return false
}
