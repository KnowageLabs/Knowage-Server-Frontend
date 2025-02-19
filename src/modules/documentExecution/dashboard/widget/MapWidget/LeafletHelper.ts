import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeMarker } from './../../interfaces/mapWidget/DashboardMapWidget.d'
import L from 'leaflet'
import italy from './italy.json'
import { IMapWidgetVisualizationType } from '../../interfaces/mapWidget/DashboardMapWidget'
import deepcopy from 'deepcopy'
import { addBaloonMarkers } from './visualization/MapVisualizationHelper'
import { getLayerData, getMapWidgetData } from './MapWidgetDataProxy'
import targetDatasetDataMock from './target-dataset-data-mock.json'

export enum VisualizationDataType {
    DATASET_ONLY,
    LAYER_ONLY,
    DATASET_AND_LAYER
}

function createDialog(tooltip, layerVisualizationSettings: IMapWidgetVisualizationType, settings, meta, row) {
    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')
    const layersList = settings.layers.filter((l) => l.name === layerVisualizationSettings.target)
    layersList.forEach((item) => {
        item.columns.forEach((column) => {
            const li = document.createElement('li')
            //TODO set style
            li.innerHTML = `${column}: ${row[getColumnName(column, meta)]}`
            list.append(li)
        })
    })
    if (tooltip) return L.tooltip().setContent(list)
    else return L.popup().setContent(list)
}

export function getColumnName(column, data) {
    return data.metaData.fields.find((field) => field.header === column).name
}

function isConditionValid(operator: string, measureValue: any, value: any): boolean {
    if (operator === '=') return measureValue == value
    if (operator === '>') return measureValue > value
    if (operator === '<') return measureValue < value
    return false
}

function getGeographyStyle(feature) {
    return {
        fillColor: 'blue',
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    }
}

function createMarker(position, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons) {
    let icon
    const defaultMarkerSettings = { color: settings.style?.color ?? '', fillColor: settings.style?.color ?? '', radius: settings?.size || 10 }
    if (!settings.type || settings.type === 'default') {
        return L.circleMarker(position, defaultMarkerSettings)
    }
    if (settings.type === 'icon') {
        icon = L.divIcon({
            html: `<i ${settings.style?.color ? 'style="color:' + settings.style.color + '"' : ''} class="${settings.icon?.className || 'fa fa-map-marker'} fa-2x"></i>`,
            shadowUrl: '',
            shadowSize: [1, 1],
            className: 'customLeafletIcon'
        })
    }
    if (settings.type === 'img') icon = L.icon({ iconUrl: settings.img, shadowUrl: settings.img, shadowSize: [1, 1] })
    if (settings.type === 'url') icon = L.icon({ iconUrl: settings.url, shadowUrl: settings.img, iconSize: [30, 30], shadowSize: [1, 1] })
    if (['img', 'icon', 'url'].includes(settings.type)) return L.marker(position, { icon: icon })
}

export function addMarker(position: number[] | string, container: any, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | undefined, value: number, spatialAttribute: any) {
    if (!settings) return
    let marker
    if (spatialAttribute?.properties?.coordType === 'json')
        L.geoJSON(JSON.parse(position as string), {
            pointToLayer: function (feature, latlng) {
                return (marker = createMarker(latlng, settings).addTo(container))
            }
        })
    else marker = createMarker(position, settings).addTo(container)
    marker.knProperties = { measureValue: value, layerId: container.knProperties.layerId }
    return marker
}

export function createGeography(map: L.Map, features, data) {
    return L.geoJson(features, getGeographyStyle).addTo(map)
}

export function getCoordinates(spatialAttribute, input, coord?) {
    if (spatialAttribute) {
        if (spatialAttribute.properties.coordType === 'string') {
            if (spatialAttribute.properties.coordFormat === 'lat lon') {
                if (coord === 'lat') return input.split(' ')[0]
                if (coord === 'lon') return input.split(' ')[1]
                else return input.split(' ')
            }
        }
        if (spatialAttribute.properties.coordType === 'json') return input
    }
}

