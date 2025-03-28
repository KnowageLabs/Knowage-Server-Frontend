<template>
    <div :id="mapId" class="mapContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import './leaflet-layervisibility'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet/dist/leaflet.css'
import './Leaflet-heatmap.js'
import { filterLayers, initializeLayers } from './LeafletHelper'
import useAppStore from '@/App.store'
import i18n from '@/App.i18n'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { clearLayersCache, switchLayerVisibility } from './visibility/MapVisibilityHelper'
import { IVariable } from '../../Dashboard'

const appStore = useAppStore()
const { t } = i18n.global

const props = defineProps<{
    widgetModel: any
    data: any
    layerVisibility: any
    dashboardId: string
    filtersReloadTrigger: boolean
    propVariables: IVariable[]
}>()

const mapId = 'map_' + Math.random().toString(36).slice(2, 7)
let map: L.map
let tile: string
let variables: IVariable[] = []

const loadVariables = () => {
    variables = props.propVariables
}

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
        }, 100)
    }
}

onMounted(async () => {
    emitter.on('widgetResized', resizeMap)

    loadVariables()

    map = L.map(mapId, {
        center: navigator && !props.widgetModel.settings?.configuration?.map?.autoCentering ? await getCoords() : [0, 0],
        zoom: parseInt(props.widgetModel.settings?.configuration?.map?.zoom) || 10
    })

    tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map)

    if (props.widgetModel.settings?.configuration?.map?.showScale) L.control.scale().addTo(map)

    try {
        await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables)
        setTimeout(() => {
            switchLayerVisibility(map, props.layerVisibility)
        }, 200)
    } catch (error: any) {
        console.log('------- ERROR"', error)
        appStore.setError({
            title: t('common.toast.errorTitle'),
            msg: error ? error.message : ''
        })
    }
})

onUnmounted(() => {
    emitter.off('widgetResized', resizeMap)
    clearLayersCache()
})

watch(props.layerVisibility, (newModel) => {
    switchLayerVisibility(map, newModel)
})

watch(props.widgetModel.layers, (newModel) => {
    filterLayers(map, newModel)
})

watch(
    () => props.filtersReloadTrigger,
    async () => {
        console.log('-------- !!!!!!!! FILTER RELOAD TRIGGERED: ', props.widgetModel)
        await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables)
    }
)

watch(
    () => props.propVariables,
    () => {
        loadVariables()
    }
)
</script>

<style lang="scss">
.mapContainer {
    width: 100%;
    height: 100%;
    z-index: 0;
}

.leaflet-marker-shadow {
    display: none;
}
</style>
