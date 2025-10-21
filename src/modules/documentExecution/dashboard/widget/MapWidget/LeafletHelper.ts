import { ISelection, IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeMarker } from './../../interfaces/mapWidget/DashboardMapWidget.d'
import L from 'leaflet'
import deepcopy from 'deepcopy'
import { getLayerData, getMapWidgetData } from './MapWidgetDataProxy'
import { wktToGeoJSON } from '@terraformer/wkt'
import { feature } from 'topojson-client'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { addMarkers } from './visualization/MapMarkersVizualizationHelper'
import { addBaloonMarkers } from './visualization/MapBaloonsVizualizationHelper'
import { addClusters, createClusterGroup } from './visualization/MapClustersVizualizationHelper'
import { addGeography } from './visualization/MapGeographyVizualizationHelper'
import { createChoropleth } from './visualization/MapChoroplethVizualizationHelper'
import { createHeatmapVisualization } from './visualization/MapHeatmapVizualizationHelper'
import { addMapCharts } from './visualization/MapChartsVizualizationHelper'
import useAppStore from '@/App.store'
import i18n from '@/App.i18n'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { executeMapInteractions } from './interactions/MapInteractionsHelper'

const appStore = useAppStore()
const { t } = i18n.global

export enum LEGEND_DATA_TYPE {
    BALLOONS_INTERVALS = 'BALLOONS_INTERVALS',
    BALLOONS_QUANTILES = 'BALLOONS_QUANTILES',
    BALLOONS_RANGES = 'BALLOONS_RANGES',
    CHARTS = 'CHARTS',
    HEATMAP = 'HEATMAP',
    CHOROPLETH_INTERVALS = ' CHOROPLETH_INTERVALS',
    CHOROPLETH_QUANTILES = ' CHOROPLETH_QUANTILES',
    CHOROPLETH_RANGES = ' CHOROPLETH_RANGES'
}

const legendData = {} as Record<string, any>

// Used in the Map Visualization Helper to determine which of the three use cases is selected in the settings.
// There is no explicit model property.
export enum VisualizationDataType {
    DATASET_ONLY,
    LAYER_ONLY,
    DATASET_AND_LAYER
}

export function getColumnName(column, data) {
    return data?.metaData?.fields?.find((field) => field.header === column)?.name ?? ''
}

// Used for adding a marker to Leaflet. If there is no MEASURE data (e.g., when only Geography is needed),
// the settings passed will be null, and the default ones from the first line will be used.
const createMarker = (position: number[] | string, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null, colorFromConditionalStyles?: string | undefined, iconFromConditionalStyles?: string | undefined) => {
    const markerColor = colorFromConditionalStyles ?? settings?.style?.color
    const markerIcon = iconFromConditionalStyles ?? (settings as IMapWidgetVisualizationTypeMarker)?.icon?.className
    const defaultMarkerSettings = { color: markerColor ?? '#0400f5ff', fillColor: markerColor ?? '#0400f5ff', radius: settings?.size || 10 }
    if (!settings) return L.circleMarker(position, defaultMarkerSettings)

    let icon

    if (!settings.type || settings.type === 'default') {
        return L.circleMarker(position, defaultMarkerSettings)
    }
    if (settings.type === 'icon') {
        icon = L.divIcon({
            html: `<i ${markerColor ? 'style="color:' + markerColor + '"' : ''} class="${markerIcon || 'fa fa-map-marker'} fa-2x"></i>`,
            shadowUrl: '',
            shadowSize: [1, 1],
            className: 'customLeafletIcon'
        })
    }
    if (settings.type === 'img') icon = L.icon({ iconUrl: settings.img, shadowUrl: settings.img, shadowSize: [1, 1] })
    if (settings.type === 'url') icon = L.icon({ iconUrl: settings.url, shadowUrl: settings.img, iconSize: [30, 30], shadowSize: [1, 1] })
    if (['img', 'icon', 'url'].includes(settings.type)) return L.marker(position, { icon: icon })
}

// Used for creating marker object
export const addMarker = (position: number[] | string, container: any, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null, value: number, spatialAttribute: any, colorFromConditionalStyles?: string | undefined, iconFromConditionalStyles?: string | undefined) => {
    let marker
    if (spatialAttribute?.properties?.coordType === 'json')
        L.geoJSON(JSON.parse(position as string), {
            pointToLayer: function (feature, latlng) {
                return (marker = createMarker(latlng, settings, colorFromConditionalStyles, iconFromConditionalStyles).addTo(container))
            }
        })
    else marker = createMarker(position, settings, colorFromConditionalStyles, iconFromConditionalStyles).addTo(container)
    marker.knProperties = { measureValue: value, layerId: container.knProperties.layerId }
    // Attach a click handler to each marker to open popup (if bound) and print marker information to console
    try {
        marker.on &&
            marker.on('click', (ev: any) => {
                // If a popup is bound, open it on click
                try {
                    if (marker.getPopup && marker.getPopup()) marker.openPopup()
                } catch (err) {
                    // ignore
                }

                // Print useful marker information for debugging
                try {
                    const popupContent = marker.getPopup ? (marker.getPopup() ? marker.getPopup().getContent() : null) : null
                    // emit event so parent wrapper or other components can react
                    try {
                        emitter.emit('mapMarkerClicked', { knProperties: marker.knProperties, eventLatLng: ev?.latlng ?? null, markerLatLng: marker.getLatLng ? marker.getLatLng() : null, popupContent })
                    } catch (emitErr) {
                        // ignore
                    }
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.log('Map marker clicked (could not fetch full details)', marker.knProperties)
                }
            })
    } catch (err) {
        // ignore if marker doesn't support events
    }
    return marker
}

