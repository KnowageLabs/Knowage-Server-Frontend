import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ILayerFeature, IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeMarker } from './../../interfaces/mapWidget/DashboardMapWidget.d'
import L from 'leaflet'
import italy from './italy.json'
import { IMapWidgetVisualizationType } from '../../interfaces/mapWidget/DashboardMapWidget'
import deepcopy from 'deepcopy'
import { addBaloonMarkers, addClusters, addGeography, addMarkers } from './visualization/MapVisualizationHelper'
import { getLayerData } from './MapWidgetDataProxy'
import targetDatasetDataMock from './target-dataset-data-mock.json'
import { createDialogFromDataset } from './visualization/MapDialogHelper'
import wktMock from './wkt-mock.json'
import { wktToGeoJSON } from '@terraformer/wkt'

export enum VisualizationDataType {
    DATASET_ONLY,
    LAYER_ONLY,
    DATASET_AND_LAYER
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

function createMarker(position, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null) {
    const defaultMarkerSettings = { color: settings?.style?.color ?? '', fillColor: settings?.style?.color ?? '', radius: settings?.size || 10 }
    if (!settings) return L.marker(position, defaultMarkerSettings)

    let icon

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

export function addMarker(position: number[] | string, container: any, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null, value: number, spatialAttribute: any) {
    let marker
    if (spatialAttribute?.properties?.coordType === 'json')
        L.geoJSON(JSON.parse(position as string), {
            pointToLayer: function (feature, latlng) {
                return (marker = createMarker(latlng, settings).addTo(container))
            }
        })
    marker = createMarker(position, settings).addTo(container)
    marker.knProperties = { measureValue: value, layerId: container.knProperties.layerId }
    return marker
}

export function createGeography(map: L.Map, features, data) {
    return L.geoJson(features, getGeographyStyle).addTo(map)
}

export function getCoordinates(spatialAttribute, input, coord?) {
    if (!spatialAttribute) return []

    if (spatialAttribute.properties.coordType === 'string') {
        if (spatialAttribute.properties.coordFormat === 'lat lon') {
            if (coord === 'lat') return input.split(' ')[0]
            if (coord === 'lon') return input.split(' ')[1]
            else return input.split(' ')
        }
    } else if (spatialAttribute.properties.coordType === 'json') return input
    else if (spatialAttribute.properties.coordType === 'wkt') {
        const formattedWKTInput = wktToGeoJSON(input)
        return formattedWKTInput?.coordinates ?? []
    }
}

export async function initializeLayers(map: L.Map, model: any, data: any) {
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

        if (target.type === 'dataset') {
            visualizationDataType = VisualizationDataType.DATASET_ONLY
            spatialAttribute = target.columns.filter((i) => i.fieldType === 'SPATIAL_ATTRIBUTE')[0]
            geoColumn = getColumnName(spatialAttribute.name, data[target.name])
            dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[target.name])
        } else {
            visualizationDataType = VisualizationDataType.LAYER_ONLY
            layersData = await getLayerData(target)
            // TODO - Remove mock
            // layersData = wktMock

            // console.log('------------ wktMock DATA: ', wktMock)
            // if (layersData.type === 'wkt') {
            //     console.log('----- wktMock: ', wktMock)
            //     const wktData = wktMock.data
            //     const cleanWKT = (wktData) => {
            //         return wktData.replace(/\bM\b|\bZM\b/g, '').replace(/\(\s*(-?\d+(\.\d+)?\s+-?\d+(\.\d+)?)(\s+-?\d+(\.\d+)?)?(\s+-?\d+(\.\d+)?)?\s*\)/g, (match, p1) => {
            //             return `(${p1})` // Keeps only X, Y, and optionally Z
            //         })
            //     }
            //     const geojsonGeometries = wktData.map((wkt) => wktToGeoJSON(cleanWKT(wkt)))
            //     console.log('----- geojsonGeometries: ', geojsonGeometries)

            //     const geojsonFeatures = {
            //         type: 'FeatureCollection',
            //         features: geojsonGeometries.map((geometry) => ({
            //             type: 'Feature',
            //             geometry: geometry,
            //             properties: {}
            //         }))
            //     }
            //     console.log('----- geojsonFeatures: ', geojsonFeatures)
            //     layersData = geojsonGeometries
            //}

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
            addMarkers(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'balloons') {
            addBaloonMarkers(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'clusters') {
            addClusters(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData)
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

        if (layerVisualizationSettings.type === 'geography') {
            addGeography(data, target, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds, layersData)
        }
    }

    if (model.settings.configuration.map.autoCentering && markerBounds.length > 0) map.fitBounds(L.latLngBounds(markerBounds))
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
