<template>
    <div class="map-container">
        <MapLegend v-if="widgetModel?.settings?.legend?.enabled" :propMapWidgetLegend="widgetModel?.settings?.legend" :legend-data="legendData"> </MapLegend>

        <LeafletWrapper v-if="layerVisibilityState" :widget-model="widgetModel" :data="dataToShow" :layer-visibility="layerVisibilityState" :dashboardId="dashboardId" :filtersReloadTrigger="filtersReloadTrigger" :propVariables="variables" @legend-updated="onLegendUpdated"></LeafletWrapper>

        <q-btn round push class="kn-parameter-sidebar-showLegend" color="white" text-color="black" size="sm" icon="settings" @click="showPanel = true">
            <q-tooltip :delay="500">{{ $t('common.open') }}</q-tooltip>
        </q-btn>
        <Transition>
            <div v-if="widgetModel.layers.length > 0 && showPanel" class="kn-parameter-sidebar kn-map-sidebar q-pa-xs" :style="{ width: widgetModel.settings.configuration.controlPanel.dimension || 'auto' }">
                <div class="kn-map-sidebar-options row justify-end items-center" v-if="!widgetModel.settings.configuration.controlPanel.alwaysShow">
                    <q-btn flat round class="q-mr-xs" color="black" size="sm" icon="start" @click="showPanel = false">
                        <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                    </q-btn>
                </div>
                <div class="kn-map-sidebar-scroller">
                    <q-list>
                        <q-expansion-item default-opened :label="$t('common.visibility')" icon="preview">
                            <div v-for="item in widgetModel.layers" :key="item.layerId" class="kn-map-sidebar-layer q-mb-sm">
                                <template v-if="isLayerSet(item)">
                                    <div class="row items-center">
                                        <q-btn flat round class="q-mr-xs option-button" color="black" size="xs" :icon="layerVisibilityState && layerVisibilityState[item.layerId] ? 'visibility' : 'visibility_off'" @click="switchLayerVisibility(item)" />
                                        {{ item.name }}
                                    </div>
                                </template>
                            </div>
                        </q-expansion-item>
                        <q-expansion-item :label="$t('common.filters')" icon="filter_list">
                            <div v-for="visualization in widgetModel?.settings?.visualizations" :key="visualization.layerId" class="kn-map-sidebar-layer">
                                <template v-if="isVisualizationSet(visualization)">
                                    <div class="row items-center">
                                        <q-btn flat round class="q-mr-xs" color="black" size="xs" :icon="visualization.filter?.enabled ? 'filter_alt_off' : 'filter_alt'" @click="toggleFilter(visualization)">
                                            <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                                        </q-btn>
                                        <span class="col">{{ visualization.layerName }}</span>
                                    </div>
                                    <div class="row items-center" v-if="visualization.filter?.enabled">
                                        <q-select filled class="col-4 q-mr-xs" v-model="visualization.filter.column" :options="getColumnOptionsFromLayer(visualization)" dense options-dense stack-label emit-value map-options option-label="alias" option-value="name" :label="$t('common.column')" @update:modelValue="onFilterColumnChanged(visualization)" />
                                        <q-select filled class="col-4 q-mr-xs" v-model="visualization.filter.operator" :options="['=', '>', '<']" dense options-dense stack-label :label="$t('common.operator')" @update:modelValue="onFilterUpdated(visualization)" />
                                        <q-input type="number" filled class="col" v-model="visualization.filter.value" dense options-dense stack-label :label="$t('common.value')" @blur="onFilterUpdated(visualization)" />
                                        <q-btn v-if="visualization.filter.column || visualization.filter.operator || visualization.filter.value" flat round class="option-button col-2" color="black" size="xs" icon="backspace" @click="resetFilter(visualization)">
                                            <q-tooltip :delay="500">{{ $t('common.reset') }}</q-tooltip>
                                        </q-btn>
                                    </div>
                                </template>
                            </div>
                        </q-expansion-item>
                    </q-list>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { IDashboardDataset, ISelection, IVariable, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import LeafletWrapper from './LeafletWrapper.vue'
import { IMapWidgetLayer, IMapWidgetVisualizationType, IMapWidgetLayerProperty } from '../../interfaces/mapWidget/DashboardMapWidget'
import deepcopy from 'deepcopy'
import { getPropertiesByLayerId } from './MapWidgetDataProxy'
import MapLegend from './legend/MapLegend.vue'

export default defineComponent({
    name: 'map-widget',
    components: { LeafletWrapper, MapLegend },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDashboardDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        propVariables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['launchSelection'],
    data() {
        return {
            widgetModel: {} as any,
            activeSelections: [] as ISelection[],
            layerVisibilityState: null as Record<string, boolean> | null,
            showPanel: false as Boolean,
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            filtersReloadTrigger: false,
            variables: [] as IVariable[],
            legendData: null as Record<string, any> | null | undefined
        }
    },
    watch: {
        propVariables() {
            this.loadVariables()
        }
    },
    async created() {
        this.loadVariables()
        this.loadWidgetModel()
        this.loadActiveSelections()
        this.loadVisualizationTypeNames()
        await this.loadPropertiesForLayers()
    },
    unmounted() {},
    methods: {
        ...mapActions(mainStore, ['setSelections', 'setLoading']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadVariables() {
            this.variables = this.propVariables
        },
        isLayerSet(layer) {
            return this.widgetModel.settings.visualizations.filter((vis) => vis.target === layer.layerId)[0]
        },
        isVisualizationSet(visualization: IMapWidgetVisualizationType): boolean {
            return this.widgetModel.settings.visualizations.some((tempVisualization: IMapWidgetVisualizationType) => tempVisualization.target === visualization.target)
        },
        loadVisualizationTypeNames() {
            this.widgetModel.settings?.visualizations?.forEach((tempVisualization: IMapWidgetVisualizationType) => {
                const layer = this.widgetModel.layers.find((tempLayer: IMapWidgetLayer) => tempLayer.layerId === tempVisualization.target)
                tempVisualization.layerName = layer ? layer.name : ''
            })
        },
        loadWidgetModel() {
            this.widgetModel = this.propWidget
            this.showPanel = this.widgetModel.settings.configuration.controlPanel.alwaysShow
            this.updateLayerVisibilityState()
        },
        async loadPropertiesForLayers() {
            if (!this.widgetModel) return
            await Promise.all(this.widgetModel.layers.map((layer: IMapWidgetLayer) => this.loadAvailableProperties(layer)))
        },
        async loadAvailableProperties(layer: IMapWidgetLayer | null) {
            if (!layer) return

            const targetLayer = this.widgetModel.layers.find((tempLayer: IMapWidgetLayer) => tempLayer.layerId === layer.layerId)
            if (targetLayer?.type === 'layer') await this.loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer)
        },
        updateLayerVisibilityState() {
            const newState: Record<string, boolean> = {}
            this.widgetModel.layers.forEach((layer: IMapWidgetLayer) => (newState[layer.layerId] = false))

            const vizualizations = this.widgetModel.settings?.visualizations ? deepcopy(this.widgetModel.settings.visualizations) : []
            vizualizations.reverse().forEach((vizualization: IMapWidgetVisualizationType) => (newState[vizualization.target] = vizualization.visible))
            this.layerVisibilityState = newState
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        resetFilter(visualization: IMapWidgetVisualizationType) {
            if (!visualization.filter) return
            visualization.filter.column = ''
            visualization.filter.operator = ''
            visualization.filter.value = ''
            this.reloadFilters(visualization)
        },
        switchLayerVisibility(layer: any) {
            if (!this.layerVisibilityState) this.layerVisibilityState = {}
            this.layerVisibilityState[layer.layerId] = !this.layerVisibilityState[layer.layerId]
        },
        toggleFilter(visualization: IMapWidgetVisualizationType) {
            if (visualization.filter) visualization.filter.enabled = !visualization.filter.enabled
            else visualization.filter = { enabled: true }
            this.reloadFilters(visualization)
        },
        onFilterUpdated(visualization: IMapWidgetVisualizationType) {
            this.reloadFilters(visualization)
        },
        getColumnOptionsFromLayer(visualization: IMapWidgetVisualizationType) {
            if (visualization.targetDataset) return this.getColumnOptionsFromTargetDataset(visualization)
            else {
                const layer = this.widgetModel.layers.find((layer: any) => layer.layerId === visualization.target)
                if (!layer) return []
                else if (layer.type === 'dataset') return layer.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE')
                else return this.propertiesCache.get(layer.layerId) ?? []
            }
        },
        getColumnOptionsFromTargetDataset(visualization: IMapWidgetVisualizationType) {
            const targetDataset = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.name === visualization.targetDataset)
            return targetDataset ? targetDataset.columns : []
        },
        async loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer: IMapWidgetLayer) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerId(targetLayer.id)
            const formattedProperties = this.getPropertiesFormattedForDropdownOptions(properties)
            this.propertiesCache.set(targetLayer.layerId, formattedProperties)
            this.setLoading(false)
        },
        getPropertiesFormattedForDropdownOptions(properties: IMapWidgetLayerProperty[]) {
            return properties.map((property: IMapWidgetLayerProperty) => {
                return { name: property.property, alias: property.property }
            })
        },
        onFilterColumnChanged(visualization: IMapWidgetVisualizationType) {
            this.reloadFilters(visualization)
        },
        reloadFilters(visualization: IMapWidgetVisualizationType) {
            if (visualization.filter) visualization.filter.reloaded = false
            this.filtersReloadTrigger = !this.filtersReloadTrigger
        },
        onLegendUpdated(updatedLegendData: Record<string, any> | null | undefined) {
            this.legendData = updatedLegendData
        }
    }
})
</script>
<style lang="scss">
.map-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: visible !important;
}

