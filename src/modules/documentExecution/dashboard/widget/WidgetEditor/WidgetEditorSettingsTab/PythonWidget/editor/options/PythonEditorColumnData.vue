<template>
    <Message v-if="!widgetModel.dataset" class="p-mb-2" severity="warn" :closable="false" :style="descriptor.hintStyle">
        {{ $t(`managers.functionsCatalog.noDatasetSelected`) }}
    </Message>
    <div v-else class="p-fluid p-formgrid p-grid">
        <div class="p-field p-col-8 p-ml-3">
            <span class="p-float-label">
                <Dropdown v-model="selectedColumn" class="kn-material-input" :options="widgetModel.columns" option-label="columnName" @change="onColumnChanged"> </Dropdown>
                <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IDataset, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from '../PythonWidgetEditorDescriptor.json'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'

export default defineComponent({
    name: 'python-editor-column-data',
    components: { Dropdown, Message },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDatasets: { type: Array as PropType<IDataset[]> } },
    emits: ['insertChanged'],
    data() {
        return {
            descriptor,
            selectedColumn: null as IWidgetColumn | null
        }
    },
    created() {},
    methods: {
        onColumnChanged() {
            const datasetLabel = this.getDatasetLabel()
            const forInsert = this.selectedColumn ? `${datasetLabel}["${this.selectedColumn.columnName}"]` : ''
            this.$emit('insertChanged', forInsert)
        },
        getDatasetLabel() {
            if (!this.selectedDatasets) return ''
            const index = this.selectedDatasets.findIndex((dataset: IDataset) => dataset.id.dsId === this.widgetModel.dataset)
            return index !== -1 ? this.selectedDatasets[index].label : ''
        }
    }
})
</script>
