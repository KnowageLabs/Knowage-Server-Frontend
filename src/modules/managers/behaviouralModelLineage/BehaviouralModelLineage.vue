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
            <BMLTable :table-data="allDocuments" :header-title="$t('common.documents')" :loading="tableLoading.documents" :selection-locked="selectionLocked" data-type="documents" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allDatasets" :header-title="$t('common.dataset')" :loading="tableLoading.datasets" :selection-locked="selectionLocked" data-type="datasets" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allDrivers" :header-title="$t('common.driver')" :loading="tableLoading.drivers" :selection-locked="selectionLocked" data-type="analyticalDrivers" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allLovs" :header-title="$t('managers.bml.lovsTitle')" :loading="tableLoading.lovs" :selection-locked="selectionLocked" data-type="lovs" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
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
            tableLoading: {
                documents: false,
                datasets: false,
                drivers: false,
                lovs: false
            } as Record<string, boolean>,
            filterFields: ['name', 'label'],
            filters: { global: [filterDefault] } as Object,
            allLovs: [] as iLov[],
            selectedLov: {} as iLov,
            allDrivers: [] as iAnalyticalDriver[],
            allDocuments: [] as iDocument[],
            allDatasets: [] as iDataset[]
        }
    },
    computed: {
        selectionLocked(): boolean {
            return Object.values(this.tableLoading).some((v) => v)
        }
    },
    created() {
        this.loadAllData()
    },
    methods: {
        async loadAllData() {
            this.loading = true
            this.tableLoading = { documents: true, datasets: true, drivers: true, lovs: true }
            await Promise.all([this.loadAllLovs(), this.loadAllDrivers(), this.loadAllDocuments(), this.loadAllDatasets()]).finally(() => {
                this.loading = false
            })
        },
        async loadAllLovs() {
            this.tableLoading.lovs = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/lovs/get/all/')
                .then((response: AxiosResponse<any>) => {
                    this.allLovs = response.data
                })
                .finally(() => {
                    this.tableLoading.lovs = false
                })
        },
        async loadAllDrivers() {
            this.tableLoading.drivers = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/analyticalDrivers')
                .then((response: AxiosResponse<any>) => {
                    this.allDrivers = response.data
                })
                .finally(() => {
                    this.tableLoading.drivers = false
                })
        },
        async loadAllDocuments() {
            this.tableLoading.documents = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents')
                .then((response: AxiosResponse<any>) => {
                    this.allDocuments = response.data
                })
                .finally(() => {
                    this.tableLoading.documents = false
                })
        },
        async loadAllDatasets() {
            this.tableLoading.datasets = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasets')
                .then((response: AxiosResponse<any>) => {
                    this.allDatasets = response.data
                })
                .finally(() => {
                    this.tableLoading.datasets = false
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
            this.tableLoading = { documents: true, datasets: true, drivers: true, lovs: false }
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${lov.id}/analyticalDrivers/`).then((response: AxiosResponse<any>) => (this.allDrivers = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${lov.id}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            this.tableLoading.drivers = false
            this.tableLoading.documents = false
            // Also fetch datasets related to the returned documents
            this.tableLoading.datasets = true
            const documentDatasetsPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.id}/dataset/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentDatasetsArrays = await Promise.all(documentDatasetsPromises)
            const allDatasets = documentDatasetsArrays.flat()
            this.allDatasets = allDatasets
            this.tableLoading.datasets = false
            this.loading = false
        },
        async filterByDrivers(driver) {
            this.loading = true
            this.tableLoading = { documents: true, datasets: true, drivers: false, lovs: true }
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${driver.id}/lovs/`).then((response: AxiosResponse<any>) => (this.allLovs = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${driver.id}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            this.tableLoading.lovs = false
            this.tableLoading.documents = false

            this.tableLoading.datasets = true
            const documentDatasetsPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.id}/dataset/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentDatasetsArrays = await Promise.all(documentDatasetsPromises)
            const allDatasets = documentDatasetsArrays.flat()
            this.allDatasets = allDatasets
            this.tableLoading.datasets = false
            this.loading = false
        },
        async filterByDocuments(doc) {
            this.loading = true
            this.tableLoading = { documents: false, datasets: true, drivers: true, lovs: true }
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/lovs/`).then((response: AxiosResponse<any>) => (this.allLovs = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/analyticalDrivers/`).then((response: AxiosResponse<any>) => (this.allDrivers = response.data))
            this.tableLoading.lovs = false
            this.tableLoading.drivers = false

            const documentDatasets = await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.id}/dataset/`).then((response: AxiosResponse<any>) => response.data)
            this.allDatasets = documentDatasets
            this.tableLoading.datasets = false
            this.loading = false
        },
        async filterByDatasets(dataset) {
            this.loading = true
            this.tableLoading = { documents: true, datasets: false, drivers: true, lovs: true }
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/${dataset.id.dsId}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            this.tableLoading.documents = false
            // Also fetch LOVs and Drivers related to the returned documents
            const documentLovsPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/lovs/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentLovsArrays = await Promise.all(documentLovsPromises)
            const allLovs = documentLovsArrays.flat()
            this.allLovs = allLovs
            this.tableLoading.lovs = false

            const documentDriversPromises = this.allDocuments.map(async (doc: iDocument) => {
                return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/analyticalDrivers/`).then((response: AxiosResponse<any>) => response.data)
            })
            const documentDriversArrays = await Promise.all(documentDriversPromises)
            const allDrivers = documentDriversArrays.flat()
            this.allDrivers = allDrivers
            this.tableLoading.drivers = false
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
