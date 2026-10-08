<template>
    <WidgetEditorDrawerList v-if="widgetModel" v-model:search="filterText" :items="filteredLayers" item-key="layerId" :active-key="selectedLayerId" draggable @item-click="onLayerClick" @item-dragstart="onDragStart" @item-drop="onDropComplete">
        <template #search-append>
            <q-btn class="q-mr-xs" unelevated round dense icon="add" color="primary" size="xs" :title="$t('workspace.gis.dnl.addLayer')" @click="openLayersDialog" />
        </template>
        <template #leading="{ item }">
            <q-icon name="drag_indicator" size="14px" />
            <q-icon :name="item.type.toLowerCase() === 'dataset' ? 'fas fa-database' : 'fas fa-map'" size="14px">
                <q-tooltip>{{ item.type.toLowerCase() === 'dataset' ? $t('common.dataset') : $t('common.layer') }}</q-tooltip>
            </q-icon>
        </template>
        <template #label="{ item }">
            {{ item.name }}
            <q-tooltip :delay="500">{{ item.name }}</q-tooltip>
        </template>
        <template #trailing="{ item }">
            <q-btn flat round dense icon="delete" size="sm" class="q-ml-auto" data-test="delete-button" @click.stop="deleteLayer(item)" />
        </template>
    </WidgetEditorDrawerList>

    <LayersDialog :visible="layersDialogVisible" :available-datasets-prop="selectedDatasets" :selected-datasets-prop="widgetModel.layers" @add-selected-datasets="addDatasets" @close="closeLayersDialog" />
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IDataset, IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '../../../interfaces/mapWidget/DashboardMapWidget'
import LayersDialog from './MapWidgetLayersTabDialog.vue'
import WidgetEditorDrawerList from '../common/WidgetEditorDrawerList.vue'

import deepcopy from 'deepcopy'
import { removeLayerFromModel } from './MapWidgetLayersTabListHelper'
import { setDefaultMeasureValuesForMapWidgetColumns } from '../../MapWidget/MapWidgetFormattingHelper'

export default defineComponent({
    name: 'map-widget-layers-list',
    components: { LayersDialog, WidgetEditorDrawerList },
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
            selectedLayerId: null as string | null,
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
        onLayerClick(layer: IMapWidgetLayer) {
            this.selectedLayerId = layer.layerId
            this.$emit('layerSelected', layer)
        },
        // The list can be filtered, so indexes are taken from the full layers array
        onDragStart(event: DragEvent, layer: IMapWidgetLayer) {
            if (!event.dataTransfer) return
            event.dataTransfer.setData('application/x-kn-row', JSON.stringify({ index: this.layers.indexOf(layer) }))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropComplete(event: DragEvent, targetLayer: IMapWidgetLayer) {
            const data = event.dataTransfer?.getData('application/x-kn-row')
            if (!data) return
            const startIndex = JSON.parse(data).index
            const dropIndex = this.layers.indexOf(targetLayer)
            if (startIndex === -1 || dropIndex === -1 || startIndex === dropIndex) return
            const temp = this.layers[startIndex]
            this.layers.splice(startIndex, 1)
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
        deleteLayer(layer: IMapWidgetLayer) {
            const index = this.layers.indexOf(layer)
            if (index === -1) return
            removeLayerFromModel(deepcopy(layer), this.widgetModel)
            this.layers.splice(index, 1)
            if (this.selectedLayerId === layer.layerId) this.selectedLayerId = null
        }
    }
})
</script>
