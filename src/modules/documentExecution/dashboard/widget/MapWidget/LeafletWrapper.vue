<template>
    <div :id="mapId" class="mapContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet/dist/leaflet.css'
import './Leaflet-heatmap.js'
import { initializeLayers } from './LeafletHelper'
import useAppStore from '@/App.store'
import i18n from '@/App.i18n'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { clearLayersCache, switchLayerVisibility } from './visibility/MapVisibilityHelper'
import { IVariable } from '../../Dashboard'

//#region inlined leaflet-layervisibility
function validateFilter(filterFunc) {
    if (typeof filterFunc !== 'undefined' && typeof filterFunc === 'function') {
        return filterFunc
    }
    return function () {
        return true
    }
}

function setLayerDisplayStyle(value, context) {
    if (context._el) context._el.style.display = value
    else if (context.getElement()) context.getElement().style.display = value
    return context
}

function setLayerGroupVisibility(mode, filter, context) {
    const filterFunc = validateFilter(filter)
    context.eachLayer((layer) => (filterFunc(layer) ? layer[mode]() : null))
}

L.Layer.include({
    hide() {
        return setLayerDisplayStyle('none', this)
    },
    show() {
        return setLayerDisplayStyle('', this)
    },
    isHidden() {
        return this.getElement().style.display === 'none'
    },
    toggleVisibility() {
        return this.isHidden() ? this.show() : this.hide()
    }
})

L.LayerGroup.include({
    hide(filter) {
        setLayerGroupVisibility('hide', filter, this)
    },
    show(filter) {
        setLayerGroupVisibility('show', filter, this)
    },
    isHidden() {
        return this.getLayers().every((layer) => layer.isHidden())
    }
})

L.Marker.include({
    hide() {
        return L.Layer.prototype.hide.call(this, null)
    },
    show() {
        return L.Layer.prototype.show.call(this, null)
    }
})
//#endregion

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
        const legendData = await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables)
        handleLegendUpdated(legendData)
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

watch(
    () => props.filtersReloadTrigger,
    async () => {
        const legendData = await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables)
        handleLegendUpdated(legendData)
    }
)

watch(
    () => props.propVariables,
    () => {
        loadVariables()
    }
)

const emit = defineEmits<{
    (e: 'legend-updated', legendData: Record<string, any> | undefined): void
}>()

const handleLegendUpdated = (legendData: Record<string, any> | undefined) => {
    emit('legend-updated', legendData)
}
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

.leaflet-popup-content-wrapper {
    padding: 0px;
}

.leaflet-popup-content {
    margin: 0;
}

.customLeafletPopup {
    margin: 0px 0px;
    padding: 0px 0px;
    box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: white;
    max-width: 180px;
    white-space: nowrap;
}

.leaflet-popup-tip {
    display: none;
}
</style>