export async function initializeLayers(map: L.Map, model: any, data: any) {
    console.log('--- MODEL: ', model)
    const markerBounds = [] as any
    for (const layer of model.settings.visualizations) {
        const layerVisualizationSettings = deepcopy(layer)
        let spatialAttribute = undefined as any
        let geoColumn: any = undefined
        let dataColumn: any = undefined
        let layersData = null as any
        let visualizationDataType = VisualizationDataType.DATASET_ONLY
        let targetDatasetData = null as any

        const target = model.layers.find((widgetLayer: IMapWidgetLayer) => widgetLayer.layerId === layerVisualizationSettings.target)
        console.log('--------- TARGET: ', target)

        if (target.type === 'dataset') {
            visualizationDataType = VisualizationDataType.DATASET_ONLY
            spatialAttribute = target.columns.filter((i) => i.fieldType === 'SPATIAL_ATTRIBUTE')[0]
            geoColumn = getColumnName(spatialAttribute.name, data[target.name])
            dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[target.name])
        } else {
            visualizationDataType = VisualizationDataType.LAYER_ONLY
            layersData = await getLayerData(target)
            if (layerVisualizationSettings.targetDataset) {
                visualizationDataType = VisualizationDataType.DATASET_AND_LAYER
                dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[layerVisualizationSettings.targetDataset])
                // TODO - Remove Mocked
                targetDatasetData = deepcopy(targetDatasetDataMock)
            }
        }

        const layerGroup = L.layerGroup().addTo(map)
        layerGroup.knProperties = { layerId: target.layerId, layerGroup: true }

        if (layerVisualizationSettings.type === 'markers') {
            for (const row of data[target.name].rows) {
                const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.markerConf, row[dataColumn], spatialAttribute)
                markerBounds.push(marker.getLatLng())
                if (model.settings.dialog?.enabled) {
                    const popup = createDialog(false, layerVisualizationSettings, model.settings.dialog, data[target.name], row)
                    marker.bindPopup(popup)
                }
                if (model.settings.tooltips?.enabled) {
                    const tooltip = createDialog(true, layerVisualizationSettings, model.settings.tooltips, data[target.name], row)
                    marker.bindTooltip(tooltip)
                }
            }
        }

        if (layerVisualizationSettings.type === 'balloons') {
            addBaloonMarkers(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'clusters') {
            const clusters = L.markerClusterGroup()
            clusters.knProperties = { cluster: true, layerId: target.layerId }
            for (const row of data[target.name].rows) {
                const marker = addMarker(getCoordinates(spatialAttribute, row.column_1, null), layerGroup, layerVisualizationSettings.markerConf, row.column_2, spatialAttribute)
                clusters.addLayer(marker)
                markerBounds.push(marker.getLatLng())
                layerGroup.addLayer(clusters)
            }
        }

        if (layerVisualizationSettings.type === 'heatmap') {
            const values = { data: [] } as any
            for (const row of data[target.name].rows) {
                values.data.push({ lat: row.column_1.split(' ')[0], lon: row.column_1.split(' ')[1], value: row.column_2 })
                markerBounds.push({ lat: row.column_1.split(' ')[0], lng: row.column_1.split(' ')[1] })
            }
            const heatmapLayer = new HeatmapOverlay({
                radius: 0.05,
                maxOpacity: 0.5,
                scaleRadius: true,
                latField: 'lat',
                lngField: 'lon',
                value: 'count'
            })
            heatmapLayer.setData(values)
            layerGroup.addLayer(heatmapLayer)
        }

        if (layerVisualizationSettings.type === 'choropleth') {
            const geography = createGeography(map, italy, data)
            markerBounds.push(geography.getBounds())
        }
    }

    if (model.settings.configuration.map.autoCentering && markerBounds.length > 0) map.fitBounds(L.latLngBounds(markerBounds))
}

export const addDialogToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any) => {
    if (model.settings.dialog?.enabled) {
        const popup = createDialog(false, layerVisualizationSettings, model.settings.dialog, data[target.name], row)
        marker.bindPopup(popup)
    }
}

export const addTooltipToMarker = (data: any, model: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, row: any, marker: any) => {
    if (model.settings.tooltips?.enabled) {
        const tooltip = createDialog(true, layerVisualizationSettings, model.settings.tooltips, data[target.name], row)
        marker.bindTooltip(tooltip)
    }
}

export function filterLayers(map: L.Map, layers): void {
    layers.forEach((layer) => {
        if (layer.filter?.enabled) {
            map.eachLayer((i) => {
                if (i.knProperties?.layerId === layer.layerId) {
                    if (!layer.filter.value || isConditionValid(layer.filter.operator, i.knProperties.measureValue, layer.filter.value)) i.show()
                    else i.hide()
                }
            })
        }
    })
}

export function switchLayerVisibility(map: L.Map, visibleLayers): void {
    map.eachLayer((layer) => {
        if (layer.knProperties?.layerGroup) {
            if (!visibleLayers[layer.knProperties.layerId]) layer.hide()
            else layer.show()
        }
        if (layer.knProperties?.cluster) {
            if (!visibleLayers[layer.knProperties.layerId]) layer.removeLayer()
            else layer.show()
        }
    })
}

export const addDialogToMarkerForLayerData = (feature: any, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number, marker: any) => {
    if (model.settings.dialog?.enabled) {
        const popup = createDialogForLayerData(feature, false, layerVisualizationSettings, model.settings.tooltips, value)
        marker.bindPopup(popup)
    }
}

export const addTooltipToMarkerForLayerData = (feature: any, model: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType, value: string | number, marker: any) => {
    if (model.settings.tooltips?.enabled) {
        const tooltip = createDialogForLayerData(feature, true, layerVisualizationSettings, model.settings.tooltips, value)
        marker.bindTooltip(tooltip)
    }
}

function createDialogForLayerData(feature: any, tooltip: boolean, layerVisualizationSettings: IMapWidgetVisualizationType, settings: IMapTooltipSettings | IMapDialogSettings, value: string | number) {
    console.log('---------- FEATURE: ', feature)
    const container = document.createElement('div')
    const layersList = settings.layers.filter((layer: IMapTooltipSettingsLayer) => layer.name === layerVisualizationSettings.target) as any

    if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetProperty) {
        const targetDatasetList = document.createElement('ul')
        targetDatasetList.classList.add('customLeafletPopup')
        targetDatasetList.append(createTooltipListHeader(layerVisualizationSettings.targetDataset))
        targetDatasetList.append(createTooltipListItem(`${layerVisualizationSettings.targetProperty}: ${value}`))
        container.appendChild(targetDatasetList)
    }

    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')

    layersList.forEach((item: IMapTooltipSettingsLayer) => {
        if (layerVisualizationSettings.targetDataset && layerVisualizationSettings.targetProperty) list.append(createTooltipListHeader(item.name))
        item.columns.forEach((property: string) => list.append(createTooltipListItem(`${property}: ${feature.properties[property] ?? ''}`)))
    })

    container.appendChild(list)
    if (tooltip) return L.tooltip().setContent(container)
    else return L.popup().setContent(container)
}

const createTooltipListHeader = (header: string) => {
    const headerElement = document.createElement('li')
    headerElement.innerHTML = header
    headerElement.classList.add('customLeafletPopupListHeader')
    return headerElement
}

const createTooltipListItem = (value: string) => {
    const li = document.createElement('li')
    //TODO set style
    li.innerHTML = value
    return li
}