// Used for getting coordinates, if the type is WKT we are transforming them using the wktToGeoJSON from the @terraformer/wkt lib
export function getCoordinates(spatialAttribute: any, input: string, coord?: string | null | undefined) {
    if (!spatialAttribute) return []

    if (spatialAttribute.properties.coordType === 'string') {
        return getCoordinatesFromString(spatialAttribute, input, coord)
    } else if (spatialAttribute.properties.coordType === 'json') {
        const coordinates = getCoordinatesFromJSONCoordType(input)
        return coordinates
    } else if (spatialAttribute.properties.coordType === 'wkt') {
        const formattedWKTInput = wktToGeoJSON(input)
        return formattedWKTInput?.coordinates ?? []
    }
}

const getCoordinatesFromString = (spatialAttribute: any, input: string, coord?: string | null) => {
    const cleanInput = input.replace(/"/g, '').trim()
    const [firstCoord, secondCoord] = cleanInput.split(' ')
    const isLatLon = spatialAttribute.properties.coordFormat === 'lat lon'

    if (coord === 'lon') return isLatLon ? secondCoord : firstCoord
    if (coord === 'lat') return isLatLon ? firstCoord : secondCoord

    return isLatLon ? [firstCoord, secondCoord] : [secondCoord, firstCoord]
}

const getCoordinatesFromJSONCoordType = (input: string) => {
    try {
        let sanitizedInput = input
            .replace(/\\/g, '')
            .replace(/(\w+)\s*:/g, '"$1":')
            .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, ': "$1"')

        const parsedInput = JSON.parse(sanitizedInput)

        if (!parsedInput) return []

        return parsedInput?.geometry?.coordinates ?? []
    } catch (error) {
        throw Error('Spatial attribute coordinates are not a valid JSON!')
    }
}

