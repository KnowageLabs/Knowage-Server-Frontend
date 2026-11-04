<template>
    <q-table v-if="dataset.meta" flat bordered dense class="kn-table" :rows="fieldsMetadata" :columns="columns" row-key="column" :rows-per-page-options="[0]" hide-bottom virtual-scroll data-ws-wizard-columns>
        <template #body-cell-Type="props">
            <q-td :props="props">
                <q-select v-model="props.row.Type" outlined dense emit-value map-options class="kn-field-compact" :options="descriptor.valueTypes" option-label="value" option-value="name" @update:model-value="saveFieldsMetadata" />
            </q-td>
        </template>
        <template #body-cell-fieldType="props">
            <q-td :props="props">
                <q-select v-model="props.row.fieldType" outlined dense emit-value map-options class="kn-field-compact" :options="descriptor.fieldsMetadataTypes" option-label="value" option-value="value" @update:model-value="saveFieldsMetadata" />
            </q-td>
        </template>
    </q-table>
    <q-banner v-else dense class="bg-info text-white">{{ $t('managers.datasetManagement.metadataInfo') }}</q-banner>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import descriptor from './WorkspaceDatasetWizardDescriptor.json'

// Ported from views/dataView/datasetWizard/WorkspaceDatasetWizardStepTwo.vue: the same metadata grid and rules.
const props = defineProps<{ selectedDataset: any }>()
const { t } = useI18n()
const store = mainStore()

const dataset = computed(() => props.selectedDataset)
const fieldsMetadata = ref<any[]>([])

const columns = computed(() => [
    { name: 'fieldAlias', label: t('managers.datasetManagement.fieldAlias'), field: 'fieldAlias', align: 'left' as const, sortable: true },
    { name: 'Type', label: t('importExport.catalogFunction.column.type'), field: 'Type', align: 'left' as const, sortable: true },
    { name: 'fieldType', label: t('managers.datasetManagement.fieldType'), field: 'fieldType', align: 'left' as const, sortable: true }
])

function exctractFieldsMetadata(array: any[]) {
    const object = {}
    for (const item in array) {
        let element = object[array[item].column]
        if (!element) {
            element = {}
            object[array[item].column] = element
            element['column'] = array[item].column
        }
        element[array[item].pname] = array[item].pvalue
    }
    const result = [] as any[]
    for (const item in object) {
        result.push(object[item])
    }
    fieldsMetadata.value = result
}

function saveFieldsMetadata() {
    let numberOfSpatialAttribute = 0
    for (let i = 0; i < fieldsMetadata.value.length; i++) {
        if (fieldsMetadata.value[i].fieldType == 'SPATIAL_ATTRIBUTE') {
            numberOfSpatialAttribute++
            if (numberOfSpatialAttribute > 1) {
                store.setError({ title: 'common.error.saving', msg: 'managers.datasetManagement.duplicateSpatialAttribute' })
                return
            }
        }
    }
    for (let i = 0; i < fieldsMetadata.value.length; i++) {
        for (let j = 0; j < dataset.value.meta.columns.length; j++) {
            if (fieldsMetadata.value[i].column == dataset.value.meta.columns[j].column && dataset.value.meta.columns[j].pname == 'fieldType') {
                dataset.value.meta.columns[j].pvalue = fieldsMetadata.value[i].fieldType
            }
        }
    }
    for (let i = 0; i < fieldsMetadata.value.length; i++) {
        for (let j = 0; j < dataset.value.meta.columns.length; j++) {
            if (fieldsMetadata.value[i].column == dataset.value.meta.columns[j].column && dataset.value.meta.columns[j].pname == 'Type') {
                dataset.value.meta.columns[j].pvalue = fieldsMetadata.value[i].Type
            }
        }
    }
}

watch(
    () => props.selectedDataset,
    (value) => {
        if (value?.meta) exctractFieldsMetadata(value.meta.columns)
    },
    { immediate: true }
)
</script>
