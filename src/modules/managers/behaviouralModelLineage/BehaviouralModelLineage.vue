<template>
    <div class="kn-page">
        <ProgressSpinner v-if="loading" class="kn-progress-spinner" />
        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start>
                {{ $t('managers.bml.title') }}
            </template>
            <template #end>
                <Button icon="fa-solid fa-arrows-rotate" class="p-button-text p-button-rounded p-button-plain" @click="loadAllData" />
            </template>
        </Toolbar>

        <div id="table-container" class="p-d-flex p-flex-row bml-table-container">
            <BMLTable :table-data="allLovs" :header-title="$t('managers.bml.lovsTitle')" :loading="loading" data-type="lovs" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allDrivers" :header-title="$t('managers.bml.drivers')" :loading="loading" data-type="analyticalDrivers" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
            <BMLTable :table-data="allDocuments" :header-title="$t('managers.datasetManagement.documents')" :loading="loading" data-type="documents" @rowSelected="onRowSelect" @rowUnselected="onRowUnselect" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { iLov, iAnalyticalDriver, iDocument } from './BehaviouralModelLineage'
import descriptor from './BehaviouralModelLineageDescriptor.json'
import ProgressSpinner from 'primevue/progressspinner'
import BMLTable from './BehaviouralModelLineageTable.vue'

export default defineComponent({
    name: 'behavioural-model-lineage',
    components: {
        ProgressSpinner,
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
            allDocuments: [] as iDocument[]
        }
    },
    created() {
        this.loadAllData()
    },
    methods: {
        async loadAllData() {
            this.loading = true
            await Promise.all([this.loadAllLovs(), this.loadAllDrivers(), this.loadAllDocuments()]).then(() => (this.loading = false))
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
            }
        },
        onRowUnselect() {
            this.loadAllData()
        },
        async filterByLovs(lov) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${lov.id}/analyticalDrivers/`).then((response: AxiosResponse<any>) => (this.allDrivers = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${lov.id}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            this.loading = false
        },
        async filterByDrivers(driver) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${driver.id}/lovs/`).then((response: AxiosResponse<any>) => (this.allLovs = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${driver.id}/documents/`).then((response: AxiosResponse<any>) => (this.allDocuments = response.data))
            this.loading = false
        },
        async filterByDocuments(doc) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/lovs/`).then((response: AxiosResponse<any>) => (this.allLovs = response.data))
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${doc.label}/analyticalDrivers/`).then((response: AxiosResponse<any>) => (this.allDrivers = response.data))
            this.loading = false
        }
    }
})
</script>
<style lang="scss">
.bml-table .p-datatable-header {
    padding: 0 !important;
}
.bml-table-container {
    height: calc(100% - var(--kn-toolbar-height));
}
</style>
