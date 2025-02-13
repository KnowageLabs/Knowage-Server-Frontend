<template>
    <div :id="mapId" ref="map" class="mapContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, watch, inject } from 'vue'
import L from 'leaflet'
import './leaflet-layervisibility'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet/dist/leaflet.css'
import * as h337 from 'heatmap.js'
import './Leaflet-heatmap.js'
import { filterLayers, initializeLayers, switchLayerVisibility } from './LeafletHelper'

const props = defineProps<{
    widgetModel: any
    data: any
    layerVisibility: any
}>()

const mapId = 'map_' + Math.random().toString(36).slice(2, 7)
let map: L.map
let tile

async function getCoords() {
    const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    return [pos.coords.latitude, pos.coords.longitude]
}

onMounted(async () => {
    map = L.map(mapId, {
        center: navigator && !props.widgetModel.settings?.configuration?.map?.autoCentering ? await getCoords() : [0, 0],
        zoom: parseInt(props.widgetModel.settings?.configuration?.map?.zoom) || 10
    })

    tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map)

    if (props.widgetModel.settings?.configuration?.map?.showScale) L.control.scale().addTo(map)

    await initializeLayers(map, props.widgetModel, props.data)
})

watch(props.layerVisibility, (newModel) => {
    switchLayerVisibility(map, newModel)
})

watch(props.widgetModel.layers, (newModel) => {
    filterLayers(map, newModel)
})
</script>

<style lang="scss">
.mapContainer {
    width: 100%;
    height: 100%;
}
</style>
