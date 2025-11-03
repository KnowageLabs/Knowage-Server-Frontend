import { centerAndRedrawTheLayerOnMap } from '../visualization/MapHeatmapVizualizationHelper'
import deepcopy from 'deepcopy'
import L from 'leaflet'

const clusterLayerCache = {} as Record<string, { layer: any }>
const heatmapLayersCache = {} as Record<string, { layer: any; heatMapData: number[][]; heatMapOptions: any }>

export const switchLayerVisibility = (map: L.Map, visibleLayers: any): void => {
    map?.eachLayer((layer: any) => {
        if (layer.knProperties?.layerGroup) {
            if (!visibleLayers[layer.knProperties.visualizationLabel]) {
                layer.hide()
            } else {
                layer.show()
            }
        }

        if (layer.knProperties?.cluster && !visibleLayers[layer.knProperties.visualizationLabel]) {
            clusterLayerCache[layer.knProperties.visualizationLabel] = { layer: layer }
            layer.remove()
            return
        }

        if (layer.knProperties?.heatmap && !visibleLayers[layer.knProperties.visualizationLabel]) {
            heatmapLayersCache[layer.knProperties.visualizationLabel] = { layer: layer, heatMapData: deepcopy(layer._latlngs), heatMapOptions: deepcopy(layer.options) }
            map.removeLayer(layer)
            return
        }

        showLayersFromCache(visibleLayers, map)
    })
}

const showLayersFromCache = (visibleLayers: any, map: any) => {
    showClusterLayersFromCache(visibleLayers, map)
    showHeatmapLayersFromCache(visibleLayers, map)
}

const showClusterLayersFromCache = (visibleLayers: any, map: any) => {
    Object.entries(clusterLayerCache).forEach((cachedLayer: any) => {
        const layerId = cachedLayer[0]
        if (visibleLayers[layerId] && cachedLayer[1]?.layer) {
            cachedLayer[1].layer.addTo(map)
        }
    })
}

const showHeatmapLayersFromCache = (visibleLayers: any, map: any) => {
    Object.entries(heatmapLayersCache).forEach((cachedLayer: any) => {
        const layerId = cachedLayer[0]
        if (visibleLayers[layerId] && cachedLayer[1]?.layer) {
            const layer = cachedLayer[1].layer
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

                // TODO - Remove? Check after testing on Master
                // centerAndRedrawTheLayerOnMap(map, heatmapLayersCache[layer.knProperties.layerId].layer, heatMapData)

                heatmapLayersCache[layer.knProperties.layerId] = { layer: null, heatMapData: [], heatMapOptions: {} }
            })
        }
    })
}

export const clearLayersCache = () => {
    Object.keys(clusterLayerCache).forEach((key) => {
        delete clusterLayerCache[key]
    })
    Object.keys(heatmapLayersCache).forEach((key) => {
        delete heatmapLayersCache[key]
    })
}
