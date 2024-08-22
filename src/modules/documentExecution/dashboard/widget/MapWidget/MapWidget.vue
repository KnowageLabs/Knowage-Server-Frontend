<template>
    <div id="map" ref="map" class="mapContainer"></div>
    <q-btn round push class="kn-parameter-sidebar-showLegend" color="white" text-color="black" size="sm" icon="settings" @click="showLegend = true">
        <q-tooltip :delay="500">{{ $t('common.open') }}</q-tooltip>
    </q-btn>
    <Transition>
        <div v-if="mapManager && showLegend" class="kn-parameter-sidebar kn-map-sidebar q-pa-xs">
            <div class="kn-map-sidebar-options row justify-end items-center">
                <q-btn flat round class="q-mr-xs" color="black" size="sm" icon="start" @click="showLegend = false">
                    <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </div>
            <div class="kn-map-sidebar-scroller">
                <q-list>
                    <q-expansion-item default-opened :label="$t('common.visibility')" icon="preview">
                        <div v-for="item in mapManager.getControlPanel().getLayers()" :key="item.getLayerId()" class="kn-map-sidebar-layer q-mb-sm">
                            <div class="row items-center">
                                <q-btn flat round class="q-mr-xs option-button" color="black" size="xs" :icon="layerVisibilityState[item.getLayerId()] ? 'visibility' : 'visibility_off'" @click="mapManager.switchLayerVisibility(item.getLayerId())" />
                                <q-select filled class="col" v-model="item.alias" :options="mapManager.getControlPanel().getLayers()" dense options-dense option-label="alias" option-value="alias" />
                            </div></div
                    ></q-expansion-item>
                    <q-expansion-item :label="$t('common.filters')" icon="filter_list">
                        <div v-for="item in mapManager.getControlPanel().getLayers()" :key="item.getLayerId()" class="kn-map-sidebar-layer">
                            <div class="row items-center">
                                <q-btn flat round class="q-mr-xs" color="black" size="xs" :icon="item.filter?.enabled ? 'filter_alt_off' : 'filter_alt'" @click="toggleFilter(item)">
                                    <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                                </q-btn>
                                <span class="col">{{ item.getAlias() }}</span>
                            </div>
                            <div class="row items-center" v-if="item.filter?.enabled">
                                <q-select filled class="col-4 q-mr-xs" v-model="item.filter.operator" :options="['=', '>', '<']" dense options-dense stack-label :label="$t('common.operator')" />
                                <q-input filled class="col" v-model="item.filter.value" dense options-dense stack-label :label="$t('common.value')" @change="mapManager.applyFilter(item)" />
                                <q-btn v-if="item.filter.value" flat round class="option-button col-2" color="black" size="xs" icon="backspace" @click="resetFilter(item)">
                                    <q-tooltip :delay="500">{{ $t('common.reset') }}</q-tooltip>
                                </q-btn>
                            </div>
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
import 'leaflet/dist/leaflet.css'
import { MapLayerManager } from './MapLayerManagerCreator'
import { MapManagerCreator } from './MapManagerCreator'

export default defineComponent({
    name: 'map-widget',
    components: {},
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
            zoom: 2 as number,
            layerManagers: [] as MapLayerManager[],
            mapManager: null as any,
            layerVisibilityState: {},
            showLegend: true as Boolean
        }
    },
    watch: {
        propWidget: {
            handler() {
                this.loadWidgetModel()
            },
            deep: true
        },
        propActiveSelections() {
            this.loadActiveSelections()
        }
    },
    created() {
        this.loadWidgetModel()
        this.loadActiveSelections()
    },
    mounted() {
        this.mapManager = MapManagerCreator.create(this.$refs.map, this.widgetModel, this.layerVisibilityState)
        this.mapManager.init()
        this.mapManager.showData(this.dataToShow)
    },
    updated() {
        this.mapManager.invalidateSize()
    },
    unmounted() {},
    methods: {
        ...mapActions(mainStore, ['setSelections']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadWidgetModel() {
            this.widgetModel = this.propWidget
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        resetFilter(item){
            item.filter.operator = ''
            item.filter.value = null
            this.mapManager.applyFilter(item)
        },
        toggleFilter(item) {
            if (item.filter) item.filter.enabled = !item.filter.enabled
            else item.filter = { enabled: true }
            this.mapManager.applyFilter(item)
        }
    }
})
</script>
<style lang="scss">
.mapContainer {
    width: 100%;
    height: 100%;
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
