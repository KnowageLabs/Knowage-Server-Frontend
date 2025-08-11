<template>
    <div class="p-d-flex p-flex-column dashboard-card-shadow kn-flex p-mr-3 p-my-3 kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3">{{ $t('dashboard.generalSettings.aisettings') }}</label>

        <div class="row q-col-gutter-sm">
            <q-banner class="bg-info text-black q-mx-sm q-ml-md" rounded dense>
                <template v-slot:avatar> <q-icon name="info" color="primary" /> </template>{{ $t('dashboard.generalSettings.aiSettingsHint') }}
            </q-banner>
            <q-select filled :options="datasets" v-model="selectedDataset" option-label="dsLabel" label="Select Dataset" class="col-md-6 col-sm-12 q-ml-sm" @update:model-value="updateDatasetColumns" />
            <q-table dense v-if="selectedDataset && datasetColumns" flat :rows="datasetColumns" :columns="columns" class="col-12" :pagination="{ rowsPerPage: 20 }" row-key="name">
                <template #body-cell-meaningful="slotProps">
                    <q-td align="right">
                        <q-checkbox indeterminate-value="not answered" size="xs" v-model="slotProps.row.meaningful" @update:model-value="updateRow(slotProps.rowIndex, slotProps.row.meaningful)" />
                    </q-td>
                </template>
                <template #body-cell-dataType="slotProps">
                    <q-td>
                        <span>{{ getDataType(slotProps.value) }}</span>
                    </q-td>
                </template>
                <template #body-cell-description="slotProps">
                    <q-td :props="slotProps">
                        <q-btn size="sm" :flat="!slotProps.row.description || slotProps.row.description == ''" round color="primary" icon="info" @click="openDescriptionDialog(slotProps.rowIndex)">
                            <q-tooltip v-if="slotProps.row.description && slotProps.row.description !== ''" anchor="top middle" self="bottom middle" :offset="[0, 10]">
                                {{ slotProps.row.description }}
                            </q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
                <template #header-cell="slotProps">
                    <q-th :props="slotProps">
                        <span class="kn-capitalize">{{ $t(slotProps.col.label) }}</span>
                    </q-th>
                </template>
                <template #header-cell-meaningful="slotProps">
                    <q-th align="right">
                        <span
                            >{{ $t(slotProps.col.label) }}
                            <q-icon name="help" size="xs">
                                <q-tooltip :delay="500">{{ $t('dashboard.generalSettings.meaningfulHint') }}</q-tooltip>
                            </q-icon>
                        </span>
                    </q-th>
                </template>
            </q-table>
        </div>
    </div>
    <q-dialog v-model="descriptionDialog">
        <q-card style="min-width: 350px">
            <q-card-section>
                <div class="text-h6">{{ `${datasetColumns[rowIndex].name} - ${$t('common.description')}` }}</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
                <q-input filled v-if="datasetColumns[rowIndex]" :debounce="300" type="textarea" rows="3" v-model="datasetColumns[rowIndex].description" autofocus />
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat :label="$t('common.close')" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
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

const columns = DashboardGeneralSettingDescriptor.aiSettingsColumns

const datasets = ref([])
const selectedDataset = ref(null)
const datasetColumns = ref<any[]>([])
const rowIndex = ref(0)
const descriptionDialog = ref(false)

onMounted(() => {
    datasets.value = props.dashboardModelProp.configuration.datasets || []
    if (props.dashboardModelProp.configuration?.aiSettings) {
        selectedDataset.value = props.dashboardModelProp.configuration?.aiSettings.dataset || ''
        datasetColumns.value = props.dashboardModelProp.configuration?.aiSettings.columns || []
    }
})

function updateDatasetColumns() {
    if (selectedDataset.value) {
        const dataset = store.getAllDatasets().find((ds) => ds.id.dsId === selectedDataset.value?.id)
        datasetColumns.value = dataset?.metadata.fieldsMeta ?? []
        datasetColumns.value = datasetColumns.value.map((col) => ({
            ...col,
            meaningful: col.meaningful || true
        }))
        emits('change', {
            dataset: selectedDataset.value,
            columns: datasetColumns.value
        })
    }
}

function updateRow(rowIndex: number, value: boolean) {
    datasetColumns.value[rowIndex].meaningful = value
}

function getDataType(field: any) {
    return DatasetDescriptor.valueTypes.find((type) => type.name === field)?.value || field
}

function openDescriptionDialog(index) {
    rowIndex.value = index
    descriptionDialog.value = true
}

watch(
    datasetColumns,
    (newColumns) => {
        if (newColumns.length > 0) {
            emits('change', {
                dataset: selectedDataset.value,
                columns: newColumns
            })
        }
    },
    { deep: true }
)
</script>
