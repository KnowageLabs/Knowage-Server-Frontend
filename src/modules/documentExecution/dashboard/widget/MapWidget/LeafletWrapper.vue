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
import { DEFAULT_MAP_BASE_LAYER, getMapBaseLayerDefinition } from './MapBaseLayerHelper'
import useAppStore from '@/App.store'
import i18n from '@/App.i18n'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { clearLayersCache, switchLayerVisibility } from './visibility/MapVisibilityHelper'
import { IAssociation, ISelection, IVariable, IWidget } from '../../Dashboard'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

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
const store = dashboardStore()
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
let map: L.Map
let tile: L.TileLayer | null = null
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

/**
 * Given a set of dataset IDs (from map layers), returns all dataset IDs that are associated
 * with them through the dashboard associations configuration
 */
const getAssociatedDatasetIds = (mapDatasetIds: Set<number>): Set<number> => {
    const associations: IAssociation[] = store.getDashboard(props.dashboardId)?.configuration?.associations || []
    const associatedIds = new Set<number>()

    // For each association, if any field's dataset is in our mapDatasetIds,
    // add all other datasets from that association as associated
    associations.forEach((association: IAssociation) => {
        const fieldsDatasets = association.fields?.map((field) => field.dataset) ?? []
        const hasMapDataset = fieldsDatasets.some((datasetId) => mapDatasetIds.has(datasetId))

        if (hasMapDataset) {
            fieldsDatasets.forEach((datasetId) => associatedIds.add(datasetId))
        }
    })

    return associatedIds
}

const onSelectionsDeleted = (selections: any) => {
    if (selections && selections.length > 0) {
        const datasetIds = new Set<number>()
        props.widgetModel?.layers?.forEach((layer: any) => {
            if (layer.type === 'dataset') {
                datasetIds.add(layer.id)
            }
        })

        // Get all datasets that are associated with the map's datasets
        const associatedDatasetIds = getAssociatedDatasetIds(datasetIds)

        // Check if the selection is for a dataset that is either directly in the map
        // or associated with a map dataset
        const isForMap = selections.some((selection) =>
            datasetIds.has(selection.datasetId) || associatedDatasetIds.has(selection.datasetId)
        )

        if (!isForMap) return
    }
    reloadMapLayers()
}

const clearMapVisualizations = () => {
    if (!map) return

    map.eachLayer((layer: any) => {
        if (layer === tile) return
        if (layer.knProperties?.layerGroup || layer.knProperties?.cluster || layer.knProperties?.heatmap) {
            map.removeLayer(layer)
        }
    })

    clearLayersCache()
}

const reloadMapLayers = async () => {
    if (!map) return

    clearMapVisualizations()
    const legendData = await initializeLayers(map, props.widgetModel, props.data, props.dashboardId, variables, props.propActiveSelections)
    handleLegendUpdated(legendData)
    switchLayerVisibility(map, props.layerVisibility)
    map.invalidateSize()
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

const ensureMapConfig = () => {
    if (!props.widgetModel.settings) props.widgetModel.settings = {} as any
    if (!props.widgetModel.settings.configuration) props.widgetModel.settings.configuration = {} as any
    if (!props.widgetModel.settings.configuration.map) props.widgetModel.settings.configuration.map = {} as any
    if (!props.widgetModel.settings.configuration.map.baseLayer) props.widgetModel.settings.configuration.map.baseLayer = DEFAULT_MAP_BASE_LAYER
}

const updateBaseLayer = () => {
    if (!map) return

    ensureMapConfig()
    const baseLayerDefinition = getMapBaseLayerDefinition(props.widgetModel.settings.configuration.map.baseLayer)

    if (tile) map.removeLayer(tile)
    tile = L.tileLayer(baseLayerDefinition.url, baseLayerDefinition.options).addTo(map)
}
onMounted(async () => {
    emitter.on('widgetResized', resizeMap)

    emitter.on('selectionsDeleted', onSelectionsDeleted)

    loadVariables()

    const storedCenter = getMapCenterValue(props.widgetModel)
    const shouldAutoCenter = props.widgetModel.settings?.configuration?.map?.autoCentering
    const initialCenter = storedCenter ?? (navigator && !shouldAutoCenter ? await getCoords() : [0, 0])

    ensureMapConfig()
    map = L.map(mapId, {
        center: initialCenter,
        zoom: getMapZoomValue(props.widgetModel),
        attributionControl: false
    })

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

    updateBaseLayer()

    if (props.widgetModel.settings?.configuration?.map?.showScale) L.control.scale().addTo(map)

    try {
        await reloadMapLayers()
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
        await reloadMapLayers()
    }
)

watch(
    () => props.propVariables,
    () => {
        loadVariables()
    }
)

watch(
    () => props.propActiveSelections,
    async () => {
        await reloadMapLayers()
    },
    { deep: true }
)

watch(
    () => props.data,
    async () => {
        await reloadMapLayers()
    },
    { deep: true }
)

watch(
    () => props.widgetModel?.settings?.configuration?.map?.baseLayer,
    () => {
        updateBaseLayer()
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
    padding: 0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
}

.leaflet-popup-content {
    margin: 0;
}

.kn-map-popup .leaflet-popup-content,
.kn-map-tooltip .leaflet-tooltip-content {
    margin: 0;
}

.customLeafletPopup {
    list-style: none;
    margin: 0;
    padding: 8px;
    min-width: 220px;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.customLeafletPopupCard {
    background: #ffffff;
    min-width: 220px;
    max-width: 380px;
}

.customLeafletPopupHeader {
    padding: 10px 14px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1f2937;
    background: linear-gradient(135deg, #f8fafc 0%, #eef5ff 100%);
    border-bottom: 1px solid #e5e7eb;
}

.customLeafletPopupItem {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 9px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
    white-space: normal;
    overflow-wrap: anywhere;
}

.customLeafletPopupLabel {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6b7280;
}

.customLeafletPopupValue {
    font-size: 0.82rem;
    line-height: 1.2;
    font-weight: 500;
    color: #111827;
}

.leaflet-popup-tip {
    display: none;
}

.clickable-custom-leaflet-list-item {
    border-color: #bfdbfe;
    background: #eff6ff;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
}

.clickable-custom-leaflet-list-item:hover {
    background: #dbeafe;
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.18);
    transform: translateY(-1px);
}

.clickable-custom-leaflet-list-item .customLeafletPopupValue {
    color: #1d4ed8;
}

.kn-map-tooltip {
    border: 0;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
    background: transparent;
    padding: 0;
}

.kn-map-tooltip .leaflet-tooltip-content {
    margin: 0;
    padding: 0;
}
</style>
