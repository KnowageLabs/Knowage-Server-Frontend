<template>
    <div class="dataset-list">
        <div class="row items-center no-wrap q-pa-sm">
            <q-input v-model="search" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="col kn-field-compact" data-test="dataset-search">
                <template #prepend>
                    <q-icon name="search" size="16px" />
                </template>
            </q-input>
            <q-btn unelevated dense no-caps color="primary" icon="add" :label="$t('common.add')" class="kn-editor-add-button q-ml-sm q-px-sm" data-test="add-dataset-button" data-tour-id="dataset-add" @click="toggleDataDialog">
                <q-tooltip :delay="500">{{ $t('dashboard.datasetEditor.addDataset') }}</q-tooltip>
            </q-btn>
        </div>
        <q-separator />
        <WidgetEditorDrawerList :searchable="false" :items="filteredDatasets" :item-key="'dsId'" :active-key="selectedDatasetId" class="dataset-list__items" @item-click="(item) => selectDataset(item.dataset)">
            <template #leading="{ item }">
                <q-icon :name="getTypeIcon(item.dataset)" size="16px" />
            </template>
            <template #label="{ item }">
                <span data-test="dataset-list-item">
                    {{ item.dataset.label }}
                    <q-tooltip :delay="500">{{ item.dataset.label }}</q-tooltip>
                </span>
            </template>
            <template #trailing="{ item }">
                <span>
                    <q-btn flat round dense size="sm" icon="delete" :disable="isDatasetUsed(item.dsId)" class="kn-editor-action" data-test="delete-dataset-list-item" @click.stop="deleteDatasetFromModel(item.dataset)" />
                    <q-tooltip :delay="500">{{ $t(isDatasetUsed(item.dsId) ? 'common.info.datasetUsed' : 'common.delete') }}</q-tooltip>
                </span>
            </template>
        </WidgetEditorDrawerList>

        <DataDialog v-if="dataDialogVisible" :selected-datasets-prop="selectedDatasets" :available-datasets-prop="availableDatasetsProp" data-test="dataset-data-dialog" @addSelectedDatasets="addSelectedDatasets" @close="toggleDataDialog" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset } from '../../../Dashboard'
import DataDialog from '../DatasetEditorDataDialog/DatasetEditorDataDialog.vue'
import WidgetEditorDrawerList from '../../../widget/WidgetEditor/common/WidgetEditorDrawerList.vue'
import dashStore from '../../../Dashboard.store'
import { mapState } from 'pinia'

// Material Symbols, the icon set of the widget editor Settings list
const datasetTypeIcons = {
    SbiCustomDataSet: 'sym_o_extension',
    SbiFederatedDataSet: 'sym_o_hub',
    SbiFileDataSet: 'sym_o_description',
    SbiFlatDataSet: 'sym_o_table_rows',
    SbiJClassDataSet: 'sym_o_coffee',
    SbiPreparedDataSet: 'sym_o_auto_awesome',
    SbiPythonDataSet: 'sym_o_terminal',
    SbiQbeDataSet: 'sym_o_view_list',
    SbiQueryDataSet: 'sym_o_database',
    SbiRESTDataSet: 'sym_o_api',
    SbiSPARQLDataSet: 'sym_o_share',
    SbiScriptDataSet: 'sym_o_javascript',
    SbiSolrDataSet: 'sym_o_manage_search'
}

export default defineComponent({
    name: 'dataset-editor-data-list',
    components: { DataDialog, WidgetEditorDrawerList },
    props: {
        dashboardDatasetsProp: { required: true, type: Array as any },
        availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> },
        selectedDatasetsProp: { required: true, type: Array as any },
        selectedDatasetId: { type: Number, default: null }
    },
    emits: ['datasetSelected', 'addSelectedDatasets', 'deleteDataset'],
    inject: ['dashboardId'],
    data() {
        return {
            selectedDatasets: [] as any,
            dataDialogVisible: false,
            search: '' as string | null
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
        }),
        // The drawer list keys and activates rows by a flat key, so each row wraps its dataset
        filteredDatasets(): { dsId: number; dataset: any }[] {
            const search = (this.search ?? '').trim().toLowerCase()
            return this.selectedDatasets.filter((dataset) => !search || dataset.label?.toLowerCase().includes(search)).map((dataset) => ({ dsId: dataset.id.dsId, dataset }))
        }
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
        selectDataset(dataset) {
            this.$emit('datasetSelected', dataset.id.dsId)
        },
        getTypeIcon(dataset): string {
            return datasetTypeIcons[dataset.type] ?? 'sym_o_database'
        },
        isDatasetUsed(datasetId) {
            if (!this.dashboards || !datasetId) return false

            if (!this.dashboards[this.dashboardId as string]) return false

            for (const widget of this.dashboards[this.dashboardId as string].widgets) {
                if (widget.dataset === datasetId || (Array.isArray(widget.layers) && widget.layers.some((layer) => layer.type === 'dataset' && layer.id === datasetId))) return true
            }

            return false
        }
    }
})
</script>
