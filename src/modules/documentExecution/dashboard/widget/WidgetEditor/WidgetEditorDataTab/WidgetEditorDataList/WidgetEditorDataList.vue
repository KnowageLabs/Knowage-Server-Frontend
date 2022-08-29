<template>
    <div class="dashboard-editor-list-card-container p-m-3">
        <span class="p-float-label p-mx-2 p-mt-4 p-mb-1">
            <Dropdown id="dataset" class="kn-material-input kn-width-full" v-model="selectedDataset" :options="datasetOptions" optionLabel="label" @change="onDatasetSelected"></Dropdown>
            <label for="dataset" class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.selectDataset') }} </label>
        </span>
        <div class="p-col-12 p-d-flex">
            <label class="kn-material-input-label p-as-center p-ml-1"> {{ $t('common.columns') }} </label>
            <Button :label="$t('common.addColumn')" icon="pi pi-plus-circle" class="p-button-outlined p-ml-auto p-mr-1" @click="showCalculatedFieldDialog"></Button>
        </div>

        <Listbox v-if="selectedDataset" class="kn-list kn-list-no-border-right dashboard-editor-list" :options="selectedDatasetColumns" :filter="true" :filterPlaceholder="$t('common.search')" filterMatchMode="contains" :filterFields="[]" :emptyFilterMessage="$t('common.info.noDataFound')">
            <template #empty>{{ $t('common.info.noDataFound') }}</template>
            <template #option="slotProps">
                <div class="kn-list-item kn-draggable" draggable="true" :style="dataListDescriptor.style.list.listItem" @dragstart="onDragStart($event, slotProps.option)">
                    <i class="pi pi-bars" :style="dataListDescriptor.style.list.listIcon"></i>
                    <i :style="dataListDescriptor.style.list.listIcon" :class="slotProps.option.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'" class="p-ml-2"></i>
                    <div class="kn-list-item-text">
                        <span>{{ slotProps.option.alias }}</span>
                    </div>
                </div>
            </template>
        </Listbox>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetEditorDataset, IDatasetColumn, IWidgetColumn, IDataset, IWidget } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import descriptor from './WidgetEditorDataListDescriptor.json'
import Dropdown from 'primevue/dropdown'
import mainStore from '../../../../../../../App.store'
import Listbox from 'primevue/listbox'
import Card from 'primevue/card'
import dataListDescriptor from '../../../../dataset/DatasetEditorDataTab/DatasetEditorDataList/DatasetEditorDataListDescriptor.json'

export default defineComponent({
    name: 'widget-editor-data-list',
    components: { Card, Dropdown, Listbox },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array }, selectedDatasets: { type: Array as PropType<IDataset[]> } },
    emits: ['datasetSelected'],
    data() {
        return {
            descriptor,
            dataListDescriptor,
            datasetOptions: [] as IWidgetEditorDataset[],
            selectedDataset: null as IWidgetEditorDataset | null,
            selectedDatasetColumns: [] as IDatasetColumn[]
        }
    },
    setup() {
        const store = mainStore()
        return { store }
    },
    async created() {
        this.loadDatasets()
        this.setEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('collumnAdded', (event) => {
                this.removeColumn(event)
            })
            emitter.on('collumnRemoved', (event) => {
                this.addColumn(event)
            })
        },
        loadDatasets() {
            this.datasetOptions = this.selectedDatasets
                ? this.selectedDatasets.map((dataset: any) => {
                      return {
                          id: dataset.id.dsId,
                          label: dataset.label,
                          cache: dataset.cache,
                          indexes: dataset.indexes,
                          parameters: dataset.parameters
                      }
                  })
                : []
        },
        onDatasetSelected() {
            this.loadDatasetColumns()
            this.$emit('datasetSelected', this.selectedDataset)
        },
        showCalculatedFieldDialog() {},
        loadDatasetColumns() {
            this.selectedDatasetColumns = []
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return

            const index = this.selectedDatasets.findIndex((dataset: any) => dataset.id?.dsId === this.selectedDataset?.id)
            if (index !== -1) this.addSelectedDatasetColumnsFromMetadata(this.selectedDatasets[index].metadata.fieldsMeta)
        },
        addSelectedDatasetColumnsFromMetadata(fieldsMeta: any[]) {
            for (let i = 0; i < fieldsMeta.length; i++) {
                if (!this.columnIsPresentInModel(fieldsMeta[i])) this.selectedDatasetColumns.push({ ...fieldsMeta[i], dataset: this.selectedDataset?.id })
            }
        },
        columnIsPresentInModel(column: IDatasetColumn) {
            const index = this.widgetModel.columns.findIndex((tempColumn: IWidgetColumn) => {
                if (tempColumn.name.startsWith('(')) tempColumn.name = tempColumn.name.slice(1, -1)
                return tempColumn.name == column.name
            })
            return index !== -1
        },
        onDragStart(event: any, datasetColumn: IDatasetColumn) {
            event.dataTransfer.setData('text/plain', JSON.stringify(datasetColumn))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        addColumn(column: IWidgetColumn) {
            if (this.selectedDataset && column.dataset === this.selectedDataset.id && this.datasets) {
                let tempDatasetColumns = null as IDatasetColumn[] | null
                const index = this.datasets.findIndex((dataset: any) => dataset.id?.dsId === this.selectedDataset?.id)
                if (index !== -1) tempDatasetColumns = (this.datasets[index] as any).metadata.fieldsMeta
                if (!tempDatasetColumns) return
                if (column.name.startsWith('(')) column.name = column.name.slice(1, -1)
                const columnIndex = tempDatasetColumns.findIndex((tempColumn: any) => column.name === tempColumn.name)
                if (columnIndex !== -1) this.selectedDatasetColumns.push({ ...tempDatasetColumns[columnIndex], dataset: this.selectedDataset.id })
            }
        },
        removeColumn(column: IDatasetColumn) {
            const index = this.selectedDatasetColumns.findIndex((tempColumn: IDatasetColumn) => tempColumn.name === column.name)
            if (index !== -1) this.selectedDatasetColumns.splice(index, 1)
        }
    }
})
</script>