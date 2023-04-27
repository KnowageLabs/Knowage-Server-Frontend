<template>
    <Button icon="fas fa-eye" class="p-button-text p-button-rounded p-button-plain dataset-preview-button" :disabled="!selectedDataset.id" @click="previewSelectedDataset" />

    <DataList :dashboard-datasets-prop="dashboardDatasetsProp" :available-datasets-prop="availableDatasetsProp" :selected-datasets-prop="selectedDatasets" @addSelectedDatasets="addSelectedDatasets" @datasetSelected="selectDataset" @deleteDataset="$emit('deleteDataset', $event)" />
    <DataDetail :dashboard-datasets-prop="dashboardDatasetsProp" :selected-dataset-prop="selectedDataset" :document-drivers-prop="documentDriversProp" :dashboard-id="dashboardId" data-test="dataset-detail" />

    <DatasetEditorPreview v-if="previewShown" :visible="previewShown" :prop-dataset="datasetToPreview" @close="previewShown = false" />
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
            selectedDataset: {} as any,
            datasetToPreview: {} as any,
            selectedDatasets: [] as any[],
            datasetDriversMap: {}
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
            this.selectedDataset = this.availableDatasetsProp.find((dataset) => dataset.id.dsId === datasetId)
        },
        loadSelectedDatasets() {
            this.selectedDatasets = this.selectedDatasetsProp
        },
        addSelectedDatasets(datasetsToAdd) {
            this.$emit('addSelectedDatasets', datasetsToAdd)
        },
        deleteAndUnselectDataset(event) {
            this.selectedDataset = null
            this.$emit('deleteDataset', event)
        },
        async loadDataset(datasetLabel: string) {
            await this.$http
                .get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/datasets/${datasetLabel}`)
                .then((response: AxiosResponse<any>) => {
                    this.datasetToPreview = response.data[0]
                })
                .catch(() => {})
        },
        async previewSelectedDataset() {
            console.log(this.selectedDataset)

            await this.loadDataset(this.selectedDataset.label)
            this.datasetToPreview.drivers = [...this.selectedDataset.modelDrivers]
            this.datasetToPreview.pars = [...this.selectedDataset.parameters]

            setTimeout(() => {
                this.previewShown = !this.previewShown
            }, 200)

            console.log(this.datasetToPreview)
        }
    }
})
</script>
<style lang="scss">
@media screen and (max-width: 1199px) {
    #dataset-editor-preview {
        -webkit-transition: width 0.3s;
        transition: flex 0.3s;
        flex: 0;
    }
}
@media screen and (min-width: 1200px) {
    #dataset-editor-preview {
        -webkit-transition: width 0.3s;
        transition: flex 0.3s;
        flex: 1;
        border-left: 1px solid #ccc;
    }
}
.dataset-preview-button {
    position: absolute;
    right: 10px;
    top: 40px;
}
</style>
