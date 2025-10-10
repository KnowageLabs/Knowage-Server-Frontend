import { ILayerFeature, IMapWidgetLayer } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getCoordinates } from '../LeafletHelper'
import { getCoordinatesFromWktPointFeature } from './MapVisualizationHelper'
import L from 'leaflet'

// Showing only the defined data, no measures, no extra logic. It will show all Point, LineString and Polygon from WKT.
export const addGeography = (data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, markerBounds: any[], layersData: any, map: any, bounds: any) => {
    if (data && data[target.label]) {
        addGeograhyFromData(data, target, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds)
    } else {
        addGeographyUsingLayers(layersData, spatialAttribute, layerGroup, markerBounds, bounds)
    }
}

const addGeograhyFromData = (data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, markerBounds: any[]) => {
    for (const row of data[target.label].rows) {
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        if (!coordinates) return
        const marker = addMarker(coordinates, layerGroup, null, row[dataColumn], spatialAttribute)
        markerBounds.push(marker.getLatLng())
    }
}

const addGeographyUsingLayers = (layersData: any, spatialAttribute: any, layerGroup: any, markerBounds: any[], bounds: any) => {
    layersData.features.forEach((feature: ILayerFeature) => {
        const type = feature.geometry?.type
        if (!type) return
        if (type === 'Point') {
            const coordinates = getCoordinatesFromWktPointFeature(feature)
            if (!coordinates) return
            const marker = addMarker(coordinates.reverse(), layerGroup, null, 0, spatialAttribute)
            markerBounds.push(marker.getLatLng())
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
        }
    })
}
