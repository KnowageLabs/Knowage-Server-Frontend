<template>
    <q-table flat bordered dense class="kn-table" :rows="rows" :columns="columns" :row-key="rowKey" :rows-per-page-options="[0]" hide-bottom virtual-scroll data-ws-wizard-preview />
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Ported from views/dataView/datasetWizard/WorkspaceDatasetWizardStepThree.vue: the preview grid of testDataSet.
const props = defineProps<{ gridForPreview: any }>()

const columns = computed(() =>
    (props.gridForPreview?.metaData?.fields ?? [])
        .filter((field: any) => typeof field === 'object')
        .map((field: any) => ({ name: field.name, label: field.header, field: field.name, align: 'left' as const, sortable: true, classes: 'ellipsis' }))
)
const rows = computed(() => props.gridForPreview?.rows ?? [])
const rowKey = (row: any) => rows.value.indexOf(row)
</script>
