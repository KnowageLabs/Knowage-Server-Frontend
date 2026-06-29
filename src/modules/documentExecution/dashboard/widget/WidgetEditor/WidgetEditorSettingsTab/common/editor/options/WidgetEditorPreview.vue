<template>
    <div v-if="!selectedDatasets?.length" class="row items-center text-warning q-mb-sm">
        <q-icon name="warning" class="q-mr-sm" />
        {{ $t('managers.functionsCatalog.noDatasetSelected') }}
    </div>
    <q-select v-else v-model="selectedDatasetName" outlined dense :options="selectedDatasets" option-value="name" option-label="name" emit-value map-options :label="$t('common.dataset')" @update:model-value="onColumnChanged" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-preview',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDatasets: { type: Array as PropType<IDataset[]> } },
    emits: ['insertChanged'],
    data() {
        return {
            selectedDatasetName: ''
        }
    },
    methods: {
        onColumnChanged() {
            const forInsert = this.widgetModel.type === 'html' ? `<div kn-preview="${this.selectedDatasetName}"></div>` : `<span class="preview" kn-preview="${this.selectedDatasetName}">${this.selectedDatasetName}</span>`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
