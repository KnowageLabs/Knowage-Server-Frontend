<template>
    <LeafletWrapper :widget-model="widgetModel" :data="dataToShow" :layer-visibility="layerVisibilityState"></LeafletWrapper>
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
                                    <q-btn flat round class="q-mr-xs option-button" color="black" size="xs" :icon="layerVisibilityState[item.layerId] ? 'visibility' : 'visibility_off'" @click="switchLayerVisibility(item)" />
                                    {{ item.name }}
                                </div>
                            </template>
                        </div></q-expansion-item
                    >
                    <q-expansion-item :label="$t('common.filters')" icon="filter_list">
                        <div v-for="item in widgetModel.layers" :key="item.layerId" class="kn-map-sidebar-layer">
                            <template v-if="isLayerSet(item)">
                                <div class="row items-center">
                                    <q-btn flat round class="q-mr-xs" color="black" size="xs" :icon="item.filter?.enabled ? 'filter_alt_off' : 'filter_alt'" @click="toggleFilter(item)">
                                        <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                                    </q-btn>
                                    <span class="col">{{ item.name }}</span>
                                </div>
                                <div class="row items-center" v-if="item.filter?.enabled">
                                    <q-select filled class="col-4 q-mr-xs" v-model="item.filter.operator" :options="['=', '>', '<']" dense options-dense stack-label :label="$t('common.operator')" />
                                    <q-input filled class="col" v-model="item.filter.value" dense options-dense stack-label :label="$t('common.value')" />
                                    <q-btn v-if="item.filter.value" flat round class="option-button col-2" color="black" size="xs" icon="backspace" @click="resetFilter(item)">
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
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { IDashboardDataset, ISelection, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { MapLayerManager } from './MapLayerManagerCreator'
import { MapManagerCreator } from './MapManagerCreator'
import LeafletWrapper from './LeafletWrapper.vue'

export default defineComponent({
    name: 'map-widget',
    components: { LeafletWrapper },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDashboardDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: ['launchSelection'],
    data() {
        return {
            widgetModel: {} as any,
            activeSelections: [] as ISelection[],
            layerManagers: [] as MapLayerManager[],
            mapManager: null as any,
            layerVisibilityState: {},
            showPanel: false as Boolean
        }
    },
    created() {
        this.loadWidgetModel()
        this.loadActiveSelections()
    },
    mounted() {
        /*this.mapManager = MapManagerCreator.create(this.$refs.map, this.widgetModel, this.layerVisibilityState)
        this.mapManager.init()
        this.mapManager.showData(this.dataToShow)*/
    },
    updated() {
        //this.mapManager.invalidateSize()
    },
    unmounted() {},
    methods: {
        ...mapActions(mainStore, ['setSelections']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        isLayerSet(layer) {
            return this.widgetModel.settings.visualizations.filter((vis) => vis.target === layer.layerId)[0]
        },
        loadWidgetModel() {
            this.widgetModel = this.propWidget
            this.widgetModel.layers.forEach((i) => (this.layerVisibilityState[i.layerId] = true))
            this.showPanel = this.widgetModel.settings.configuration.controlPanel.alwaysShow
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        resetFilter(item) {
            item.filter.operator = ''
            item.filter.value = null
            //this.mapManager.applyFilter(item)
        },
        switchLayerVisibility(layer: any) {
            this.layerVisibilityState[layer.layerId] = !this.layerVisibilityState[layer.layerId]
        },
        toggleFilter(item) {
            if (item.filter) item.filter.enabled = !item.filter.enabled
            else item.filter = { enabled: true }
            //this.mapManager.applyFilter(item)
        }
    }
})
</script>
<style lang="scss">
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
