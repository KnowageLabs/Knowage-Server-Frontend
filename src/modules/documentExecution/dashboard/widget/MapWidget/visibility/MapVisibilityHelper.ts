import { centerAndRedrawTheLayerOnMap } from '../visualization/MapHeatmapVizualizationHelper'
import deepcopy from 'deepcopy'
import L from 'leaflet'

const clusterLayerCache = {} as Record<string, { layer: any }>
const heatmapLayersCache = {} as Record<string, { layer: any; heatMapData: number[][]; heatMapOptions: any }>

export const switchLayerVisibility = (map: L.Map, visibleLayers: any): void => {
    map?.eachLayer((layer: any) => {
        if (layer.knProperties?.layerGroup) {
            console.log('------- ENTERED 1 !!!!: ', layer)
            if (!visibleLayers[layer.knProperties.layerId]) {
                layer.hide()
            } else {
                layer.show()
            }
            return
        }

        if (layer.knProperties?.cluster && !visibleLayers[layer.knProperties.layerId]) {
            clusterLayerCache[layer.knProperties.layerId] = { layer: layer }
            layer.remove()
            return
        }

        showLayersFromCache(visibleLayers, map)

        // TODO
        // changeHeatmapLayerVisibility(layer, visibleLayers, map)
    })
}

const showLayersFromCache = (visibleLayers: any, map: any) => {
    showClusterLayersFromCache(visibleLayers, map)
}

const showClusterLayersFromCache = (visibleLayers: any, map: any) => {
    console.log('------- visibleLayers: ', visibleLayers)
    Object.entries(clusterLayerCache).forEach((cachedLayer: any) => {
        const layerId = cachedLayer[0]
        if (visibleLayers[layerId] && cachedLayer[1]?.layer) {
            console.log('-------- cached Layer: ', cachedLayer)
            cachedLayer[1].layer.addTo(map)
        }
    })
}

const changeHeatmapLayerVisibility = (layer: any, visibleLayers: any, map: any) => {
    if (!visibleLayers[layer.knProperties?.layerId] && !heatmapLayersCache[layer.knProperties?.layerId]?.layer) {
        heatmapLayersCache[layer.knProperties.layerId] = { layer: layer, heatMapData: deepcopy(layer._latlngs), heatMapOptions: deepcopy(layer.options) }

        map.removeLayer(layer)
    } else if (visibleLayers[layer.knProperties?.layerId] && heatmapLayersCache[layer.knProperties.layerId]?.layer != null) {
        map.whenReady(() => {
            const heatMapData = heatmapLayersCache[layer.knProperties.layerId].heatMapData
            const heatMapOptions = heatmapLayersCache[layer.knProperties.layerId].heatMapOptions

            heatmapLayersCache[layer.knProperties.layerId].layer = L.heatLayer(heatMapData ?? [], {
                radius: heatMapOptions.radius,
                blur: heatMapOptions.blur,
                maxZoom: heatMapOptions.maxZoom,
                max: heatMapOptions.max
            })
            heatmapLayersCache[layer.knProperties.layerId].layer.knProperties = { heatmap: true, layerId: layer.knProperties.layerId }
            heatmapLayersCache[layer.knProperties.layerId].layer.addTo(map)

            centerAndRedrawTheLayerOnMap(map, heatmapLayersCache[layer.knProperties.layerId].layer, heatMapData)

            heatmapLayersCache[layer.knProperties.layerId] = { layer: null, heatMapData: [], heatMapOptions: {} }
        })
    }
}

export const clearLayersCache = () => {
    Object.keys(clusterLayerCache).forEach((key) => {
        delete clusterLayerCache[key]
    })
    Object.keys(heatmapLayersCache).forEach((key) => {
        delete heatmapLayersCache[key]
    })
}
