<template>
    <div class="kn-page bml-page">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-icon name="account_tree" size="20px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-medium">{{ $t('managers.bml.title') }}</div>
            <q-space />
            <q-btn round flat dense icon="refresh" :disable="loading" @click="loadAllData">
                <q-tooltip>{{ $t('common.refresh') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <div id="table-container" class="bml-table-container">
            <BMLTable :table-data="allDocuments" :header-title="$t('managers.datasetManagement.documents')" :loading="loading" data-type="documents" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allDatasets" :header-title="$t('common.datasets')" :loading="loading" data-type="datasets" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allDrivers" :header-title="$t('managers.bml.drivers')" :loading="loading" data-type="analyticalDrivers" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allLovs" :header-title="$t('managers.bml.lovsTitle')" :loading="loading" data-type="lovs" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { iLov, iAnalyticalDriver, iDocument, iDataset } from './BehaviouralModelLineage'
import descriptor from './BehaviouralModelLineageDescriptor.json'
import { QBtn, QIcon, QSpace, QToolbar, QTooltip } from 'quasar'
import BMLTable from './BehaviouralModelLineageTable.vue'

export default defineComponent({
    name: 'behavioural-model-lineage',
    components: {
        QToolbar,
        QBtn,
        QIcon,
        QSpace,
        QTooltip,
        BMLTable
    },
    data() {
        return {
            descriptor,
            loading: false,
            filterFields: ['name', 'label'],
            filters: { global: [filterDefault] } as Object,
            allLovs: [] as iLov[],
            selectedLov: {} as iLov,
            allDrivers: [] as iAnalyticalDriver[],
            allDocuments: [] as iDocument[],
            allDatasets: [] as iDataset[]
        }
    },
    created() {
        this.loadAllData()
    },
    methods: {
        async loadAllData() {
            this.loading = true
            await Promise.all([this.loadAllLovs(), this.loadAllDrivers(), this.loadAllDocuments(), this.loadAllDatasets()]).then(() => (this.loading = false))
        },
        async loadAllLovs() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/lovs/get/all/').then((response: AxiosResponse<any>) => {
                this.allLovs = response.data
            })
        },
        async loadAllDrivers() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/analyticalDrivers').then((response: AxiosResponse<any>) => {
                this.allDrivers = response.data
            })
        },
        async loadAllDocuments() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents').then((response: AxiosResponse<any>) => {
                this.allDocuments = response.data
            })
        },
        async loadAllDatasets() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasets').then((response: AxiosResponse<any>) => {
                this.allDatasets = response.data
            })
        },
        onRowSelect(event, dataType) {
            switch (dataType) {
                case 'lovs':
                    this.filterByLovs(event.data)
                    break
                case 'analyticalDrivers':
                    this.filterByDrivers(event.data)
                    break
                case 'documents':
                    this.filterByDocuments(event.data)
                    break
                case 'datasets':
                    this.filterByDatasets(event.data)
                    break
            }
        },
        onRowUnselect() {
            this.loadAllData()
        },
        async filterByLovs(lov) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${lov.id}/analyticalDrivers/`).then((response: AxiosResponse<any>) => (this.allDrivers = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${lov.id}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            // Also fetch datasets related to the returned documents
            const documentDatasetsPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.id}/dataset/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentDatasetsArrays = await Promise.all(documentDatasetsPromises)
            const allDatasets = documentDatasetsArrays.flat()
            this.allDatasets = allDatasets
            this.loading = false
        },
        async filterByDrivers(driver) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${driver.id}/lovs/`).then((response: AxiosResponse<any>) => (this.allLovs = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${driver.id}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))

            const documentDatasetsPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.id}/dataset/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentDatasetsArrays = await Promise.all(documentDatasetsPromises)
            const allDatasets = documentDatasetsArrays.flat()
            this.allDatasets = allDatasets
            this.loading = false
        },
        async filterByDocuments(doc) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/lovs/`).then((response: AxiosResponse<any>) => (this.allLovs = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/analyticalDrivers/`).then((response: AxiosResponse<any>) => (this.allDrivers = response.data))

            const documentDatasets = await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.id}/dataset/`).then((response: AxiosResponse<any>) => response.data)
            this.allDatasets = documentDatasets
            this.loading = false
        },
        async filterByDatasets(dataset) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/${dataset.id.dsId}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            // Also fetch LOVs and Drivers related to the returned documents
            const documentLovsPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/lovs/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentLovsArrays = await Promise.all(documentLovsPromises)
            const allLovs = documentLovsArrays.flat()
            this.allLovs = allLovs

            const documentDriversPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/analyticalDrivers/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentDriversArrays = await Promise.all(documentDriversPromises)
            const allDrivers = documentDriversArrays.flat()
            this.allDrivers = allDrivers
            this.loading = false
        }
    }
})
</script>
<style lang="scss">
.bml-page {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.bml-table-container {
    height: calc(100% - var(--kn-toolbar-height));
    display: grid;
    grid-template-columns: repeat(4, minmax(280px, 1fr));
    gap: 12px;
    padding: 12px;
    align-items: stretch;
}
</style>
