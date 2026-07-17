<template>
    <div :id="mapId" class="mapContainer"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import deepcopy from 'deepcopy'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet/dist/leaflet.css'
import './Leaflet-heatmap.js'
import { getColumnName, getCoordinates, initializeLayers } from './LeafletHelper'
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
let map: L.map
let tile: string
let variables: IVariable[] = []
let persistedMapViewState: IMapViewState | null = null
const DEFAULT_MAP_CENTER: [number, number] = [0, 0]

interface IMapViewState {
    center: {
        lat: number
        lng: number
    }
    zoom: number
}

const loadVariables = () => {
    variables = props.propVariables
}

const isValidMapViewState = (state: any): state is IMapViewState => {
    return Number.isFinite(Number(state?.center?.lat)) && Number.isFinite(Number(state?.center?.lng)) && Number.isFinite(Number(state?.zoom))
}

const getStoredMapViewState = (): IMapViewState | null => {
    if (persistedMapViewState) return persistedMapViewState

    const widgetId = props.widgetModel?.id
    const currentDashboardViewState = widgetId ? store.getCurrentDashboardView(props.dashboardId)?.settings?.states?.[widgetId]?.state : null
    if (isValidMapViewState(currentDashboardViewState)) {
        persistedMapViewState = currentDashboardViewState
        return persistedMapViewState
    }

    if (isValidMapViewState(props.widgetModel?.state)) {
        persistedMapViewState = props.widgetModel.state
        return persistedMapViewState
    }
    return null
}

const saveMapViewState = () => {
    if (!map) return

    const currentCenter = map.getCenter()
    const currentMapViewState: IMapViewState = {
        center: {
            lat: currentCenter.lat,
            lng: currentCenter.lng
        },
        zoom: map.getZoom()
    }

    persistedMapViewState = currentMapViewState
    props.widgetModel.state = currentMapViewState

    const widgetId = props.widgetModel?.id
    const currentDashboardView = store.getCurrentDashboardView(props.dashboardId)
    if (widgetId && currentDashboardView) {
        currentDashboardView.settings.states = currentDashboardView.settings.states ?? {}
        currentDashboardView.settings.states[widgetId] = {
            ...currentDashboardView.settings.states[widgetId],
            type: props.widgetModel.type,
            state: currentMapViewState
        }
    }
}

const getWidgetModelForLayerInitialization = () => {
    const storedMapViewState = getStoredMapViewState()
    if (!storedMapViewState || !props.widgetModel?.settings?.configuration?.map?.autoCentering) return props.widgetModel

    const widgetModelForInitialization = deepcopy(props.widgetModel)
    widgetModelForInitialization.settings.configuration.map.autoCentering = false
    return widgetModelForInitialization
}

const getDatasetFallbackCenter = (): [number, number] | null => {
    for (const visualization of props.widgetModel?.settings?.visualizations ?? []) {
        const target = props.widgetModel?.layers?.find((layer: any) => layer.layerId === visualization.target)
        if (!target || target.type !== 'dataset') continue

        const targetData = props.data?.[target.id]
        if (!targetData?.rows?.length) continue

        const spatialAttribute = (target.columns || []).find((column: any) => column.fieldType === 'SPATIAL_ATTRIBUTE')
        if (!spatialAttribute) continue

        const geoColumn = getColumnName(spatialAttribute.name, targetData)
        if (!geoColumn) continue

        for (const row of targetData.rows) {
            if (!row?.[geoColumn]) continue

            let coordinates
            try {
                coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
            } catch {
                continue
            }
            if (!Array.isArray(coordinates) || coordinates.length < 2 || Array.isArray(coordinates[0]) || Array.isArray(coordinates[1])) continue

            const lat = Number(coordinates[0])
            const lng = Number(coordinates[1])

            if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng]
        }
    }

    return null
}

const getInitialMapCenter = async (): Promise<[number, number]> => {
    if (map) {
        const currentCenter = map.getCenter()
        return [currentCenter.lat, currentCenter.lng]
    }

    const storedMapViewState = getStoredMapViewState()
    if (storedMapViewState) return [storedMapViewState.center.lat, storedMapViewState.center.lng]

    const datasetFallbackCenter = getDatasetFallbackCenter()
    if (datasetFallbackCenter) return datasetFallbackCenter

    return DEFAULT_MAP_CENTER
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
    initializeLayers(map, getWidgetModelForLayerInitialization(), props.data, props.dashboardId, variables, props.propActiveSelections)
}

const getMapZoomValue = (widgetModel: IWidget | undefined): number => {
    const defaultZoom = 10

    const zoom = widgetModel?.settings?.configuration?.map?.zoom

    const storedMapViewState = getStoredMapViewState()
    if (storedMapViewState) return storedMapViewState.zoom

    const autoCentering = widgetModel?.settings?.configuration?.map?.autoCentering
    if (autoCentering) return defaultZoom

    const parsedZoom = parseInt(zoom)
    return isNaN(parsedZoom) ? defaultZoom : parsedZoom
}

const hasRenderedWidgetLayers = () => {
    let hasRenderedLayers = false
    map?.eachLayer((layer: any) => {
        if (layer.knProperties?.layerGroup || layer.knProperties?.cluster || layer.knProperties?.heatmap) {
            hasRenderedLayers = true
        }
    })

    return hasRenderedLayers
}

const refreshVisibleLayers = () => {
    setTimeout(() => {
        switchLayerVisibility(map, props.layerVisibility)
        map.invalidateSize()
    }, 200)
}

const initializeMapLayers = async () => {
    const legendData = await initializeLayers(map, getWidgetModelForLayerInitialization(), props.data, props.dashboardId, variables, props.propActiveSelections)
    handleLegendUpdated(legendData)
    refreshVisibleLayers()
}

onMounted(async () => {
    emitter.on('widgetResized', resizeMap)

    emitter.on('selectionsDeleted', onSelectionsDeleted)

    loadVariables()

    map = L.map(mapId, {
        center: await getInitialMapCenter(),
        zoom: getMapZoomValue(props.widgetModel),
        attributionControl: false
    })

    map.on('moveend', saveMapViewState)
    map.on('zoomend', saveMapViewState)

    tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    if (props.widgetModel.settings?.configuration?.map?.showScale) L.control.scale().addTo(map)

    try {
        await initializeMapLayers()
    } catch (error: any) {
        console.error('------- ERROR"', error)
        appStore.setError({
            title: t('common.toast.errorTitle'),
            msg: error ? error.message : ''
        })
    }
})

onUnmounted(() => {
    saveMapViewState()
    map?.off('moveend', saveMapViewState)
    map?.off('zoomend', saveMapViewState)
    emitter.off('widgetResized', resizeMap)
    emitter.off('selectionsDeleted', onSelectionsDeleted)
    clearLayersCache()
})

watch(props.layerVisibility, (newModel) => {
    switchLayerVisibility(map, newModel)
    map.invalidateSize()
})

watch(
    () => props.data,
    async (newData) => {
        if (!map || !newData || hasRenderedWidgetLayers()) return
        const hasData = Object.keys(newData).length > 0
        if (!hasData) return

        const legendData = await initializeLayers(map, getWidgetModelForLayerInitialization(), newData, props.dashboardId, variables, props.propActiveSelections)
        handleLegendUpdated(legendData)
        refreshVisibleLayers()
    }
)

watch(
    () => props.filtersReloadTrigger,
    async () => {
        const legendData = await initializeLayers(map, getWidgetModelForLayerInitialization(), props.data, props.dashboardId, variables, props.propActiveSelections)
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
