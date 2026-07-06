<template>
    <div v-if="widgetModel" class="dashboard-editor-list-card-container">
        <q-input v-model="filterText" :placeholder="$t('common.search')" dense borderless clearable class="settings-search q-px-sm">
            <template #prepend>
                <q-icon name="search" size="16px" />
            </template>
            <template #append>
                <q-btn class="q-mr-xs" unelevated round dense icon="add" color="primary" size="xs" :title="$t('workspace.gis.dnl.addLayer')" @click="openLayersDialog" />
            </template>
        </q-input>
        <q-separator></q-separator>
        <Listbox class="kn-list kn-list-no-border-right dashboard-editor-list" :options="filteredLayers">
            <template #empty>{{ $t('common.info.noDataFound') }}</template>
            <template #option="slotProps">
                <div class="kn-list-item kn-draggable" draggable="true" style="height: 30px" data-test="list-item" @dragstart="onDragStart($event, slotProps.index)" @drop.stop="onDropComplete($event, slotProps.index)" @dragover.prevent @dragenter.prevent @dragleave.prevent @click="$emit('layerSelected', slotProps.option)">
                    <i class="pi pi-bars q-mr-sm"></i>
                    <i :class="slotProps.option.type.toLowerCase() === 'dataset' ? 'fas fa-database' : 'fas fa-map'">
                        <q-tooltip>{{ slotProps.option.type.toLowerCase() === 'dataset' ? $t('common.dataset') : $t('common.layer') }}</q-tooltip>
                    </i>
                    <div class="kn-list-item-text">
                        <span class="dashboard-editor-list-alias-container"
                            >{{ slotProps.option.name }}<q-tooltip>{{ slotProps.option.name }}</q-tooltip></span
                        >
                    </div>
                    <q-btn flat round dense icon="delete" size="sm" class="q-ml-auto" data-test="delete-button" @click.stop="deleteLayer(slotProps.index)" />
                </div>
            </template>
        </Listbox>
    </div>

    <LayersDialog :visible="layersDialogVisible" :available-datasets-prop="selectedDatasets" :selected-datasets-prop="widgetModel.layers" @add-selected-datasets="addDatasets" @close="closeLayersDialog" />
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IDataset, IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '../../../interfaces/mapWidget/DashboardMapWidget'
import LayersDialog from './MapWidgetLayersTabDialog.vue'
import Listbox from 'primevue/listbox'

import deepcopy from 'deepcopy'
import { removeLayerFromModel } from './MapWidgetLayersTabListHelper'
import { setDefaultMeasureValuesForMapWidgetColumns } from '../../MapWidget/MapWidgetFormattingHelper'

export default defineComponent({
    name: 'map-widget-layers-list',
    components: { LayersDialog, Listbox },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        datasets: {
            type: Array as PropType<IDataset[]>,
            default: function () {
                return []
            }
        },
        selectedDatasets: {
            type: Array as PropType<IDataset[]>,
            default: function () {
                return []
            }
        }
    },
    emits: ['layerSelected'],
    data() {
        return {
            layers: [] as IMapWidgetLayer[],
            filterText: '',
            layersDialogVisible: false
        }
    },
    computed: {
        filteredLayers(): IMapWidgetLayer[] {
            if (!this.filterText) return this.layers
            const needle = this.filterText.toLowerCase()
            return this.layers.filter((l) => l.name?.toLowerCase().includes(needle))
        }
    },
    created() {
        this.loadLayers()
    },
    methods: {
        loadLayers() {
            this.layers = this.widgetModel.layers
        },
        openLayersDialog() {
            this.layersDialogVisible = true
        },
        closeLayersDialog() {
            this.layersDialogVisible = false
        },
        onDragStart(event: any, startIndex: number) {
            event.dataTransfer.setData('text/plain', JSON.stringify(startIndex))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropComplete(event: any, dropIndex: number) {
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
            const temp = this.widgetModel.layers[eventData]
            this.layers.splice(eventData, 1)
            this.layers.splice(dropIndex, 0, temp)
        },
        addDatasets(datasets: IMapWidgetLayer[]) {
            const combinedArray = this.layers.concat(datasets)
            const uniqueObjects = new Map()

            combinedArray.forEach((obj) => {
                uniqueObjects.set(obj.layerId, obj)
            })

            this.layers = Array.from(uniqueObjects.values())
            this.widgetModel.layers = this.layers

            setDefaultMeasureValuesForMapWidgetColumns(this.widgetModel)
            this.closeLayersDialog()
        },
        deleteLayer(index: number) {
            removeLayerFromModel(deepcopy(this.layers[index]), this.widgetModel)
            this.layers.splice(index, 1)
        }
    }
})
</script>

<style lang="scss" scoped></style>
