<template>
    <div class="p-d-flex p-flex-column kn-width-full kn-height-full">
        <q-toolbar v-if="isPivot" class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('documentExecution.registry.title') }}</q-toolbar-title>

            <q-btn flat round dense icon="save" data-test="submit-button" @click="saveRegistry">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
            </q-btn>
        </q-toolbar>
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
                        @clonedRowRemoved="onClonedRowRemoved"
                    ></RegistryDatatable>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import type { AxiosResponse } from 'axios'
import axios from '@/axios.js'
import registryDescriptor from './RegistryDescriptor.json'
import { formatDate } from '@/helpers/commons/localeHelper'
import mainStore from '../../../App.store'
import { emitter } from './tables/RegistryDatatableHelper'
import { useI18n } from 'vue-i18n'

const RegistryDatatable = defineAsyncComponent(() => import('./tables/RegistryDatatable.vue'))
const RegistryPivotDatatable = defineAsyncComponent(() => import('./tables/RegistryPivotDatatable.vue'))
const RegistryFiltersCard = defineAsyncComponent(() => import('./RegistryFiltersCard.vue'))

const props = defineProps<{
    id?: string
    reloadTrigger?: boolean
}>()

const appStore = mainStore()
const { t } = useI18n()
const registryDatatableRef = ref<any>(null)

const registry = ref<any>({})
const configuration = ref<any[]>([])
const columns = ref<any[]>([])
const rows = ref<any[]>([])
const columnMap = ref<any>({})
const pagination = ref<any>({ start: 0, limit: 15 })
const updatedRows = ref<any[]>([])
const filters = ref<any[]>([])
const selectedFilters = ref<any[]>([])
const entity = ref<string | null>(null)
const stopWarningsState = ref<any[]>([])
const isPivot = ref(false)
const loading = ref(false)
const dataLoading = ref(false)
const sortModel = ref<any>(null)
const keyColumnName = ref<string>('')

async function loadPage() {
    loading.value = true
    emitter.emit('clearSelectedRows')
    await loadRegistry()
    loadRegistryData()
    loading.value = false
}

async function loadRegistry() {
    const postData = new URLSearchParams()

    if (pagination.value.size > registryDescriptor.paginationLimit) {
        postData.append('limit', '' + registryDescriptor.paginationNumberOfItems)
    }

    selectedFilters.value.forEach((el: any) => {
        if (el.filterValue) postData.append(el.field, el.filterValue)
    })

    postData.append('start', '' + pagination.value.start)

    if (sortModel.value && sortModel.value.fieldName && sortModel.value.orderType) {
        postData.append('fieldName', '' + sortModel.value.fieldName)
        postData.append('orderType', '' + sortModel.value.orderType)
    }

    await axios
        .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=LOAD_REGISTRY_ACTION&SBI_EXECUTION_ID=${props.id}`, postData)
        .then((response: AxiosResponse<any>) => {
            pagination.value.size = response.data.results
            registry.value = response.data
            loadKeyColumnName(response.data.metaData.fields)
        })
        .catch(() => {})
}

function loadKeyColumnName(fieldsMetadata: any[]) {
    const keyColumn = fieldsMetadata.find((field: any) => field.keyColumn === true)
    keyColumnName.value = keyColumn.header
}

function loadRegistryData() {
    if (registry.value) {
        loadConfiguration()
        loadEntity()
        loadColumns()
        loadColumnMap()
        loadColumnsInfo()
        loadRows(true)
        getFilters()
        createColumnWidthProperty()
        emitter.emit('refreshTableWithData')
    }
}

function createColumnWidthProperty() {
    for (let i = 1; i < registry.value.metaData.fields.length; i++) {
        columns.value[i - 1].width = columns.value[i - 1].size
    }
}

function loadColumns() {
    columns.value = []
    registry.value.registryConfig.columns.map((el: any) => {
        if (el.type === 'merge') isPivot.value = true
        columns.value.push(el)
    })
}

function loadColumnMap() {
    columnMap.value = { id: 'id' }
    for (let i = 1; i < registry.value.metaData.fields.length; i++) {
        columnMap.value[registry.value.metaData.fields[i].name] = registry.value.metaData.fields[i].header
    }
}

function loadColumnsInfo() {
    for (let i = 1; i < registry.value.metaData.fields.length; i++) {
        columns.value[i - 1].columnInfo = registry.value.metaData.fields[i]
    }
}

function loadRows(resetRows = false as boolean) {
    if (resetRows) rows.value = []
    const limit = pagination.value.size <= registryDescriptor.paginationLimit ? registry.value.rows.length : registryDescriptor.paginationNumberOfItems
    for (let i = 0; i < limit; i++) {
        const tempRow: any = {}
        if (!registry.value.rows[i]) break
        Object.keys(registry.value.rows[i]).forEach((key: string) => {
            tempRow[columnMap.value[key]] = registry.value.rows[i][key]
        })
        tempRow.uniqueId = crypto.randomUUID()
        rows.value.push(tempRow)
    }
    setTimeout(() => {
        emitter.emit('refreshTableWithData')
    }, 250)
}

function loadConfiguration() {
    configuration.value = registry.value.registryConfig.configurations
}

function loadEntity() {
    entity.value = registry.value.registryConfig.entity
}

function onRowChanged(row: any) {
    const tempRow = { ...row }
    const index = isPivot.value ? updatedRows.value.findIndex((el: any) => el.id === tempRow.id) : updatedRows.value.findIndex((el: any) => el.uniqueId === tempRow.uniqueId)
    index === -1 ? updatedRows.value.push(tempRow) : (updatedRows.value[index] = tempRow)
}

async function saveRegistry() {
    if (registryDatatableRef.value) registryDatatableRef.value.stopGridEditing()

    await new Promise((resolve) => setTimeout(resolve, 250))

    updatedRows.value.forEach((el: any) => {
        if (isPivot.value) formatPivotRows(el)
        ;['id', 'isNew', 'edited', 'uniqueId', 'isEdited'].forEach((property: string) => delete el[property])
    })
    const updatedRowsToIsoStrings = JSON.parse(JSON.stringify(updatedRows.value))
    updatedRowsToIsoStrings.forEach((el: any) => {
        registry.value.metaData.fields.forEach((element: any) => {
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
    await axios
        .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=UPDATE_RECORDS_ACTION&SBI_EXECUTION_ID=${props.id}`, postData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        .then(() => {
            appStore.setInfo({ title: t('common.toast.updateTitle'), msg: t('common.toast.updateSuccess') })
            pagination.value.start = 0
            loadPage()
        })
        .finally(() => (updatedRows.value = []))
}

