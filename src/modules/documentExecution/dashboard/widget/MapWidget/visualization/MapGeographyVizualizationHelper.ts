import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getCoordinates } from '../LeafletHelper'
import { getCoordinatesFromWktPointFeature } from './MapVisualizationHelper'
import L from 'leaflet'
import { createDialogForLayerData, addDialogToMarkerForLayerData, addTooltipToMarkerForLayerData } from './MapDialogHelper'

// Showing only the defined data, no measures, no extra logic. It will show all Point, LineString and Polygon from WKT.
export const addGeography = (data: any, model: any, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, markerBounds: any[], layersData: any, variables: any[], activeSelections: any[], dashboardId: string, map: any, bounds: any) => {
    if (data && data[target.id]) {
        addGeograhyFromData(data, model, target, layerVisualizationSettings, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds, variables, activeSelections, dashboardId)
    } else {
        addGeographyUsingLayers(layersData, model, target, layerVisualizationSettings, spatialAttribute, layerGroup, markerBounds, bounds, variables, activeSelections, dashboardId)
    }
}

const addGeograhyFromData = (data: any, model: any, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, markerBounds: any[], variables: any[], activeSelections: any[], dashboardId: string) => {
    for (const row of data[target.id].rows) {
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        if (!coordinates) return
        const marker = addMarker(coordinates, layerGroup, null, row[dataColumn], spatialAttribute)
        markerBounds.push(marker.getLatLng())
        // attach dialog/tooltip for dataset-backed geography
        try {
            addDialogToMarkerForLayerData(row, model, layerVisualizationSettings, row[dataColumn], marker, activeSelections, dashboardId, variables)
            addTooltipToMarkerForLayerData(row, model, layerVisualizationSettings, row[dataColumn], marker, activeSelections, dashboardId, variables)
        } catch (err) {
            // ignore
        }
    }
}

const addGeographyUsingLayers = (layersData: any, model: any, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, spatialAttribute: any, layerGroup: any, markerBounds: any[], bounds: any, variables: any[], activeSelections: any[], dashboardId: string) => {
    layersData.features.forEach((feature: ILayerFeature) => {
        const type = feature.geometry?.type
        if (!type) return
        if (type === 'Point') {
            const coordinates = getCoordinatesFromWktPointFeature(feature)
            if (!coordinates) return
            const marker = addMarker(coordinates.reverse(), layerGroup, null, 0, spatialAttribute)
            markerBounds.push(marker.getLatLng())
            try {
                addDialogToMarkerForLayerData(feature, model, layerVisualizationSettings, 0, marker, activeSelections, dashboardId, variables)
                addTooltipToMarkerForLayerData(feature, model, layerVisualizationSettings, 0, marker, activeSelections, dashboardId, variables)
            } catch (err) {
                // ignore
            }
        } else if (type === 'MultiPoint') {
            const multiPointCoords = (feature.geometry.coordinates as any).map(([x, y]: [number, number]) => [y, x])
            multiPointCoords.forEach((coord: number[]) => markerBounds.push(L.latLng(coord)))
            L.layerGroup(multiPointCoords.map((coord: number[]) => L.marker(coord).addTo(layerGroup))).addTo(layerGroup)
        } else if (type === 'LineString') {
            L.polyline(feature.geometry.coordinates.reverse(), { color: 'blue' }).addTo(layerGroup)
        } else if (type === 'MultiLineString') {
            const multiLineCoords = (feature.geometry.coordinates as any).map((line: any) => line.map(([x, y]: [number, number]) => [y, x]))
            L.layerGroup(multiLineCoords.map((coords: number[]) => L.polyline(coords, { color: 'blue' }).addTo(layerGroup))).addTo(layerGroup)
        } else if (type === 'Polygon' || type === 'MultiPolygon') {
            let polygonCoords: any
            if (type === 'Polygon') {
                polygonCoords = (feature.geometry.coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
            } else if (type === 'MultiPolygon') {
                polygonCoords = (feature.geometry.coordinates as any).map((polygon: any) => polygon.map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x])))
            }

            const polygon = L.polygon(polygonCoords).addTo(layerGroup)
            bounds.extend(polygon.getBounds())
            try {
                const props = (feature as any).properties ?? {}
                const keys = Object.keys(props)
                const list = document.createElement('ul')
                list.classList.add('customLeafletPopup')
                const header = document.createElement('li')
                header.classList.add('customLeafletPopupListHeader')
                header.innerHTML = layerVisualizationSettings.layerName ?? layerVisualizationSettings.target ?? ''
                list.appendChild(header)
                if (keys.length === 0) {
                    list.appendChild(createDialogForLayerData(feature, false, layerVisualizationSettings, { layers: [] } as any, '', model, activeSelections, dashboardId, variables) as any)
                } else {
                    keys.forEach((k) => {
                        const li = document.createElement('li')
                        li.innerHTML = `${k}: ${props[k] ?? ''}`
                        list.appendChild(li)
                    })
                }
                polygon.bindPopup(list)
            } catch (err) {
                // ignore
            }
        }
    })
}