.customLeafletPopup {
    list-style-type: none;
    padding-left: 0;
}

.customLeafletPopupListHeader {
    font-weight: bold;
    background-color: #f0f0f0;
    border-bottom: 1px solid #c2c2c2;
    text-align: center;
    padding: 0.5rem;
}

.customLeafletIcon {
    background-color: transparent;
}
.kn-parameter-sidebar-showLegend {
    position: absolute;
    z-index: 900;
    right: 4px;
    top: 4px;
}
.kn-map-sidebar {
    background-color: #e1e1e1;
    min-width: 300px;
    width: auto;
    z-index: 900;
    &.v-enter-active,
    &.v-leave-active {
        transition: opacity 0.3s ease;
    }

    &.v-enter-from,
    &.v-leave-to {
        opacity: 0;
    }
    .option-button {
        width: 1.5rem;
        height: 1.5rem;
    }
    .kn-map-sidebar-options {
        border-bottom: 1px solid #ccc;
        padding-bottom: 4px;
    }
    .kn-map-sidebar-section {
        font-size: 1.2rem;
        font-weight: bold;
    }
    .kn-map-sidebar-layer {
        font-size: 1rem;
    }
    .kn-map-sidebar-scroller {
        flex: 1;
        overflow-y: auto;
    }
    .q-field--dense {
        .q-field__native {
            min-height: unset;
        }
    }
}
</style>
