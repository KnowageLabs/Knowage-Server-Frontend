import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapDialogSettings, IMapDialogSettingsProperty, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetCrossNavigation, IMapWidgetLayer, IMapWidgetLinkConfiguration, IMapWidgetPreview, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName } from '../LeafletHelper'
import L from 'leaflet'
import { ChartValuesRecord } from './MapChartsVizualizationHelper'
import { executeMapInteractions, matchesVisualizationType, columnsMatch } from '../interactions/MapInteractionsHelper'

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

    // Normalize settings.layers so we always work with an array of layers and columns/properties arrays
    const normalizedLayers = (settings?.layers || []).map((layer: any) => ({
        ...layer,
        // prefer the explicit `name` property, fall back to `label` if present
        name: layer.name ?? layer.label ?? '',
        columns: Array.isArray(layer.columns) ? layer.columns : layer.columns ? [layer.columns] : [],
        properties: Array.isArray(layer.properties) ? layer.properties : layer.properties ? [layer.properties] : []
    })) as any[]

    const layersList = normalizedLayers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target)
    // If there are no configured dialog layers for this visualization target, provide a simple fallback
    // showing the dataset row fields (if any) so the dialog still shows useful information.
    if (!layersList || layersList.length === 0) {
        const fallbackList = document.createElement('ul')
        fallbackList.classList.add('customLeafletPopup')

        const header = document.createElement('li')
        header.innerHTML = layerVisualizationSettings.layerName ?? layerVisualizationSettings.target ?? ''
        header.classList.add('customLeafletPopupListHeader')
        fallbackList.appendChild(header)

        // try to use meta.metaData.fields if present, otherwise fallback to keys of row
        const keys: string[] = []
        if (meta?.metaData?.fields && Array.isArray(meta.metaData.fields)) {
            meta.metaData.fields.forEach((f: any) => {
                if (f && f.header) keys.push(f.header)
            })
        } else if (row && typeof row === 'object') {
            Object.keys(row).forEach((k) => keys.push(k))
        }

        if (keys.length === 0) {
            // nothing informative, show the computed dataColumn or target
            fallbackList.appendChild(createTooltipListItem(`${layerVisualizationSettings.target}: ${''}`, (settings as any).style, null, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, {}))
        } else {
            keys.forEach((k) => {
                const displayValue = row && typeof row === 'object' ? row[k] ?? '' : ''
                fallbackList.appendChild(createTooltipListItem(`${k}: ${displayValue}`, (settings as any).style, null, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, row))
            })
        }

        if (tooltip) return L.tooltip().setContent(fallbackList)
        else return L.popup().setContent(fallbackList)
    }

    layersList.forEach((item: any) => {
        // For dataset targets use columns; for layer targets, prefer properties
        const candidates = item.columns && item.columns.length > 0 ? item.columns : item.properties || []
        ;(candidates || []).forEach((column: string) => {
            // search the normalized layers to avoid unexpected non-array shapes
            const layerSettings = normalizedLayers.find((layerSettings: any) => layerSettings.name === layerVisualizationSettings.target && ((layerSettings.columns || []).includes(column) || ((layerSettings as any).properties || []).includes(column)))

            const value = `${column}: ${row[getColumnName(column, meta)]}`
            const dataMap: Record<string, any> = {}

            meta.metaData?.fields.forEach((field: any) => {
                if (!field.dataIndex) return
                const val = row[field.dataIndex]
                // populate both name (programmatic column identifier) and header (display label)
                if (field.name) dataMap[field.name] = val
                if (field.header) dataMap[field.header] = val
            })

            list.appendChild(createTooltipListItem(value, (settings as IMapDialogSettings).style, layerSettings, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, dataMap))
        })
    })
    if (tooltip) return L.tooltip().setContent(list)
    else return L.popup().setContent(list)
}

