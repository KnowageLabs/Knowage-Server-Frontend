<template>
    <div :id="mapId" ref="map" class="mapContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import './leaflet-layervisibility'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet/dist/leaflet.css'
import './Leaflet-heatmap.js'
import { clearHeatmapLayersCache, filterLayers, initializeLayers, switchLayerVisibility } from './LeafletHelper'
import useAppStore from '@/App.store'
import i18n from '@/App.i18n'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

const appStore = useAppStore()
const { t } = i18n.global

const props = defineProps<{
    widgetModel: any
    data: any
    layerVisibility: any
    dashboardId: string
}>()

const mapId = 'map_' + Math.random().toString(36).slice(2, 7)
let map: L.map
let tile: string

const getCoords = async () => {
    const pos = (await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })) as any

    return [pos.coords.latitude, pos.coords.longitude]
}

const resizeMap = () => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize()
        }, 200)
    }
}

onMounted(async () => {
    emitter.on('widgetResized', resizeMap)

    map = L.map(mapId, {
        center: navigator && !props.widgetModel.settings?.configuration?.map?.autoCentering ? await getCoords() : [0, 0],
        zoom: parseInt(props.widgetModel.settings?.configuration?.map?.zoom) || 10
    })

    tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map)

    if (props.widgetModel.settings?.configuration?.map?.showScale) L.control.scale().addTo(map)

    try {
        await initializeLayers(map, props.widgetModel, props.data, props.dashboardId)
        setTimeout(() => {
            switchLayerVisibility(map, props.layerVisibility)
        }, 3000)
    } catch (error: any) {
        appStore.setError({
            title: t('common.toast.errorTitle'),
            msg: error ? error.message : ''
        })
    }
})

onUnmounted(() => {
    emitter.off('widgetResized', resizeMap)
    clearHeatmapLayersCache()
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
    z-index: 0;
}
</style>