// Starting point for the data/layers logic
export async function initializeLayers(map: L.Map, model: IWidget, data: any, dashboardId: string, variables: IVariable[], activeSelections: ISelection[]) {
    const dashStore = dashboardStore()

    try {
        const markerBounds = [] as any
        const bounds = L.latLngBounds()
        let clusters = null as any
        let centerMap = model.settings?.configuration?.map?.autoCentering
        for (const layer of model.settings.visualizations) {
            const layerVisualizationSettings = deepcopy(layer)
            let reloadWithFilters = false

            if (layerVisualizationSettings?.filter?.enabled && layerVisualizationSettings?.filter?.reloaded) return
            if (layerVisualizationSettings?.filter && !layerVisualizationSettings.filter.reloaded) {
                removeLayerFromMap(map, layerVisualizationSettings.target)
                reloadWithFilters = true
                layerVisualizationSettings.filter.reloaded = true
            }

            let spatialAttribute = undefined as any
            let geoColumn: any = undefined
            let dataColumn: any = undefined
            let layersData = null as any
            let visualizationDataType = VisualizationDataType.DATASET_ONLY
            let targetDatasetData = null as any

            const target = model.layers.find((widgetLayer: IMapWidgetLayer) => widgetLayer.layerId === layerVisualizationSettings.target)

            // This section handles data loading. In the first case, the user selects a dataset as the target;
            // in the else case, the target is a layer.
            // There are two use cases: layer only and layer with a target dataset.
            // Here, we need to add a data proxy call for the target dataset.
            // Additionally, if the layer is WKT, there is commented-out code related to it.
            // The backend service for retrieving layers does not work properly for WKT.
            if (target.type === 'dataset') {
                visualizationDataType = VisualizationDataType.DATASET_ONLY
                spatialAttribute = target.columns.filter((i) => i.fieldType === 'SPATIAL_ATTRIBUTE')[0]
                geoColumn = getColumnName(spatialAttribute.name, data[target.label])
                dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[target.label])
            } else {
                visualizationDataType = VisualizationDataType.LAYER_ONLY
                layersData = await getLayerData(target)

                if (!layersData) return

                if (layersData.wkt) {
                    const wktData = layersData.wkt
                    const wktRegex = /(POINT\s*\([^\)]+\)|POINT\s*M\s*\([^\)]+\)|POINT\s*ZM\s*\([^\)]+\)|LINESTRING\s*\([^\)]+\)|POLYGON\s*\(\([^\)]+\)\))/g
                    const wktArray = wktData.match(wktRegex) || []

                    const geojsonGeometries = wktArray.map((wkt: string) => wktToGeoJSON(wkt))

                    const geojsonFeatures = {
                        type: 'FeatureCollection',
                        features: geojsonGeometries.map((geometry) => ({
                            type: 'Feature',
                            geometry: geometry,
                            properties: {}
                        }))
                    }

                    layersData = geojsonFeatures
                }

                if (layersData.type === 'Topology') {
                    const geojsonFeatures: any[] = Object.values(layersData.objects).flatMap((obj: any) => (feature(layersData, obj) as any).features ?? [])

                    layersData = {
                        type: 'FeatureCollection',
                        features: geojsonFeatures
                    }
                }

                // Use case when we have layer with the external dataset connected with foreign key
                if (layerVisualizationSettings.targetDataset) {
                    visualizationDataType = VisualizationDataType.DATASET_AND_LAYER
                    dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[layerVisualizationSettings.targetDataset])

                    const dashboardConfig = dashStore.dashboards[dashboardId]?.configuration
                    const selections = dashStore.getSelections(dashboardId) ?? []

                    let targetDatasetTempData = await getMapWidgetData(dashboardId, dashboardConfig, model, dashboardConfig.datasets, false, selections)

                    if (targetDatasetTempData?.[layerVisualizationSettings.targetDataset]) targetDatasetData = targetDatasetTempData[layerVisualizationSettings.targetDataset]
                }
            }

            const layerGroup = L.layerGroup().addTo(map)
            layerGroup.knProperties = { layerId: target.layerId, layerGroup: true }

            if (reloadWithFilters) centerMap = false

            if (layerVisualizationSettings.type === 'markers') {
                addMarkers(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData, variables, activeSelections, dashboardId)
            }

            if (layerVisualizationSettings.type === 'balloons') {
                const baloonsData = addBaloonMarkers(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, visualizationDataType, targetDatasetData, variables, activeSelections, dashboardId)
                legendData[layerVisualizationSettings.id] = baloonsData
            }

            if (layerVisualizationSettings.type === 'pies') {
                const chartsData = addMapCharts(data, model, target, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData, variables, activeSelections, dashboardId)
                legendData[layerVisualizationSettings.id] = chartsData
            }

            if (layerVisualizationSettings.type === 'clusters') {
                clusters = createClusterGroup(layerVisualizationSettings, target)
                addClusters(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData, variables, clusters, activeSelections, dashboardId)
            }

            if (layerVisualizationSettings.type === 'heatmap') {
                const heatmapData = createHeatmapVisualization(map, data, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, layersData, visualizationDataType, targetDatasetData, centerMap)
                legendData[layerVisualizationSettings.id] = heatmapData
            }

            if (layerVisualizationSettings.type === 'choropleth') {
                const choroplethData = createChoropleth(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, layersData, visualizationDataType, targetDatasetData, variables, bounds, activeSelections, dashboardId)
                legendData[layerVisualizationSettings.id] = choroplethData
            }

            if (layerVisualizationSettings.type === 'geography') {
                addGeography(data, target, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds, layersData, map, bounds)
            }
        }

        if (centerMap) centerTheMap(map, markerBounds, bounds, clusters)
    } catch (error: any) {
        console.log('------- ERROR - initializeLayers:', error)
        // TODO - add if needed for user
        // appStore.setError({
        //     title: t('common.toast.errorTitle'),
        //     msg: error ? error.message : ''
        // })
    } finally {
        return legendData
    }
}

const centerTheMap = (map: any, markerBounds: any[] | null, bounds: any, clusters: any) => {
    setTimeout(() => {
        map.invalidateSize()

        const combinedBounds = L.latLngBounds([])

        if (clusters && clusters.getLayers().length > 0) {
            combinedBounds.extend(clusters.getBounds())
        } else if (markerBounds && markerBounds.length > 0) {
            combinedBounds.extend(L.latLngBounds(markerBounds))
        }

        if (bounds.isValid()) {
            combinedBounds.extend(bounds)
        }

        if (combinedBounds.isValid()) {
            map.fitBounds(combinedBounds)

            const currentZoom = map.getZoom()
            map.setZoom(currentZoom - 1)
            setTimeout(() => map.setZoom(currentZoom), 50)
        }

        if (clusters) {
            clusters.on('animationend', () => {
                map.invalidateSize()
            })
        }

        map.invalidateSize()
    }, 100)
}

const removeLayerFromMap = (map: L.Map, layerId: string): void => {
    map?.eachLayer((layer: any) => {
        if (layer.knProperties?.layerId === layerId) layer.remove()
    })
}