export const addDialogToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    if (model.settings.dialog?.enabled) {
        const popup = createDialogFromDataset(false, layerVisualizationSettings, model.settings.dialog, data[target.label], row, model, activeSelections, dashboardId, variables)
        if (popup) marker.bindPopup(popup)
        // Re-attach click handlers after Leaflet adds the popup to the DOM. Leaflet
        // sometimes moves/clones nodes when opening popups which can remove event
        // listeners attached earlier. Use the popupopen event to attach handlers
        // to the actual DOM nodes that are shown.
        try {
            marker.on &&
                marker.on('popupopen', () => {
                    try {
                        const popup = marker.getPopup ? marker.getPopup() : null
                        const content = popup && popup.getContent ? popup.getContent() : null
                        if (content && content.querySelector) {
                            const clickables = Array.from(content.querySelectorAll('.clickable-custom-leaflet-list-item')) as HTMLElement[]
                            for (const item of clickables) {
                                if ((item as any).__kn_listener_attached) continue
                                item.addEventListener('click', (event) => {
                                    try {
                                        const current = (event.currentTarget || event.target) as any
                                        if (!current._dataMap) {
                                            const dm = current.getAttribute && current.getAttribute('data-datamap')
                                            if (dm) {
                                                try {
                                                    current._dataMap = JSON.parse(dm)
                                                } catch (err) {
                                                    current._dataMap = {}
                                                }
                                            }
                                        }
                                    } catch (err) {
                                        // ignore
                                    }

                                    executeMapInteractions({ currentTarget: item }, model, layerVisualizationSettings, activeSelections, dashboardId, variables)
                                })
                                ;(item as any).__kn_listener_attached = true
                            }
                        }
                    } catch (err) {
                        // ignore
                    }
                })
        } catch (err) {
            // ignore
        }
    }
}

export const addTooltipToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    if (model.settings.tooltips?.enabled) {
        const tooltip = createDialogFromDataset(true, layerVisualizationSettings, model.settings.tooltips, data[target.label], row, model, activeSelections, dashboardId, variables)
        if (tooltip) marker.bindTooltip(tooltip)
    }
}

export const addDialogToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null) => {
    if (!model.settings.dialog?.enabled) return
    const popup = createDialogForLayerData(feature, false, layerVisualizationSettings, model.settings.dialog, value, model, activeSelections, dashboardId, variables, foreignKeyValue)
    if (popup) marker.bindPopup(popup)
    // Re-attach click handlers after Leaflet opens the popup so they are bound
    // to the real DOM nodes Leaflet inserted.
    try {
        marker.on &&
            marker.on('popupopen', () => {
                try {
                    const popup = marker.getPopup ? marker.getPopup() : null
                    const content = popup && popup.getContent ? popup.getContent() : null
                    if (content && content.querySelector) {
                        const clickables = Array.from(content.querySelectorAll('.clickable-custom-leaflet-list-item')) as HTMLElement[]
                        for (const item of clickables) {
                            if ((item as any).__kn_listener_attached) continue
                            item.addEventListener('click', (event) => {
                                try {
                                    const current = (event.currentTarget || event.target) as any
                                    if (!current._dataMap) {
                                        const dm = current.getAttribute && current.getAttribute('data-datamap')
                                        if (dm) {
                                            try {
                                                current._dataMap = JSON.parse(dm)
                                            } catch (err) {
                                                current._dataMap = {}
                                            }
                                        }
                                    }
                                } catch (err) {
                                    // ignore
                                }

                                executeMapInteractions({ currentTarget: item }, model, layerVisualizationSettings, activeSelections, dashboardId, variables)
                            })
                            ;(item as any).__kn_listener_attached = true
                        }
                    }
                } catch (err) {
                    // ignore
                }
            })
    } catch (err) {
        // ignore
    }
}

export const addTooltipToMarkerForLayerData = (feature: ILayerFeature, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number | ChartValuesRecord, marker: any, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null) => {
    if (!model.settings.tooltips?.enabled) return
    const tooltip = createDialogForLayerData(feature, true, layerVisualizationSettings, model.settings.tooltips, value, model, activeSelections, dashboardId, variables, foreignKeyValue)
    if (tooltip) marker.bindTooltip(tooltip)
}

