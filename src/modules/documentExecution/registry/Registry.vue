<template>
    <div class="p-d-flex p-flex-column kn-width-full kn-height-full">
        <Toolbar v-if="isPivot" class="kn-toolbar kn-toolbar--secondary kn-width-full">
            <template #start>
                {{ $t('documentExecution.registry.title') }}
            </template>
            <template #end>
                <div class="p-d-flex p-flex-row">
                    <Button class="kn-button p-button-text" data-test="submit-button" @click="saveRegistry">{{ $t('common.save') }}</Button>
                </div>
            </template>
        </Toolbar>
        <div class="p-d-flex p-flex-column kn-overflow kn-flex">
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
            <div class="">
                <RegistryFiltersCard v-if="filters.length > 0" :id="id" :prop-filters="filters" :entity="entity" class="" @filter="filterRegistry"></RegistryFiltersCard>
            </div>
            <div class="kn-relative kn-flex p-m-2 registry-custom-card">
                <div class="kn-height-full kn-width-full kn-absolute">
                    <RegistryPivotDatatable v-if="isPivot" :id="id" :columns="columns" :rows="rows" :entity="entity" :prop-configuration="configuration" :prop-pagination="pagination" @rowChanged="onRowChanged" @rowDeleted="onRowDeleted" @pageChanged="updatePagination" @resetRows="updatedRows = []" @warningChanged="setWarningState"></RegistryPivotDatatable>
                    <RegistryDatatable
                        v-else
                        ref="registryDatatableRef"
                        :id="id"
                        :prop-columns="columns"
                        :prop-rows="rows"
                        :prop-configuration="configuration"
                        :column-map="columnMap"
                        :pagination="pagination"
                        :entity="entity"
                        :key-column-name="keyColumnName"
                        :stop-warnings-state="stopWarningsState"
                        :data-loading="dataLoading"
                        @saveRegistry="saveRegistry"
                        @rowChanged="onRowChanged"
                        @rowDeleted="onRowDeleted"
                        @pageChanged="updatePagination"
                        @warningChanged="setWarningState"
                        @sortingChanged="onSortingChanged"
                    ></RegistryDatatable>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import registryDescriptor from './RegistryDescriptor.json'
import RegistryDatatable from './tables/RegistryDatatable.vue'
import RegistryPivotDatatable from './tables/RegistryPivotDatatable.vue'
import RegistryFiltersCard from './RegistryFiltersCard.vue'
import { formatDate } from '@/helpers/commons/localeHelper'
import { mapActions } from 'pinia'
import store from '../../../App.store'
import { emitter } from './tables/RegistryDatatableHelper'

