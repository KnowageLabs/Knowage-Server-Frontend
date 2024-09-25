import L from 'leaflet'
import italy from './italy.json'

function createDialog(tooltip, layer, settings, meta, row) {
    const list = document.createElement('ul')
    list.classList.add('customLeafletPopup')
    const layersList = settings.layers.filter((l) => l.name === layer.target)
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

function getColumnName(column, data) {
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

function createMarker(position, settings) {
    let icon
    const defaultMarkerSettings = { color: settings.style.color, radius: settings.size || 10 }
    if (settings.type === 'default') {
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

export function addMarker(position, container, settings, value?: any, spatialAttribute?) {
    let marker
    if (spatialAttribute.properties.coordType === 'json')
        L.geoJSON(JSON.parse(position), {
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

function getCoordinates(spatialAttribute, input, coord?) {
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

export function initializeLayers(map: L.Map, model: any, data: any): void {
    const markerBounds = [] as any
    model.settings.visualizations.forEach((layer) => {
        let spatialAttribute = undefined
        let geoColumn: any = undefined
        let dataColumn: any = undefined
        const target = model.layers.filter((i) => i.layerId === layer.target)[0]
        if (target.type === 'dataset') {
            spatialAttribute = target.columns.filter((i) => i.fieldType === 'SPATIAL_ATTRIBUTE')[0]
            geoColumn = getColumnName(spatialAttribute.name, data[target.name])
            dataColumn = getColumnName(layer.targetMeasure, data[target.name])
        }
        const layerGroup = L.layerGroup().addTo(map)
        layerGroup.knProperties = { layerId: target.layerId, layerGroup: true }
        if (layer.type === 'markers') {
            data[target.name].rows.forEach((row) => {
                const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layer.markerConf, row[dataColumn], spatialAttribute)
                markerBounds.push(marker.getLatLng())
                if (model.settings.dialog?.enabled) {
                    const popup = createDialog(false, layer, model.settings.dialog, data[target.name], row)
                    marker.bindPopup(popup)
                }
                if (model.settings.tooltips?.enabled) {
                    const tooltip = createDialog(true, layer, model.settings.tooltips, data[target.name], row)
                    marker.bindTooltip(tooltip)
                }
            })
        }
        if (layer.type === 'clusters') {
            var clusters = L.markerClusterGroup()
            clusters.knProperties = { cluster: true, layerId: target.layerId }
            data[target.name].rows.forEach((row) => {
                const marker = addMarker(getCoordinates(spatialAttribute, row.column_1, null), layerGroup, layer.markerConf, row.column_2, spatialAttribute)
                clusters.addLayer(marker)
                markerBounds.push(marker.getLatLng())
                layerGroup.addLayer(clusters)
            })
        }
        if (layer.type === 'heatmap') {
            const values = { data: [] } as any
            data[target.name].rows.forEach((row) => {
                values.data.push({ lat: row.column_1.split(' ')[0], lon: row.column_1.split(' ')[1], value: row.column_2 })
                markerBounds.push({ lat: row.column_1.split(' ')[0], lng: row.column_1.split(' ')[1] })
            })
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
        if (layer.type === 'choropleth') {
            const geography = createGeography(map, italy, data)
            markerBounds.push(geography.getBounds())
        }
    })
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
