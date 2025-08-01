<template>
    <Dialog :style="workspaceDataPreviewDialogDescriptor.dialog.style" :content-style="workspaceDataPreviewDialogDescriptor.dialog.contentStyle" :visible="visible" :modal="true" class="p-fluid kn-dialog--toolbar--primary" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-col-12" :style="mainDescriptor.style.maxWidth">
                <template #start>
                    <span>{{ dataset?.label }}</span>
                </template>
                <template #end>
                    <Button v-if="isParameterSidebarVisible" v-tooltip.bottom="$t('common.filter')" icon="pi pi-filter" class="p-button-text p-button-rounded p-button-plain" @click="parameterSidebarVisible = !parameterSidebarVisible" />
                    <Button class="kn-button p-button-text p-button-plain" :label="$t('common.close')" @click="closeDialog"></Button>
                </template>
            </Toolbar>
        </template>

        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar p-ml-2" data-test="progress-bar" />

        <div class="p-d-flex p-flex-column kn-flex workspace-scrollable-table">
            <Message v-if="errorMessageVisible" class="p-m-2" severity="warn" :closable="false" :style="mainDescriptor.style.message">
                {{ errorMessage }}
            </Message>

            <DatasetPreviewTable v-else class="p-d-flex p-flex-column kn-flex p-m-2" :preview-columns="columns" :preview-rows="rows" :pagination="pagination" :preview-type="previewType" @pageChanged="updatePagination($event)" @sort="onSort" @filter="onFilter"></DatasetPreviewTable>
            <KnParameterSidebar
                v-if="parameterSidebarVisible && dataset"
                style="height: calc(100% - 35px)"
                class="workspace-parameter-sidebar kn-overflow-y"
                :filters-data="filtersData"
                :prop-document="dataset"
                :prop-mode="sidebarMode"
                :prop-q-b-e-parameters="dataset.pars"
                :user-role="userRole"
                :dataset="dataset"
                :load-from-dataset-management="loadFromDatasetManagement"
                :correct-roles-for-execution="correctRolesForExecution"
                @execute="onExecute"
                @roleChanged="onRoleChange"
            ></KnParameterSidebar>
        </div>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { mapActions } from 'pinia'
import Dialog from 'primevue/dialog'
import DatasetPreviewTable from '../tables/DatasetPreviewTable.vue'
import Message from 'primevue/message'
import mainDescriptor from '@/modules/workspace/WorkspaceDescriptor.json'
import workspaceDataPreviewDialogDescriptor from './WorkspaceDataPreviewDialogDescriptor.json'
import KnParameterSidebar from '@/components/UI/KnParameterSidebar/KnParameterSidebar.vue'
import moment from 'moment'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'kpi-scheduler-save-dialog',
    components: { Dialog, DatasetPreviewTable, Message, KnParameterSidebar },
    props: { visible: { type: Boolean }, propDataset: { type: Object }, previewType: String, loadFromDatasetManagement: Boolean, correctRolesForExecution: { type: Array as PropType<string[] | null> } },
    emits: ['close'],
    setup() {
        const store = mainStore()
        return { store }
    },
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
                await this.loadDatasetDrivers()
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
            this.loadFromDatasetManagement ? await this.loadPreSavePreview() : await this.loadPreviewData()
        },
        async onFilter(event: any) {
            this.filter = event
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

<style lang="scss">
.workspace-full-screen-dialog.p-dialog {
    max-height: 100%;
}
.workspace-full-screen-dialog .p-dialog .p-dialog-content {
    padding: 0;
}
.workspace-scrollable-table {
    height: 100%;
    .p-datatable-wrapper {
        position: relative;
        flex: 1;
        max-width: 96vw;
        overflow-x: auto;
    }
    .p-datatable {
        max-width: 96vw;
    }
}

.workspace-parameter-sidebar {
    top: 35px !important;
}
.workspace-parameter-sidebar .kn-parameter-sidebar-buttons {
    margin-bottom: 45px !important;
}
</style>
