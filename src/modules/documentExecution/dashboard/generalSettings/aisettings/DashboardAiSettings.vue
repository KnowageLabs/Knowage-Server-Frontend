<template>
    <div class="q-px-md q-pb-md column q-gutter-y-sm">
        <q-banner class="bg-info text-black" rounded dense>
            <template #avatar><q-icon name="info" /></template>
            {{ $t('dashboard.generalSettings.aiSettingsHint') }}
        </q-banner>

        <q-banner v-if="datasets.length === 0" class="bg-warning text-black" rounded dense>
            <template #avatar><q-icon name="warning" /></template>
            {{ $t('dashboard.generalSettings.aiSettingsError') }}
        </q-banner>

        <template v-else>
            <q-select v-model="selectedDataset" :options="datasets" option-label="dsLabel" :label="$t('dashboard.generalSettings.selectDataset')" outlined dense hide-bottom-space class="ai-settings__dataset" @update:model-value="updateDatasetColumns" />

            <q-table v-if="selectedDataset && datasetColumns.length > 0" :rows="datasetColumns" :columns="columns" :pagination="{ rowsPerPage: 20 }" row-key="name" flat bordered dense>
                <template #header-cell="slotProps">
                    <q-th :props="slotProps">
                        <span class="kn-capitalize">{{ slotProps.col.label ? $t(slotProps.col.label) : '' }}</span>
                    </q-th>
                </template>
                <template #header-cell-meaningful="slotProps">
                    <q-th :props="slotProps">
                        {{ $t(slotProps.col.label) }}
                        <q-icon name="help_outline" size="xs" color="grey-7">
                            <q-tooltip :delay="500" max-width="300px">{{ $t('dashboard.generalSettings.meaningfulHint') }}</q-tooltip>
                        </q-icon>
                    </q-th>
                </template>

                <template #body-cell-dataType="slotProps">
                    <q-td :props="slotProps">{{ getDataType(slotProps.value) }}</q-td>
                </template>
                <!-- The description is edited in place. -->
                <template #body-cell-description="slotProps">
                    <q-td :props="slotProps" class="ai-settings__description cursor-pointer">
                        <span v-if="slotProps.row.description" class="ellipsis">{{ slotProps.row.description }}</span>
                        <span v-else class="text-grey-6">{{ $t('dashboard.generalSettings.editDescription') }}</span>
                        <q-icon name="edit" size="14px" color="grey-6" class="q-ml-xs" />
                        <q-popup-edit v-slot="scope" v-model="slotProps.row.description" auto-save>
                            <q-input v-model="scope.value" type="textarea" autogrow outlined dense autofocus :label="`${slotProps.row.name} - ${$t('common.description')}`" @keyup.enter.stop />
                        </q-popup-edit>
                    </q-td>
                </template>
                <template #body-cell-meaningful="slotProps">
                    <q-td :props="slotProps">
                        <q-checkbox v-model="slotProps.row.meaningful" dense size="sm" />
                    </q-td>
                </template>
                <template #body-cell-buttons="slotProps">
                    <q-td :props="slotProps">
                        <q-btn flat round dense size="sm" icon="delete" @click="deleteColumn(slotProps.rowIndex)">
                            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.delete') }}</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </template>
    </div>
</template>

<script setup lang="ts">
import { onMounted, PropType, ref, watch } from 'vue'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import DashboardGeneralSettingDescriptor from '../DashboardGeneralSettingsDescriptor.json'
import DatasetDescriptor from '@/modules/managers/datasetManagement/detailView/metadataCard/DatasetManagementMetadataCardDescriptor.json'

const store = dashboardStore()

const props = defineProps({
    dashboardModelProp: {
        type: Object as PropType<any>,
        default: () => ({})
    }
})

const emits = defineEmits(['change'])

const columns = DashboardGeneralSettingDescriptor.aiSettingsColumns as any[]

const datasets = ref<any[]>([])
const selectedDataset = ref<any>(null)
const datasetColumns = ref<any[]>([])

onMounted(() => {
    datasets.value = props.dashboardModelProp.configuration?.datasets || []
    const aiSettings = props.dashboardModelProp.configuration?.aiSettings
    if (aiSettings) {
        selectedDataset.value = aiSettings.dataset || null
        datasetColumns.value = aiSettings.columns || []
    }
})

function updateDatasetColumns() {
    if (!selectedDataset.value) return
    const dataset = store.getAllDatasets().find((ds) => ds.id.dsId === selectedDataset.value?.id)
    // A column is meaningful unless it was explicitly set to false.
    datasetColumns.value = (dataset?.metadata.fieldsMeta ?? []).map((col) => ({ ...col, meaningful: col.meaningful ?? true }))
    emits('change', { dataset: selectedDataset.value, columns: datasetColumns.value })
}

function getDataType(field: any) {
    return DatasetDescriptor.valueTypes.find((type) => type.name === field)?.value || field
}

function deleteColumn(index: number) {
    datasetColumns.value.splice(index, 1)
}

watch(
    datasetColumns,
    (newColumns) => {
        if (newColumns.length > 0) emits('change', { dataset: selectedDataset.value, columns: newColumns })
    },
    { deep: true }
)
</script>

<style scoped lang="scss">
.ai-settings__dataset {
    max-width: 400px;
}

.ai-settings__description {
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
}
</style>
