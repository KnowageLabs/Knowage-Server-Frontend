<template>
    <div class="dashboard-editor-list-card-container p-m-3">
        <div class="dashboard-editor-list-card">
            <Button label="Add Dataset" icon="pi pi-plus-circle" class="p-button-outlined p-mt-2 p-mx-2" data-test="add-dataset-button" @click="toggleDataDialog"></Button>
            <Listbox class="kn-list kn-list-no-border-right dashboard-editor-list" :options="selectedDatasets" :filter="true" :filter-placeholder="$t('common.search')" option-label="label" filter-match-mode="contains" :filter-fields="['label']" :empty-filter-message="$t('common.info.noDataFound')" @change="selectDataset">
                <template #empty>{{ $t('common.info.noDataFound') }}</template>
                <template #option="slotProps">
                    <div class="kn-list-item" :style="dataListDescriptor.style.list.listItem" data-test="dataset-list-item">
                        <i class="p-mx-2" :style="dataListDescriptor.style.list.listIcon" :class="dataListDescriptor.listboxSettings.avatar.values[slotProps.option.type].icon"></i>
                        <span v-tooltip.right="slotProps.option.label" class="kn-list-item-text">{{ slotProps.option.label }}</span>
                        <q-btn flat round size="sm" :disable="isDatasetUsed(slotProps.option.id.dsId)" icon="delete" class="deleteButton" data-test="delete-dataset-list-item" @click.stop="deleteDatasetFromModel(slotProps.option)">
                            <q-tooltip :delay="500">{{ $t(isDatasetUsed(slotProps.option.id.dsId) ? 'common.info.datasetUsed' : 'common.delete') }}</q-tooltip>
                        </q-btn>
                    </div>
                </template>
            </Listbox>
        </div>

        <DataDialog v-if="dataDialogVisible" :selected-datasets-prop="selectedDatasets" :available-datasets-prop="availableDatasetsProp" data-test="dataset-data-dialog" @addSelectedDatasets="addSelectedDatasets" @close="toggleDataDialog" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboard, IDataset } from '../../../Dashboard'
import Listbox from 'primevue/listbox'
import DataDialog from '../DatasetEditorDataDialog/DatasetEditorDataDialog.vue'
import dashStore from '../../../Dashboard.store'
import dataListDescriptor from './DatasetEditorDataListDescriptor.json'
import { mapState } from 'pinia'

export default defineComponent({
    name: 'dataset-editor-data-list',
    components: { Listbox, DataDialog },
    props: { dashboardDatasetsProp: { required: true, type: Array as any }, availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> }, selectedDatasetsProp: { required: true, type: Array as any } },
    emits: ['datasetSelected', 'addSelectedDatasets', 'deleteDataset'],
    inject: ['dashboardId'],
    data() {
        return {
            dataListDescriptor,
            selectedDatasets: [] as any,
            dataDialogVisible: false
        }
    },
    watch: {
        selectedDatasetsProp() {
            this.loadSelectedDatasets()
        }
    },
    computed: {
        ...mapState(dashStore, {
            dashboards: 'dashboards'
        })
    },
    created() {
        this.loadSelectedDatasets()
    },
    methods: {
        loadSelectedDatasets() {
            this.selectedDatasets = this.selectedDatasetsProp
        },
        toggleDataDialog() {
            this.dataDialogVisible = !this.dataDialogVisible
        },
        addSelectedDatasets(datasetsToAdd) {
            this.$emit('addSelectedDatasets', datasetsToAdd)
            this.dataDialogVisible = false
        },
        deleteDatasetFromModel(datasetToDelete) {
            this.$emit('deleteDataset', datasetToDelete)
        },
        selectDataset(event) {
            this.$emit('datasetSelected', event.value.id.dsId)
        },
        isDatasetUsed(datasetId) {
            if (!this.dashboards || !datasetId) return false

            if (!this.dashboards[this.dashboardId as string]) return false

            for (const widget of this.dashboards[this.dashboardId as string].widgets) {
                if (widget.dataset === datasetId) return true
            }

            return false
        }
    }
})
</script>
<style scoped lang="scss">
.deleteButton {
    position: absolute;
    right: 0;
}
</style>
