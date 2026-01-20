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
import { ISelection, IVariable, IWidget } from '../../Dashboard'

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
    propActiveSelections: ISelection[]
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

const onSelectionsDeleted = (selections: any) => {
    if (selections && selections.length > 0) {
        const datasetIds = new Set<number>()
        props.widgetModel?.layers?.forEach((layer: any) => {
            if (layer.type === 'dataset') {
                datasetIds.add(layer.id)
            }
        })

        const isForMap = selections.some((selection) => datasetIds.has(selection.datasetId))

        if (!isForMap) return
    }
    initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables, props.propActiveSelections)
}

const getMapZoomValue = (widgetModel: IWidget | undefined): number => {
    const defaultZoom = 10

    const zoom = widgetModel?.settings?.configuration?.map?.zoom
    const autoCentering = widgetModel?.settings?.configuration?.map?.autoCentering

    if (autoCentering) return defaultZoom

    const parsedZoom = parseInt(zoom)
    return isNaN(parsedZoom) ? defaultZoom : parsedZoom
}

const getMapCenterValue = (widgetModel: IWidget | undefined): [number, number] | null => {
    const center = widgetModel?.settings?.configuration?.map?.center
    if (!center || !Array.isArray(center) || center.length !== 2) return null

    const [lat, lon] = center.map((v: any) => Number.parseFloat(v as any))

    if (Number.isNaN(lat) || Number.isNaN(lon)) return null

    return [lat, lon]
}

onMounted(async () => {
    emitter.on('widgetResized', resizeMap)

    emitter.on('selectionsDeleted', onSelectionsDeleted)

    loadVariables()

    const storedCenter = getMapCenterValue(props.widgetModel)
    const shouldAutoCenter = props.widgetModel.settings?.configuration?.map?.autoCentering
    const initialCenter = storedCenter ?? (navigator && !shouldAutoCenter ? await getCoords() : [0, 0])

    map = L.map(mapId, {
        center: initialCenter,
        zoom: getMapZoomValue(props.widgetModel),
        attributionControl: false
    })

    const ensureMapConfig = () => {
        if (!props.widgetModel.settings) props.widgetModel.settings = {} as any
        if (!props.widgetModel.settings.configuration) props.widgetModel.settings.configuration = {} as any
        if (!props.widgetModel.settings.configuration.map) props.widgetModel.settings.configuration.map = {} as any
    }

    map.on('zoomend', () => {
        const currentZoom = map.getZoom()

        ensureMapConfig()

        props.widgetModel.settings.configuration.map.zoom = currentZoom
    })

    map.on('moveend', () => {
        const center = map.getCenter()

        ensureMapConfig()

        props.widgetModel.settings.configuration.map.center = [center.lat, center.lng]
    })

    tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map)

    if (props.widgetModel.settings?.configuration?.map?.showScale) L.control.scale().addTo(map)

    try {
        const legendData = await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables, props.propActiveSelections)
        handleLegendUpdated(legendData)
        setTimeout(() => {
            switchLayerVisibility(map, props.layerVisibility)
            map.invalidateSize()
        }, 200)
    } catch (error: any) {
        console.error('------- ERROR"', error)
        appStore.setError({
            title: t('common.toast.errorTitle'),
            msg: error ? error.message : ''
        })
    }
})

onUnmounted(() => {
    emitter.off('widgetResized', resizeMap)
    emitter.off('selectionsDeleted', onSelectionsDeleted)
    clearLayersCache()
})

watch(props.layerVisibility, (newModel) => {
    switchLayerVisibility(map, newModel)
    map.invalidateSize()
})

watch(
    () => props.filtersReloadTrigger,
    async () => {
        const legendData = await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables, props.propActiveSelections)
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
    padding: 20px 1px 5px 1px;
}

.leaflet-popup-content {
    margin: 0;
}

.customLeafletPopup {
    margin: 0px 0px;
    padding: 0px 5px;
    background: white;
    min-width: 150px;
    max-width: 400px;
    white-space: nowrap;
}

.customLeafletPopup li {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.leaflet-popup-tip {
    display: none;
}

.clickable-custom-leaflet-list-item {
    color: #0056b3;
    background-color: #ffffff;
    transition: color 0.2s ease, background-color 0.2s ease;
}

.clickable-custom-leaflet-list-item:hover {
    color: #004085;
    background-color: #e9f5ff;
}
</style>
