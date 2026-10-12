<template>
    <div class="dataset-editor-tab row no-wrap">
        <aside class="dataset-editor-tab__list" data-tour-id="dataset-list">
            <q-scroll-area class="fit">
                <DataList :dashboard-datasets-prop="dashboardDatasetsProp" :available-datasets-prop="availableDatasetsProp" :selected-datasets-prop="selectedDatasets" :selected-dataset-id="selectedDatasetId" @addSelectedDatasets="addSelectedDatasets" @datasetSelected="selectDataset" @deleteDataset="$emit('deleteDataset', $event)" />
            </q-scroll-area>
        </aside>
        <div class="dataset-editor-tab__content col kn-background" data-tour-id="dataset-detail">
            <q-scroll-area class="fit">
                <DataDetail :dashboard-datasets-prop="dashboardDatasetsProp" :selected-dataset-prop="selectedDataset" :document-drivers-prop="documentDriversProp" :dashboard-id="dashboardId" data-test="dataset-detail" @preview="previewSelectedDataset" />
            </q-scroll-area>
        </div>

        <DatasetEditorPreview v-if="previewShown" :visible="previewShown" :prop-dataset="datasetToPreview" :dashboardId="dashboardId" @close="previewShown = false" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset } from '../../Dashboard'
import DataList from './DatasetEditorDataList/DatasetEditorDataList.vue'
import DataDetail from './DatasetEditorDataDetail/DatasetEditorDataDetail.vue'
import DatasetEditorPreview from './DatasetEditorPreview.vue'
import { AxiosResponse } from 'axios'

export default defineComponent({
    name: 'dataset-editor-data-tab',
    components: { DataList, DataDetail, DatasetEditorPreview },
    props: {
        dashboardDatasetsProp: { required: true, type: Array as any },
        availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> },
        selectedDatasetsProp: { type: Array as any },
        documentDriversProp: { required: true, type: Array as any },
        dashboardId: { type: String, required: true }
    },
    emits: ['addSelectedDatasets', 'deleteDataset'],
    data() {
        return {
            previewShown: false,
            selectedDatasetId: null as number | null,
            datasetToPreview: {} as any,
            selectedDatasets: [] as any[]
        }
    },
    computed: {
        // A deleted dataset leaves the detail, because the lookup no longer finds it
        selectedDataset(): any {
            return this.selectedDatasets.find((dataset) => dataset.id.dsId === this.selectedDatasetId) ?? {}
        }
    },
    watch: {
        selectedDatasetsProp() {
            this.loadSelectedDatasets()
        }
    },
    created() {
        this.loadSelectedDatasets()
    },
    methods: {
        selectDataset(datasetId) {
            this.selectedDatasetId = datasetId
        },
        loadSelectedDatasets() {
            this.selectedDatasets = this.selectedDatasetsProp
        },
        addSelectedDatasets(datasetsToAdd) {
            this.$emit('addSelectedDatasets', datasetsToAdd)
        },
        async loadDataset(datasetLabel: string) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${datasetLabel}`)
                .then((response: AxiosResponse<any>) => {
                    this.datasetToPreview = response.data[0]
                })
                .catch(() => {})
        },
        async previewSelectedDataset() {
            await this.loadDataset(this.selectedDataset.label)

            this.datasetToPreview.drivers = this.getPreviewDrivers()
            this.datasetToPreview.pars = [...this.selectedDataset.parameters]

            setTimeout(() => {
                this.previewShown = !this.previewShown
            }, 100)
        },
        getPreviewDrivers() {
            if (this.selectedDataset.modelDrivers) return [...this.selectedDataset.modelDrivers]
            else if (this.selectedDataset.formattedDrivers) return [...this.selectedDataset.formattedDrivers]
            else return []
        }
    }
})
</script>