// Function that creates popup/tooltip for the maps that use layers as the target
export const createDialogForLayerData = (feature: ILayerFeature, tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, value: string | number | ChartValuesRecord, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], foreignKeyValue?: string | null) => {
    const container = document.createElement('div')
    // Normalize settings.layers and prefer a consistent `name` property
    const normalizedLayers = (settings?.layers || []).map((layer: any) => ({
        ...layer,
        name: layer.name ?? layer.label ?? '',
        columns: Array.isArray(layer.columns) ? layer.columns : layer.columns ? [layer.columns] : [],
        properties: Array.isArray(layer.properties) ? layer.properties : layer.properties ? [layer.properties] : []
    })) as any[]

    const layersList = normalizedLayers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target) as any

    // If there are no configured layers for this visualization target, provide a simple fallback
    // showing the feature properties (or the computed value) so users can inspect the layer on click.
    if (layersList?.length === 0) {
        const fallbackList = document.createElement('ul')
        fallbackList.classList.add('customLeafletPopup')

        const header = document.createElement('li')
        header.innerHTML = layerVisualizationSettings.layerName ?? layerVisualizationSettings.target ?? ''
        header.classList.add('customLeafletPopupListHeader')
        fallbackList.appendChild(header)

        const props = feature?.properties ?? {}
        const keys = Object.keys(props)

        if (keys.length === 0) {
            // If no properties are present, show the computed value
            fallbackList.appendChild(createTooltipListItem(`${layerVisualizationSettings.target}: ${value ?? ''}`, (settings as IMapDialogSettings).style, null, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, props))
        } else {
            keys.forEach((k) => {
                fallbackList.appendChild(createTooltipListItem(`${k}: ${props[k] ?? ''}`, (settings as IMapDialogSettings).style, null, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, props))
            })
        }

        container.appendChild(fallbackList)
        if (tooltip) return L.tooltip().setContent(container)
        else return L.popup().setContent(container)
    }

    // In the third use case (layer + external dataset), there are two dialogs:
    // one displaying the layer values and the other showing the values of the target dataset's foreign key column.
    if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        const targetDatasetList = document.createElement('ul')
        targetDatasetList.classList.add('customLeafletPopup')
        const _targetHeader = document.createElement('li')
        _targetHeader.innerHTML = layerVisualizationSettings.targetDataset ?? ''
        _targetHeader.classList.add('customLeafletPopupListHeader')
        targetDatasetList.appendChild(_targetHeader)
        targetDatasetList.appendChild(createTooltipListItem(`${layerVisualizationSettings.targetDatasetForeignKeyColumn}: ${getTooltipHeaderValue(value, layerVisualizationSettings.targetDatasetForeignKeyColumn, foreignKeyValue)}`, (settings as IMapDialogSettings).style, null, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables))
        container.appendChild(targetDatasetList)
    }

    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    layersList.forEach((item: any) => {
        if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetProperty) {
            const _layerHeader = document.createElement('li')
            _layerHeader.innerHTML = layerVisualizationSettings.layerName ?? ''
            _layerHeader.classList.add('customLeafletPopupListHeader')
            list.appendChild(_layerHeader)
        }
        // Candidate keys: columns (from dataset-style settings) or properties (layer-style settings)
        const candidates = item.columns && item.columns.length > 0 ? item.columns : item.properties || []
        ;(candidates || []).forEach((property: string) => {
            const layerSettings = (settings.layers || []).find((layerSettings: any) => layerSettings.name === layerVisualizationSettings.target && ((layerSettings.columns || []).includes(property) || ((layerSettings as any).properties || []).includes(property)))
            const dataMap = feature.properties
            // use normalized layers for safety when available
            const ls = normalizedLayers.find((s: any) => s.name === layerVisualizationSettings.target && ((s.columns || []).includes(property) || ((s as any).properties || []).includes(property)))
            list.appendChild(createTooltipListItem(`${property}: ${feature.properties[property] ?? ''}`, (settings as IMapDialogSettings).style, ls || layerSettings, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables, dataMap))
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

export const createTooltipListItem = (value: string, style: IListItemStyle | undefined, layerSettings: IMapDialogSettingsProperty | IMapTooltipSettingsLayer | null | undefined, widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, activeSelections: ISelection[], dashboardId: string, variables: IVariable[], dataMap?: Record<string, string | number> | null) => {
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

    if (dataMap) {
        try {
            // store a serialized copy so event handlers can recover the dataMap even
            // if Leaflet moves or clones nodes when attaching popup content
            li.setAttribute('data-datamap', JSON.stringify(dataMap))
        } catch (err) {
            // fall back to attaching directly to the element when serialization fails
            ;(li as any)._dataMap = dataMap
        }
    }

    if (style) {
        Object.entries(style).forEach(([key, val]) => {
            if (val) {
                li.style.setProperty(key, val)
            }
        })
    }

    li.addEventListener('click', (event) => {
        try {
            const current = (event.currentTarget || event.target) as any
            // if an attached _dataMap is not present (possible if DOM was cloned),
            // try to parse it from the serialized attribute
            if (!current._dataMap) {
                const dm = current.getAttribute && current.getAttribute('data-datamap')
                if (dm) {
                    try {
                        current._dataMap = JSON.parse(dm)
                    } catch (err) {
                        current._dataMap = {}
                    }
                }
            }
        } catch (err) {
            // ignore and continue to execute interaction
        }

        executeMapInteractions(event, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables)
    })

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
    if (selectionConfiguration && Array.isArray(selectionConfiguration.selections)) {
        for (let i = selectionConfiguration.selections.length - 1; i >= 0; i--) {
            const sel = selectionConfiguration.selections[i]
            if (matchesVisualizationType(sel.vizualizationType, layerVisualizationSettings) && columnsMatch(sel.column, column)) return true
        }
    }

    const crossNavigationConfiguration = (widgetModel?.settings?.interactions?.crossNavigation ?? null) as IMapWidgetCrossNavigation | null
    if (crossNavigationConfiguration && Array.isArray(crossNavigationConfiguration.crossNavigationVizualizationTypes)) {
        for (let i = crossNavigationConfiguration.crossNavigationVizualizationTypes.length - 1; i >= 0; i--) {
            const cfg = crossNavigationConfiguration.crossNavigationVizualizationTypes[i]
            if (matchesVisualizationType(cfg.vizualizationType, layerVisualizationSettings) && columnsMatch(cfg.column, column)) return true
        }
    }

    const linkConfiguration = (widgetModel?.settings?.interactions?.link ?? null) as IMapWidgetLinkConfiguration | null
    if (linkConfiguration && Array.isArray(linkConfiguration.linkVizualizationTypes)) {
        for (let i = linkConfiguration.linkVizualizationTypes.length - 1; i >= 0; i--) {
            const cfg = linkConfiguration.linkVizualizationTypes[i]
            if (matchesVisualizationType(cfg.vizualizationType, layerVisualizationSettings) && columnsMatch(cfg.column, column)) return true
        }
    }

    const previewConfiguration = (widgetModel?.settings?.interactions?.preview ?? null) as IMapWidgetPreview | null
    if (previewConfiguration && Array.isArray(previewConfiguration.previewVizualizationTypes)) {
        for (let i = previewConfiguration.previewVizualizationTypes.length - 1; i >= 0; i--) {
            const cfg = previewConfiguration.previewVizualizationTypes[i]
            if (matchesVisualizationType(cfg.vizualizationType, layerVisualizationSettings) && columnsMatch(cfg.column, column)) return true
        }
    }

    return false
}
