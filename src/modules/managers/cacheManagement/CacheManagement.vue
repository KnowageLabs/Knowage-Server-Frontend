<template>
    <div class="cache-management kn-page">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.cacheManagement.title') }}</q-toolbar-title>
        </q-toolbar>
        <ProgressBar v-if="showProgressBar" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
        <div class="row q-col-gutter-sm overflow-auto">
            <div class="col-12 col-md-4">
                <RuntimeInformationCard v-if="selectedDatasource" :item="cache" :chart-data="chartData" @refresh="onRefresh"></RuntimeInformationCard>
            </div>
            <div class="col-12 col-md-8">
                <GeneralSettingsCard v-if="settingsPendingCount == 0" :item="settings" :datasources="datasources" :selected-datasource="selectedDatasource" @inserted="pageReload"></GeneralSettingsCard>
            </div>
            <div class="col-12">
                <DatasetTableCard :dataset-metadata-list="datasetMetadataList" :loading="datasetMetadataLoading" @deleted="loadDatasetsMetadata"></DatasetTableCard>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iCache, iMeta, iSettings } from './CacheManagement'
import { AxiosResponse } from 'axios'
import DatasetTableCard from './cards/DatasetTableCard/DatasetTableCard.vue'
import GeneralSettingsCard from './cards/GeneralSettingsCard/GeneralSettingsCard.vue'
import RuntimeInformationCard from './cards/RuntimeInformationCard/RuntimeInformationCard.vue'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'cache-management',
    components: {
        DatasetTableCard,
        GeneralSettingsCard,
        RuntimeInformationCard
    },
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            cache: {} as iCache,
            loading: false,
            datasetMetadataLoading: true,
            settingsPendingCount: 10,
            chartData: [] as any,
            datasetMetadataList: [] as iMeta[],
            settings: {} as iSettings,
            selectedDatasource: null as any,
            datasources: [] as any
        }
    },
    computed: {
        showProgressBar(): boolean {
            return this.loading || this.settingsPendingCount != 0
        }
    },
    async created() {
        this.loadPage()
    },
    methods: {
        loadCache() {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/cacheee').then((response: AxiosResponse<any>) => {
                this.cache = response.data
                this.chartData = [this.cache.availableMemoryPercentage, 100 - this.cache.availableMemoryPercentage]
            })
        },
        loadSettings() {
            this.settings = {} as iSettings
            this.settingsPendingCount = 11
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.NAMEPREFIX')
                .then((response: AxiosResponse<any>) => (this.settings.prefixForCacheTablesName = response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.LIMIT_FOR_CLEAN')
                .then((response: AxiosResponse<any>) => (this.settings.limitForClean = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.SCHEDULING_FULL_CLEAN')
                .then((response: AxiosResponse<any>) => (this.settings.schedulingFullClean = { label: response.data.valueCheck, value: response.data.valueCheck }))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.DS_LAST_ACCESS_TTL')
                .then((response: AxiosResponse<any>) => (this.settings.lastAccessTtl = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.CREATE_AND_PERSIST_TABLE.TIMEOUT')
                .then((response: AxiosResponse<any>) => (this.settings.createAndPersistTimeout = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.SPACE_AVAILABLE')
                .then((response: AxiosResponse<any>) => (this.settings.spaceAvailable = +response.data.valueCheck / 1048576))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.LIMIT_FOR_STORE')
                .then((response: AxiosResponse<any>) => (this.settings.cacheLimitForStore = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.WORKMANAGER.SQLDBCACHE.TIMEOUT')
                .then((response: AxiosResponse<any>) => (this.settings.sqldbCacheTimeout = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.HAZELCAST.TIMEOUT')
                .then((response: AxiosResponse<any>) => (this.settings.hazelcastTimeout = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.HAZELCAST.LEASETIME')
                .then((response: AxiosResponse<any>) => (this.settings.hazelcastLeaseTime = +response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs/label/SPAGOBI.CACHE.REFRESH')
                .then((response: AxiosResponse<any>) => (this.settings.scheduledModality = response.data.valueCheck))
                .finally(() => this.settingsPendingCount--)
        },
        async loadDataSources() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasources/?type=cache')
                .then((response: AxiosResponse<any>) => {
                    this.datasources = []
                    response.data.map((datasource: any) => {
                        if (datasource.readOnly === false) {
                            this.datasources.push(datasource)
                        }
                        if (datasource.writeDefault === true) {
                            this.selectedDatasource = datasource
                        }
                    })
                })
                .finally(() => (this.loading = false))

            if (this.selectedDatasource === null) {
                this.store.setError({
                    title: this.$t('managers.cacheManagement.noDefaultDatasetTitle'),
                    msg: this.$t('managers.cacheManagement.noDefaultDataset')
                })
            }
        },
        loadDatasetsMetadata() {
            this.datasetMetadataLoading = true
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/cacheee/meta')
                .then((response: AxiosResponse<any>) => (this.datasetMetadataList = response.data))
                .finally(() => (this.datasetMetadataLoading = false))
        },
        async loadPage() {
            await this.loadDataSources()
            this.loadCache()
            this.loadSettings()
            this.loadDatasetsMetadata()
        },
        pageReload() {
            this.loadPage()
        },
        onRefresh() {
            this.loadCache()
            this.loadDatasetsMetadata()
        }
    }
})
</script>