export default defineComponent({
    name: 'registry',
    components: {
        RegistryDatatable,
        RegistryPivotDatatable,
        RegistryFiltersCard
    },
    props: { id: { type: String }, reloadTrigger: { type: Boolean } },
    data() {
        return {
            registryDescriptor,
            registry: {} as any,
            configuration: [] as any[],
            columns: [] as any[],
            rows: [] as any[],
            columnMap: {} as any,
            pagination: { start: 0, limit: 15 } as any,
            updatedRows: [] as any,
            filters: [] as any[],
            selectedFilters: [] as any[],
            entity: null as string | null,
            stopWarningsState: [] as any[],
            isPivot: false,
            loading: false,
            dataLoading: false,
            sortModel: null as any,
            keyColumnName: '' as string
        }
    },
    watch: {
        async id() {
            await this.loadPage()
            this.stopWarningsState = []
        },
        async reloadTrigger() {
            this.pagination.start = 0
            await this.loadPage()
            this.stopWarningsState = []
        }
    },
    async created() {
        await this.loadPage()
    },
    methods: {
        ...mapActions(store, ['setInfo', 'setError']),
        async loadPage() {
            this.loading = true
            emitter.emit('clearSelectedRows')
            await this.loadRegistry()
            this.loadRegistryData()
            this.loading = false
        },
        async loadRegistry() {
            const postData = new URLSearchParams()

            if (this.pagination.size > registryDescriptor.paginationLimit) {
                postData.append('limit', '' + registryDescriptor.paginationNumberOfItems)
            }

            this.selectedFilters.forEach((el: any) => {
                if (el.filterValue) {
                    postData.append(el.field, el.filterValue)
                }
            })

            postData.append('start', '' + this.pagination.start)

            if (this.sortModel && this.sortModel.fieldName && this.sortModel.orderType) {
                postData.append('fieldName', '' + this.sortModel.fieldName)
                postData.append('orderType', '' + this.sortModel.orderType)
            }

            await this.$http
                .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=LOAD_REGISTRY_ACTION&SBI_EXECUTION_ID=${this.id}`, postData)
                .then((response: AxiosResponse<any>) => {
                    this.pagination.size = response.data.results
                    this.registry = response.data
                    this.loadKeyColumnName(response.data.metaData.fields)
                })
                .catch(() => {})
        },
        loadKeyColumnName(fieldsMetadata) {
            const keyColumn = fieldsMetadata.find((field) => field.keyColumn === true)
            this.keyColumnName = keyColumn.header
        },
        loadRegistryData() {
            if (this.registry) {
                this.loadConfiguration()
                this.loadEntity()
                this.loadColumns()
                this.loadColumnMap()
                this.loadColumnsInfo()
                this.loadRows(true)
                this.getFilters()
                this.createColumnWidthProperty()
                emitter.emit('refreshTableWithData')
            }
        },
        createColumnWidthProperty() {
            for (let i = 1; i < this.registry.metaData.fields.length; i++) {
                this.columns[i - 1].width = this.columns[i - 1].size
            }
        },
        loadColumns() {
            this.columns = []
            this.registry.registryConfig.columns.map((el: any) => {
                if (el.type === 'merge') {
                    this.isPivot = true
                }
                this.columns.push(el)
            })
        },
        loadColumnMap() {
            this.columnMap = { id: 'id' }
            for (let i = 1; i < this.registry.metaData.fields.length; i++) {
                this.columnMap[this.registry.metaData.fields[i].name] = this.registry.metaData.fields[i].header
            }
        },
        loadColumnsInfo() {
            for (let i = 1; i < this.registry.metaData.fields.length; i++) {
                this.columns[i - 1].columnInfo = this.registry.metaData.fields[i]
            }
        },
        loadRows(resetRows = false as boolean) {
            if (resetRows) this.rows = []
            const limit = this.pagination.size <= registryDescriptor.paginationLimit ? this.registry.rows.length : registryDescriptor.paginationNumberOfItems
            for (let i = 0; i < limit; i++) {
                const tempRow = {} as any
                if (!this.registry.rows[i]) break
                Object.keys(this.registry.rows[i]).forEach((key: string) => {
                    tempRow[this.columnMap[key]] = this.registry.rows[i][key]
                })
                tempRow.uniqueId = crypto.randomUUID()
                this.rows.push(tempRow)
            }

            //have to timeout, mitt fires event too fast, and vue props doenst have time to update
            setTimeout(() => {
                emitter.emit('refreshTableWithData')
            }, 250)
        },
        loadConfiguration() {
            this.configuration = this.registry.registryConfig.configurations
        },
        loadEntity() {
            this.entity = this.registry.registryConfig.entity
        },
        onRowChanged(row: any) {
            const tempRow = { ...row }
            const index = this.updatedRows.findIndex((el: any) => el.uniqueId === tempRow.uniqueId)
            index === -1 ? this.updatedRows.push(tempRow) : (this.updatedRows[index] = tempRow)
        },
        async saveRegistry() {
            const datatableRef = this.$refs.registryDatatableRef as InstanceType<typeof RegistryDatatable>
            if (datatableRef) datatableRef.stopGridEditing()

            await new Promise((resolve) => setTimeout(resolve, 250))

            this.updatedRows.forEach((el: any) => {
                if (this.isPivot) {
                    this.formatPivotRows(el)
                }
                ;['id', 'isNew', 'edited', 'uniqueId', 'isEdited'].forEach((property: string) => delete el[property])
            })
            const updatedRowsToIsoStrings = JSON.parse(JSON.stringify(this.updatedRows))
            updatedRowsToIsoStrings.forEach((el: any) => {
                this.registry.metaData.fields.forEach((element) => {
                    if (el[element.header]) {
                        if (element.type === 'date') {
                            const date = new Date(formatDate(el[element.header], 'toISOString'))
                            const offset = new Date().getTimezoneOffset()
                            el[element.header] = new Date(date.getTime() - offset * 60000)
                        } else if (element.type === 'timestamp') {
                            el[element.header] = formatDate(el[element.header], 'toISOString')
                        }
                    }
                })
            })
            const postData = new URLSearchParams()
            postData.append('records', '' + JSON.stringify(updatedRowsToIsoStrings))
            await this.$http
                .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=UPDATE_RECORDS_ACTION&SBI_EXECUTION_ID=${this.id}`, postData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                .then(() => {
                    this.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('common.toast.updateSuccess')
                    })
                    this.pagination.start = 0
                    this.loadPage()
                })
                .finally(() => (this.updatedRows = []))
        },
        async onRowDeleted(row: any) {
            const postData = new URLSearchParams()
            if (this.isPivot) {
                this.formatPivotRows(row)
                postData.append('records', '' + JSON.stringify([row]))
            } else postData.append('records', '' + JSON.stringify(row))

            await this.$http
                .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=DELETE_RECORDS_ACTION&SBI_EXECUTION_ID=${this.id}`, postData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                .then(async (response: AxiosResponse<any>) => {
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })

                    if (this.isPivot) {
                        if (response.data.ids[0]) {
                            const index = this.rows.findIndex((el: any) => el.id === row.id)
                            this.rows.splice(index, 1)
                            this.pagination.size--
                        }
                    } else {
                        this.pagination.start = 0
                        await this.reloadRegistryData(true)
                    }
                })
                .catch((response: AxiosResponse<any>) => {
                    this.setError({
                        title: this.$t('common.error.generic'),
                        msg: response
                    })
                })
        },
        getFilters() {
            this.filters = []
            const tempFilters = this.registry.registryConfig.filters

            for (let i = 0; i < tempFilters.length; i++) {
                const filter = tempFilters[i]

                for (let j = 0; j < this.columns.length; j++) {
                    const column = this.columns[j]
                    if (filter.presentation !== 'DRIVER' && filter.field === column.field) {
                        this.filters.push({
                            title: filter.title,
                            field: filter.field,
                            presentation: filter.presentationType,
                            static: filter.isStatic,
                            visible: filter.isVisible,
                            column: column
                        })
                        break
                    }
                }
            }
        },
        async filterRegistry(filters: any[]) {
            this.selectedFilters = [...filters]
            this.pagination.start = 0
            this.pagination.size = 0

            await this.reloadRegistryData(true)
        },
        async updatePagination(lazyParams: any) {
            this.pagination = {
                start: lazyParams.paginationStart,
                limit: lazyParams.paginationLimit,
                size: lazyParams.size
            }

            if (this.pagination.size > registryDescriptor.paginationLimit) {
                this.updatedRows = []
                await this.reloadRegistryData()
            }
        },
        formatPivotRows(row: any) {
            Object.keys(row).forEach((key: any) => {
                if (key !== 'id') {
                    row[key] = row[key].data
                }
            })
        },
        setWarningState(warnings: any[]) {
            this.stopWarningsState = warnings
        },
        async reloadRegistryData(resetRows = false as boolean) {
            this.dataLoading = true
            await this.loadRegistry()
            this.loadRows(resetRows)
            this.dataLoading = false
        },
        async onSortingChanged(sortModel) {
            this.pagination.start = 0
            this.pagination.size = 0
            this.sortModel = sortModel
            await this.reloadRegistryData(true)
        }
    }
})
</script>
<style lang="scss">
.registry-custom-card {
    background: #ffffff;
    color: rgba(0, 0, 0, 0.87);
    box-shadow: 0 2px 1px -1px rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 1px 3px 0 rgb(0 0 0 / 12%);
}
</style>
