import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapDialogSettings, IMapDialogSettingsProperty, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetCrossNavigation, IMapWidgetLayer, IMapWidgetLinkConfiguration, IMapWidgetPreview, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName } from '../LeafletHelper'
import L from 'leaflet'
import { ChartValuesRecord } from './MapChartsVizualizationHelper'
import { executeMapInteractions } from '../interactions/MapInteractionsHelper'

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
export const createDialogFromDataset = (tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, meta: any, row: any, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    const layersList = settings.layers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target)
    layersList.forEach((item: IMapTooltipSettingsLayer) => {
        item.columns.forEach((column: string) => {
            const layerSettings = settings.layers.find((layerSettings: IMapDialogSettingsProperty | IMapTooltipSettingsLayer) => layerSettings.name === layerVisualizationSettings.target && layerSettings.columns.includes(column))
            const value = `${column}: ${row[getColumnName(column, meta)]}`
            const dataMap = {}

            meta.metaData?.fields.forEach((field: any) => {
                if (!field.dataIndex) return
                dataMap[field.header] = row[field.dataIndex]
            })

            list.append(createTooltipListItem(value, (settings as IMapDialogSettings).style, layerSettings, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, dataMap))
        })
    })
    if (tooltip) return L.tooltip().setContent(list)
    else return L.popup().setContent(list)
}

export const addDialogToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    if (model.settings.dialog?.enabled) {
        const popup = createDialogFromDataset(false, layerVisualizationSettings, model.settings.dialog, data[target.name], row, model, activeSelections, dashboardId, variables)
        if (popup) marker.bindPopup(popup)
    }
}

export const addTooltipToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    if (model.settings.tooltips?.enabled) {
        const tooltip = createDialogFromDataset(true, layerVisualizationSettings, model.settings.tooltips, data[target.name], row, model, activeSelections, dashboardId, variables)
        if (tooltip) marker.bindTooltip(tooltip)
    }
}

export const addDialogToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null) => {
    if (!model.settings.dialog?.enabled) return
    const popup = createDialogForLayerData(feature, false, layerVisualizationSettings, model.settings.dialog, value, model, activeSelections, dashboardId, variables, foreignKeyValue)
    if (popup) marker.bindPopup(popup)
}

export const addTooltipToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null) => {
    if (!model.settings.tooltips?.enabled) return
    const tooltip = createDialogForLayerData(feature, true, layerVisualizationSettings, model.settings.tooltips, value, model, activeSelections, dashboardId, variables, foreignKeyValue)
    if (tooltip) marker.bindTooltip(tooltip)
}

// Function that creates popup/tooltip for the maps that use layers as the target
const createDialogForLayerData = (feature: ILayerFeature, tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, value: string | number | ChartValuesRecord, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null) => {
    const container = document.createElement('div')
    const layersList = settings.layers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target) as any

    if (layersList?.length === 0) return null

    // In the third use case (layer + external dataset), there are two dialogs:
    // one displaying the layer values and the other showing the values of the target dataset's foreign key column.
    if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        const targetDatasetList = document.createElement('ul')
        targetDatasetList.classList.add('customLeafletPopup')
        targetDatasetList.append(createTooltipListHeader(layerVisualizationSettings.targetDataset))
        targetDatasetList.append(createTooltipListItem(`${layerVisualizationSettings.targetDatasetForeignKeyColumn}: ${getTooltipHeaderValue(value, layerVisualizationSettings.targetDatasetForeignKeyColumn, foreignKeyValue)}`, (settings as IMapDialogSettings).style, null, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables))
        container.appendChild(targetDatasetList)
    }

    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    layersList.forEach((item: IMapTooltipSettingsLayer) => {
        if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetProperty) list.append(createTooltipListHeader(layerVisualizationSettings.layerName ?? ''))
        item.columns.forEach((property: string) => {
            const layerSettings = settings.layers.find((layerSettings: IMapDialogSettingsProperty | IMapTooltipSettingsLayer) => layerSettings.name === layerVisualizationSettings.target && layerSettings.columns.includes(property))
            const dataMap = feature.properties
            list.append(createTooltipListItem(`${property}: ${feature.properties[property] ?? ''}`, (settings as IMapDialogSettings).style, layerSettings, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, dataMap))
        })
    })

    container.appendChild(list)
    if (tooltip) return L.tooltip().setContent(container)
    else return L.popup().setContent(container)
}

const getTooltipHeaderValue = (value: string | number | ChartValuesRecord, targetProperty: string | undefined, foreignKeyValue?: string | null) => {
    if (foreignKeyValue) return foreignKeyValue
    if (typeof value !== 'object') return value
    if (targetProperty && value?.[targetProperty]?.value) return value[targetProperty].value
    return ''
}

const createTooltipListHeader = (header: string) => {
    const headerElement = document.createElement('li')
    headerElement.innerHTML = header
    headerElement.classList.add('customLeafletPopupListHeader')
    return headerElement
}

const createTooltipListItem = (value: string, style: IListItemStyle | undefined, layerSettings: IMapDialogSettingsProperty | IMapTooltipSettingsLayer | null | undefined, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], dataMap?: Record<string, string | number> | null) => {
    const li = document.createElement('li')
    const [rawValueColumn, rawValue] = value.split(':')
    const column = rawValueColumn.trim()
    const formattedValue = rawValue.trim()

    li.innerHTML = column + ': ' + (layerSettings?.prefix || '') + getFormattedValueForTheTooltipListItem(formattedValue, layerSettings?.precision) + (layerSettings?.suffix || '')

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
        if (layerVisualizationSettings.id === selectionConfiguration.selections[i].vizualizationType?.id && selectionConfiguration.selections[i].column === column) return true
    }

    const crossNavigationConfiguration = (widgetModel?.settings?.interactions?.crossNavigation ?? null) as IMapWidgetCrossNavigation | null
    if (!crossNavigationConfiguration) return false

    for (let i = crossNavigationConfiguration.crossNavigationVizualizationTypes.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === crossNavigationConfiguration.crossNavigationVizualizationTypes[i].vizualizationType?.id && crossNavigationConfiguration.crossNavigationVizualizationTypes[i].column === column) return true
    }

    const linkConfiguration = (widgetModel?.settings?.interactions?.link ?? null) as IMapWidgetLinkConfiguration | null
    if (!linkConfiguration) return false

    for (let i = linkConfiguration.linkVizualizationTypes.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === linkConfiguration.linkVizualizationTypes[i].vizualizationType?.id && linkConfiguration.linkVizualizationTypes[i].column === column) return true
    }

    const previewConfiguration = (widgetModel?.settings?.interactions?.preview ?? null) as IMapWidgetPreview | null
    if (!previewConfiguration) return false

    for (let i = previewConfiguration.previewVizualizationTypes.length - 1; i >= 0; i--) {
        if (layerVisualizationSettings.id === previewConfiguration.previewVizualizationTypes[i].vizualizationType?.id && previewConfiguration.previewVizualizationTypes[i].column === column) return true
    }

    return false
}
