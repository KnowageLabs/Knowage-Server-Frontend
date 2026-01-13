<template>
    <q-dialog v-model="visible" ref="previewTable">
        <q-card style="min-width: 40vw; max-width: 60vw; min-height: 40vh; max-height: 80vh" :style="cardStyle">
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title v-touch-pan.prevent.mouse="onPan">{{ dataset?.label }}</q-toolbar-title>

                <q-btn flat round dense icon="file_download" data-test="close-button">
                    <q-menu auto-close>
                        <q-list dense style="min-width: 100px">
                            <q-item v-for="item in exporters" clickable @click="exportDataset(item)">
                                <q-item-section>{{ item }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                    <q-tooltip :delay="500" anchor="center left" self="center right" class="text-capitalize">{{ $t('common.export') }}</q-tooltip>
                </q-btn>

                <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeDialog">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>

            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar p-ml-2" data-test="progress-bar" />
            <div class="p-d-flex p-flex-column kn-flex workspace-scrollable-table">
                <q-banner v-if="errorMessageVisible" rounded dense class="bg-warning q-ma-sm text-center">
                    <template v-slot:avatar>
                        <q-icon name="warning" />
                    </template>
                    {{ errorMessage }}
                </q-banner>
                <DatasetPreviewTable v-else class="p-d-flex p-flex-column kn-flex p-m-2" :preview-columns="columns" :preview-rows="rows" :pagination="pagination" :preview-type="previewType" @pageChanged="updatePagination($event)" @sort="onSort" @filter="onFilter"></DatasetPreviewTable>
            </div>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import DatasetPreviewTable from '@/modules/workspace/views/dataView/tables/DatasetPreviewTable.vue'
import mainDescriptor from '@/modules/workspace/WorkspaceDescriptor.json'
import workspaceDataPreviewDialogDescriptor from '@/modules/workspace/views/dataView/dialogs/WorkspaceDataPreviewDialogDescriptor.json'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'

import deepcopy from 'deepcopy'
import { mapActions, mapState } from 'pinia'

export default defineComponent({
    name: 'kpi-scheduler-save-dialog',
    components: { DatasetPreviewTable },
    props: { visible: { type: Boolean }, propDataset: { type: Object }, previewType: String, dashboardId: { type: String, required: true } },
    emits: ['close'],
    data() {
        return {
            mainDescriptor,
            workspaceDataPreviewDialogDescriptor,
            dataset: null as any,
            columns: [] as any[],
            rows: [] as any[],
            pagination: { start: 0, limit: 15 } as any,
            sort: null as any,
            filter: null as any,
            errorMessageVisible: false,
            errorMessage: '',
            loading: false,
            filtersData: {} as any,
            correctRolesForExecution: null,
            exporters: ['csv', 'xls'] as any[],
            postData: {} as any,
            cardPos: { x: 0, y: 0 }
        }
    },
    computed: {
        ...mapState(dashboardStore, ['dashboards']),
        cardStyle() {
            return {
                transform: `translate(${this.cardPos.x}px, ${this.cardPos.y}px)`
            }
        }
    },
    watch: {
        async propDataset() {
            if (this.visible) await this.loadPreview()
        },
        async visible(value) {
            if (value) await this.loadPreview()
        }
    },
    async created() {
        await this.loadPreview()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        async loadPreview() {
            this.loadDataset()
            await this.loadPreviewData()
        },
        loadDataset() {
            this.dataset = this.propDataset as any
        },
        async loadPreviewData() {
            this.loading = true
            this.postData = { ...this.pagination }

            if (this.sort) this.postData.sorting = this.sort
            if (this.filter) this.postData.filters = this.filter

            if (this.dataset.pars && this.dataset.pars.length > 0) {
                this.postData.pars = deepcopy(this.dataset.pars)
                const paramRegex = /[^$P{]+(?=\})/
                this.postData.pars.forEach((param: any) => {
                    const matched = paramRegex.exec(param.value)
                    if (matched && matched[0]) {
                        const documentDrivers = this.dashboards[this.dashboardId].drivers
                        for (let index = 0; index < documentDrivers.length; index++) {
                            const driver = documentDrivers[index]
                            if (driver.urlName == matched[0]) {
                                param.value = driver.value
                            }
                        }
                    } else param.value = param.value ?? param.defaultValue
                })
            }

            if (this.dataset.drivers?.length > 0) {
                const formattedDrivers = {}
                this.dataset.drivers.forEach((filter: any) => {
                    formattedDrivers[filter.urlName] = filter.parameterValue
                })
                this.postData.drivers = formattedDrivers
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/${this.dataset.label}/preview`, this.postData, { headers: { 'X-Disable-Errors': 'true' } })
                .then((response: AxiosResponse<any>) => {
                    this.setPreviewColumns(response.data)
                    this.rows = response.data.rows
                    this.pagination.size = response.data.results
                })
                .catch((error) => {
                    this.errorMessage = error.message
                    this.errorMessageVisible = true
                })
            this.loading = false
        },
        async updatePagination(lazyParams: any) {
            this.pagination.start = lazyParams.paginationStart
            this.pagination.limit = lazyParams.paginationLimit
            await this.loadPreviewData()
        },
        async onSort(event: any) {
            this.sort = event
            await this.loadPreviewData()
        },
        async onFilter(event: any) {
            this.filter = event
            await this.loadPreviewData()
        },
        setPreviewColumns(data: any) {
            this.columns = []
            for (let i = 1; i < data.metaData.fields.length; i++) {
                this.columns.push({ header: data.metaData.fields[i].header, field: data.metaData.fields[i].name, type: data.metaData.fields[i].type })
            }
        },
        closeDialog() {
            this.dataset = null
            this.rows = []
            this.columns = []
            this.pagination = { start: 0, limit: 15 }
            this.sort = null
            this.filter = null
            this.errorMessageVisible = false
            this.errorMessage = ''
            this.$emit('close')
        },
        async exportDataset(format) {
            let body = this.postData
            body.parameters = body.pars
            delete body.pars
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/export/dataset/${this.dataset.id}/${format}`, body)
                .then((response: AxiosResponse<any>) => {
                    this.setInfo({
                        title: this.$t('common.export'),
                        msg: this.$t('common.exportSuccess')
                    })
                })
                .catch((error) => {
                    this.setError({
                        title: this.$t('common.export'),
                        msg: error.message
                    })
                })
                .finally(() => {
                    this.loading = false
                })
        },
        onPan(event) {
            this.cardPos = {
                x: this.cardPos.x + event.delta.x,
                y: this.cardPos.y + event.delta.y
            }
        }
    }
})
</script>
<style lang="scss">
.workspace-scrollable-table {
    .p-datatable-wrapper {
        overflow-x: auto;
    }
}
</style>
