import { ISelection, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
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
export const createDialogFromDataset = (tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, meta: any, row: any, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string) => {
    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    const layersList = settings.layers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target)
    layersList.forEach((item: IMapTooltipSettingsLayer) => {
        item.columns.forEach((column: string) => {
            const value = `${column}: ${row[getColumnName(column, meta)]}`
            const dataMap = {}

            meta.metaData?.fields.forEach((field: any) => {
                if (!field.dataIndex) return
                dataMap[field.header] = row[field.dataIndex]
            })

            list.append(createTooltipListItem(value, (settings as IMapDialogSettings).style, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, dataMap))
        })
    })
    if (tooltip) return L.tooltip().setContent(list)
    else return L.popup().setContent(list)
}

export const addDialogToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string) => {
    if (model.settings.dialog?.enabled) {
        const popup = createDialogFromDataset(false, layerVisualizationSettings, model.settings.dialog, data[target.name], row, model, activeSelections, dashboardId)
        if (popup) marker.bindPopup(popup)
    }
}

export const addTooltipToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string) => {
    if (model.settings.tooltips?.enabled) {
        const tooltip = createDialogFromDataset(true, layerVisualizationSettings, model.settings.tooltips, data[target.name], row, model, activeSelections, dashboardId)
        if (tooltip) marker.bindTooltip(tooltip)
    }
}

export const addDialogToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, foreignKeyValue?: string | null) => {
    if (!model.settings.dialog?.enabled) return
    const popup = createDialogForLayerData(feature, false, layerVisualizationSettings, model.settings.dialog, value, model, activeSelections, dashboardId, foreignKeyValue)
    if (popup) marker.bindPopup(popup)
}

export const addTooltipToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, foreignKeyValue?: string | null) => {
    if (!model.settings.tooltips?.enabled) return
    const tooltip = createDialogForLayerData(feature, true, layerVisualizationSettings, model.settings.tooltips, value, model, activeSelections, dashboardId, foreignKeyValue)
    if (tooltip) marker.bindTooltip(tooltip)
}

// Function that creates popup/tooltip for the maps that use layers as the target
const createDialogForLayerData = (feature: ILayerFeature, tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, value: string | number | ChartValuesRecord, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, foreignKeyValue?: string | null) => {
    const container = document.createElement('div')
    const layersList = settings.layers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target) as any

    if (layersList?.length === 0) return null

    // In the third use case (layer + external dataset), there are two dialogs:
    // one displaying the layer values and the other showing the values of the target dataset's foreign key column.
    if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        const targetDatasetList = document.createElement('ul')
        targetDatasetList.classList.add('customLeafletPopup')
        targetDatasetList.append(createTooltipListHeader(layerVisualizationSettings.targetDataset))
        targetDatasetList.append(createTooltipListItem(`${layerVisualizationSettings.targetDatasetForeignKeyColumn}: ${getTooltipHeaderValue(value, layerVisualizationSettings.targetDatasetForeignKeyColumn, foreignKeyValue)}`, (settings as IMapDialogSettings).style, widgetModel, layerVisualizationSettings, activeSelections, dashboardId))
        container.appendChild(targetDatasetList)
    }

    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    layersList.forEach((item: IMapTooltipSettingsLayer) => {
        if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetProperty) list.append(createTooltipListHeader(item.name))
        item.columns.forEach((property: string) => {
            const dataMap = feature.properties
            list.append(createTooltipListItem(`${property}: ${feature.properties[property] ?? ''}`, (settings as IMapDialogSettings).style, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, dataMap))
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

const createTooltipListItem = (value: string, style: IListItemStyle | undefined, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, activeSelections: ISelection[], dashboardId: string, dataMap?: Record<string, string | number> | null) => {
    const li = document.createElement('li')
    li.innerHTML = value

    li.classList.add('kn-cursor-pointer')

    li.setAttribute('data-value', value)
    li.setAttribute('data-layerId', layerVisualizationSettings.target)
    if (dataMap) (li as any)._dataMap = dataMap

    if (style) {
        Object.entries(style).forEach(([key, val]) => {
            if (val) {
                li.style.setProperty(key, val)
            }
        })
    }

    li.addEventListener('click', (event) => executeMapInteractions(event, widgetModel, layerVisualizationSettings, activeSelections, dashboardId))

    return li
}