async function onRowDeleted(row: any) {
    const postData = new URLSearchParams()
    if (isPivot.value) {
        formatPivotRows(row)
        postData.append('records', '' + JSON.stringify([row]))
    } else postData.append('records', '' + JSON.stringify(row))

    await axios
        .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=DELETE_RECORDS_ACTION&SBI_EXECUTION_ID=${props.id}`, postData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        .then(async (response: AxiosResponse<any>) => {
            appStore.setInfo({ title: t('common.toast.deleteTitle'), msg: t('common.toast.deleteSuccess') })
            if (isPivot.value) {
                if (response.data.ids[0]) {
                    const index = rows.value.findIndex((el: any) => el.id === row.id)
                    rows.value.splice(index, 1)
                    pagination.value.size--
                }
            } else {
                pagination.value.start = 0
                await reloadRegistryData(true)
            }
        })
        .catch((response: AxiosResponse<any>) => {
            appStore.setError({ title: t('common.error.generic'), msg: response })
        })
}

function getFilters() {
    filters.value = []
    const tempFilters = registry.value.registryConfig.filters
    for (let i = 0; i < tempFilters.length; i++) {
        const filter = tempFilters[i]
        for (let j = 0; j < columns.value.length; j++) {
            const column = columns.value[j]
            if (filter.presentation !== 'DRIVER' && filter.field === column.field) {
                filters.value.push({ title: filter.title, field: filter.field, presentation: filter.presentationType, static: filter.isStatic, visible: filter.isVisible, column: column })
                break
            }
        }
    }
}

async function filterRegistry(filterList: any[]) {
    selectedFilters.value = [...filterList]
    pagination.value.start = 0
    pagination.value.size = 0
    await reloadRegistryData(true)
}

async function updatePagination(lazyParams: any) {
    pagination.value = { start: lazyParams.paginationStart, limit: lazyParams.paginationLimit, size: lazyParams.size }
    if (pagination.value.size > registryDescriptor.paginationLimit) {
        updatedRows.value = []
        await reloadRegistryData()
    }
}

function formatPivotRows(row: any) {
    Object.keys(row).forEach((key: any) => {
        if (key !== 'id') row[key] = row[key].data
    })
}

function setWarningState(warnings: any[]) {
    stopWarningsState.value = warnings
}

async function reloadRegistryData(resetRows = false as boolean) {
    dataLoading.value = true
    await loadRegistry()
    loadRows(resetRows)
    dataLoading.value = false
}

async function onSortingChanged(sm: any) {
    pagination.value.start = 0
    pagination.value.size = 0
    sortModel.value = sm
    await reloadRegistryData(true)
}

function onClonedRowRemoved(row: any) {
    const index = updatedRows.value.findIndex((el: any) => el.uniqueId === row.uniqueId)
    if (index !== -1) updatedRows.value.splice(index, 1)
}

watch(
    () => props.id,
    async () => {
        await loadPage()
        stopWarningsState.value = []
    }
)
watch(
    () => props.reloadTrigger,
    async () => {
        pagination.value.start = 0
        await loadPage()
        stopWarningsState.value = []
    }
)

onMounted(async () => {
    await loadPage()
})
</script>
<style lang="scss">
.registry-custom-card {
    background: #ffffff;
    color: rgba(0, 0, 0, 0.87);
    box-shadow:
        0 2px 1px -1px rgb(0 0 0 / 20%),
        0 1px 1px 0 rgb(0 0 0 / 14%),
        0 1px 3px 0 rgb(0 0 0 / 12%);
}
</style>
