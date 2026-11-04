<template>
    <!-- Ported to Quasar in place (spec 8.3, 14.3): Dataset Management and the dataset editor preview use it. Same props, events and requests. -->
    <q-dialog :model-value="visible" persistent @update:model-value="!$event && closeDialog()">
        <q-card class="column no-wrap relative-position kn-ws-preview-card" data-ws-dialog="dataset-preview">
            <div class="row items-center no-wrap kn-ws-preview-card__header">
                <span class="text-subtitle1 ellipsis">{{ dataset?.label }}</span>
                <q-space />
                <q-btn v-if="isParameterSidebarVisible" flat round dense icon="filter_list" :aria-label="$t('common.filter')" @click="parameterSidebarVisible = !parameterSidebarVisible">
                    <q-tooltip>{{ $t('common.filter') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="close" :aria-label="$t('workspace.close')" data-ws-preview-close @click="closeDialog">
                    <q-tooltip>{{ $t('workspace.close') }}</q-tooltip>
                </q-btn>
            </div>
            <q-linear-progress v-if="loading" indeterminate color="primary" data-test="progress-bar" />

            <div class="col column no-wrap relative-position workspace-scrollable-table">
                <q-banner v-if="errorMessageVisible" dense class="q-ma-sm bg-warning">
                    {{ errorMessage }}
                </q-banner>

                <DatasetPreviewTable v-else class="col column no-wrap q-ma-sm" :preview-columns="columns" :preview-rows="rows" :pagination="pagination" :preview-type="previewType" @pageChanged="updatePagination($event)" @sort="onSort" @filter="onFilter"></DatasetPreviewTable>
                <KnParameterSidebar v-if="parameterSidebarVisible && dataset" class="kn-overflow-y" :filters-data="filtersData" :prop-document="dataset" :prop-mode="sidebarMode" :prop-q-b-e-parameters="dataset.pars" :user-role="userRole" :dataset="dataset" :load-from-dataset-management="loadFromDatasetManagement" :correct-roles-for-execution="correctRolesForExecution" @execute="onExecute" @roleChanged="onRoleChange"></KnParameterSidebar>
            </div>
        </q-card>
    </q-dialog>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import { mapActions } from 'pinia'
import DatasetPreviewTable from '../tables/DatasetPreviewTable.vue'
import workspaceDataPreviewDialogDescriptor from './WorkspaceDataPreviewDialogDescriptor.json'
import KnParameterSidebar from '@/components/UI/KnParameterSidebar/KnParameterSidebar.vue'
import moment from 'moment'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'kpi-scheduler-save-dialog',
    components: { DatasetPreviewTable, KnParameterSidebar },
    props: { visible: { type: Boolean }, propDataset: { type: Object }, previewType: String, loadFromDatasetManagement: Boolean, correctRolesForExecution: { type: Array as PropType<string[] | null> } },
    emits: ['close'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            workspaceDataPreviewDialogDescriptor,
            dataset: null as any,
            columns: [] as any[],
            rows: [] as any[],
            pagination: { start: 0, limit: 15 } as any,
            sort: null as any,
            filter: null as any,
            errorMessageVisible: false,
            errorMessage: '',
            parameterSidebarVisible: false,
            loading: false,
            filtersData: {} as any,
            userRole: null,
            sidebarMode: 'workspaceView'
        }
    },
    computed: {
        isParameterSidebarVisible(): boolean {
            let parameterVisible = false
            for (let i = 0; i < this.filtersData?.filterStatus?.length; i++) {
                const tempFilter = this.filtersData.filterStatus[i]
                if (tempFilter.showOnPanel === 'true') {
                    parameterVisible = true
                    break
                }
            }
            let pars = false
            if (this.dataset && this.dataset.pars) {
                if (this.dataset.pars.length !== 0) {
                    pars = this.dataset.pars.length !== 0
                }
            }
            return parameterVisible || pars
        }
    },
    watch: {
        async propDataset() {
            if (this.visible) {
                await this.loadPreview()
            }
        },
        async visible(value) {
            if (value) {
                await this.loadPreview()
            }
        },
        previewType() {
            this.setSidebarMode()
        }
    },
    async mounted() {
        this.userRole = (this.store.$state as any).user.sessionRole !== this.$t('role.defaultRolePlaceholder') ? (this.store.$state as any).user.sessionRole : null
        await this.loadPreview()
        this.setSidebarMode()
    },
    methods: {
        ...mapActions(mainStore, ['setError']),
        async loadPreview() {
            this.loadDataset()

            if (!this.userRole && this.correctRolesForExecution?.length == 1) {
                this.userRole = this.correctRolesForExecution[0]
            }

            if (this.userRole) {
                if (!this.correctRolesForExecution?.includes(this.userRole)) {
                    this.setError({
                        title: this.$t('common.error.generic'),
                        msg: this.$t('documentExecution.main.userRoleError')
                    })
                    return
                }
                // Skip loading dataset drivers if we're in dataset management mode
                // because the dataset might not be saved yet with the new label
                if (!this.loadFromDatasetManagement) {
                    await this.loadDatasetDrivers()
                }
            } else {
                this.parameterSidebarVisible = true
                return
            }

            if (this.dataset.label && this.dataset.pars.length === 0 && (this.filtersData.isReadyForExecution === undefined || this.filtersData.isReadyForExecution)) {
                this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
                this.parameterSidebarVisible = false
            } else {
                this.parameterSidebarVisible = true
            }
        },

        loadDataset() {
            this.dataset = this.propDataset as any
        },
        async loadPreSavePreview() {
            this.loading = true
            const postData = { ...this.dataset }
            postData.start = this.pagination.start
            postData.limit = this.pagination.limit
            if (this.sort) {
                postData.sorting = this.sort
            }
            if (this.filter) {
                postData.filters = this.filter
            }
            if (this.filtersData.filterStatus?.length > 0) {
                postData.DRIVERS = this.formatDriversForPreviewData()
            }
            if (Array.isArray(postData.restRequestHeaders)) {
                if (postData.restRequestHeaders.length == 0) {
                    postData.restRequestHeaders = {}
                } else {
                    postData.restRequestHeaders = postData.restRequestHeaders.reduce((acc, curr) => {
                        acc[curr['name']] = curr['value']
                        return acc
                    }, {})
                }
            }
            if (postData.dsTypeCd === 'Prepared') {
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/${this.dataset.label}/preview`, postData, { headers: { 'X-Disable-Errors': 'true' } })
                    .then((response: AxiosResponse<any>) => {
                        const fields = response.data?.metaData?.fields
                        if (this.dataset.dsTypeCd == 'REST' && fields?.length == 1 && fields[0] === 'recNo') {
                            this.rows = []
                        } else {
                            this.setPreviewColumns(response.data)
                            this.rows = response.data.rows
                            this.pagination.size = response.data.results
                        }
                    })
                    .catch((error) => {
                        this.errorMessage = error.message
                        this.errorMessageVisible = true
                    })
            } else {
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/preview`, postData, { headers: { 'X-Disable-Errors': 'true' } })
                    .then((response: AxiosResponse<any>) => {
                        this.setPreviewColumns(response.data)
                        this.rows = response.data.rows
                        this.pagination.size = response.data.results
                    })
                    .catch((error) => {
                        this.errorMessage = error.message
                        this.errorMessageVisible = true
                    })
            }
            this.loading = false
        },
        async loadPreviewData() {
            this.loading = true
            const postData = { ...this.pagination }
            if (this.sort) {
                postData.sorting = this.sort
            }
            if (this.filter) {
                postData.filters = this.filter
            }
            if (this.dataset.pars.length > 0) {
                postData.pars = [...this.dataset.pars]
            }
            if (this.filtersData.filterStatus?.length > 0) {
                postData.drivers = this.formatDriversForPreviewData()
            }
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/${this.dataset.label}/preview`, postData, { headers: { 'X-Disable-Errors': 'true' } })
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
        async loadDatasetDrivers() {
            let hasError = false
            if (this.dataset.label && this.dataset.id && this.dataset.dsTypeCd !== 'Prepared') {
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/${this.dataset.label}/filters`, { role: this.userRole })
                    .then((response: AxiosResponse<any>) => {
                        this.filtersData = response.data
                        if (this.filtersData.filterStatus) {
                            this.filtersData.filterStatus = this.filtersData.filterStatus.filter((filter: any) => filter.id)
                        }
                    })
                    .catch(() => {
                        hasError = true
                    })
                this.formatDrivers()
            }
            return hasError
        },
        formatDrivers() {
            this.filtersData?.filterStatus?.forEach((el: any) => {
                el.parameterValue = el.multivalue ? [] : [{ value: '', description: '' }]
                if (el.driverDefaultValue?.length > 0) {
                    let valueIndex = '_col0'
                    let descriptionIndex = 'col1'
                    if (el.metadata?.colsMap) {
                        valueIndex = Object.keys(el.metadata?.colsMap).find((key: string) => el.metadata.colsMap[key] === el.metadata.valueColumn) as any
                        descriptionIndex = Object.keys(el.metadata?.colsMap).find((key: string) => el.metadata.colsMap[key] === el.metadata.descriptionColumn) as any
                    }
                    el.parameterValue = el.driverDefaultValue.map((defaultValue: any) => {
                        return { value: defaultValue.value ?? defaultValue[valueIndex], description: defaultValue.desc ?? defaultValue[descriptionIndex] }
                    })
                    if (el.type === 'DATE' && !el.selectionType && el.valueSelection === 'man_in' && el.showOnPanel === 'true') {
                        el.parameterValue[0].value = moment(el.parameterValue[0].description?.split('#')[0]).toDate() as any
                    }
                }
                if (el.data) {
                    el.data = el.data.map((data: any) => {
                        return this.formatParameterDataOptions(el, data)
                    })
                    if (el.data.length === 1) {
                        el.parameterValue = [...el.data]
                    }
                }
                if ((el.selectionType === 'COMBOBOX' || el.selectionType === 'LIST') && el.multivalue && el.mandatory && el.data.length === 1) {
                    el.showOnPanel = 'false'
                }
                if (!el.parameterValue) {
                    el.parameterValue = [{ value: '', description: '' }]
                }
                if (el.parameterValue[0] && !el.parameterValue[0].description) {
                    el.parameterValue[0].description = el.parameterDescription ? el.parameterDescription[0] : ''
                }
            })
        },
        formatParameterDataOptions(parameter: any, data: any) {
            const valueColumn = parameter.metadata.valueColumn
            const descriptionColumn = parameter.metadata.descriptionColumn
            const valueIndex = Object.keys(parameter.metadata.colsMap).find((key: string) => parameter.metadata.colsMap[key] === valueColumn)
            const descriptionIndex = Object.keys(parameter.metadata.colsMap).find((key: string) => parameter.metadata.colsMap[key] === descriptionColumn)
            return { value: valueIndex ? data[valueIndex] : '', description: descriptionIndex ? data[descriptionIndex] : '' }
        },
        formatDriversForPreviewData() {
            const formattedDrivers = {}
            this.filtersData?.filterStatus.forEach((filter: any) => {
                formattedDrivers[filter.urlName] = filter.parameterValue
            })
            return formattedDrivers
        },
        async updatePagination(lazyParams: any) {
            this.pagination.start = lazyParams.paginationStart
            this.pagination.limit = lazyParams.paginationLimit
            this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
            this.parameterSidebarVisible = false
        },
        async onSort(event: any) {
            this.sort = event
            this.pagination.start = 0
            this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
        },
        async onFilter(event: any) {
            this.filter = event
            this.pagination.start = 0
            this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
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
            this.parameterSidebarVisible = false
            this.$emit('close')
        },
        async onExecute(datasetParameters: any[]) {
            if (!this.dataset.pars) this.dataset.pars = []
            this.dataset.pars = datasetParameters

            this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
            this.parameterSidebarVisible = false
        },
        setSidebarMode() {
            this.sidebarMode = this.loadFromDatasetManagement ? 'datasetManagement' : 'workspaceView'
        },
        async onRoleChange(role: string) {
            this.userRole = role as any
            this.filtersData = {}
            let hasError = false
            if (this.dataset.drivers && this.dataset.drivers.length > 0) hasError = await this.loadDatasetDrivers()
            if (!hasError && this.dataset.label && this.dataset.pars.length === 0 && (this.filtersData.isReadyForExecution === undefined || this.filtersData.isReadyForExecution)) {
                this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
                this.parameterSidebarVisible = false
            } else {
                this.parameterSidebarVisible = true
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-ws-preview-card {
    width: 80vw;
    max-width: 80vw;
    min-width: min(600px, 100vw);
    height: 90vh;
    max-height: 90vh;
    min-height: 435px;
}
.kn-ws-preview-card__header {
    padding: 8px 8px 8px var(--kn-ws-gutter);
    border-bottom: 1px solid var(--kn-ws-line);
}
.workspace-scrollable-table {
    min-height: 0;
    overflow: auto;
}
</style>
