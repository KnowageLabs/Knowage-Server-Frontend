<template>
    <div class="kn-height-full column">
        <!-- ── Toolbar ─────────────────────────────────────────────────────── -->
        <q-toolbar dense class="registry-toolbar">
            <template v-if="selectedRowCount > 0">
                <q-chip dense color="primary" text-color="white" icon="checklist" class="q-ml-xs"> {{ selectedRowCount }} {{ $t('documentExecution.registry.grid.rowsSelected') }} </q-chip>
                <q-btn flat round dense icon="close" size="xs" class="q-ml-xs" @click="registryGridRef?.clearSelectedRows()">
                    <q-tooltip :delay="500">{{ $t('documentExecution.registry.grid.clearSelection') }}</q-tooltip>
                </q-btn>
            </template>
            <q-space />
            <div class="row no-wrap">
                <q-btn flat round dense :disable="!addButtonEnabled" icon="add" data-test="new-row-button" @click="addNewRow">
                    <q-tooltip :delay="500">{{ $t('documentExecution.registry.grid.addRow') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="content_copy" @click="cloneRows">
                    <q-tooltip :delay="500">{{ $t('documentExecution.registry.grid.cloneRows') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense :disable="!deleteButtonEnabled" icon="delete" @click="rowsDeleteConfirm()">
                    <q-tooltip :delay="500">{{ $t('documentExecution.registry.grid.deleteRows') }}</q-tooltip>
                </q-btn>
            </div>
            <q-separator vertical />
            <q-btn flat round dense icon="save" class="q-ml-xs" @click="$emit('saveRegistry')">
                <q-tooltip :delay="500">{{ $t('common.save') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <!-- ── Loading overlay ────────────────────────────────────────────── -->
        <q-linear-progress v-if="props.dataLoading" indeterminate color="primary" style="height: 3px" />

        <!-- ── Griglia Excel-like ──────────────────────────────────────────── -->
        <RegistryGrid ref="registryGridRef" class="kn-flex" style="min-height: 0" :columns="columns" :rows="rows" :combo-column-options="comboColumnOptions" :sort-model="sortModel" :data-loading="props.dataLoading" :pagination="lazyParams" :key-column-name="props.keyColumnName" @row-changed="onRowChanged" @row-deleted="onRowsDeletedFromGrid" @page-changed="onPageChanged" @sorting-changed="onSortingChanged" @dropdown-change="onDropdownChange" />
        <div v-if="paginatorEnabled" class="registry-pagination row items-center q-gutter-sm q-px-sm q-py-xs">
            <span class="registry-pagination__report">
                {{ paginationReport }}
            </span>
            <QPagination
                data-test="registry-paginator"
                :model-value="currentPage"
                :max="maxPages"
                size="sm"
                color="primary"
                active-color="primary"
                flat
                unelevated
                :max-pages="5"
                :boundary-links="true"
                :boundary-numbers="false"
                :direction-links="true"
                :ellipses="true"
                @update:model-value="onPageChangeByPage"
            />
        </div>
    </div>

    <RegistryDatatableWarningDialog :visible="warningVisible" :columns="dependentColumns" @close="onWarningDialogClose" />
    <RegistryDependsFromWarningDialog :visible="dependsFromWarningVisible" :column-title="dependsFromWarningColumn" :depends-from-title="dependsFromWarningSource" @close="onDependsFromWarningClose" />
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { QPagination, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { emitter } from './RegistryDatatableHelper'
import RegistryDatatableWarningDialog from './RegistryDatatableWarningDialog.vue'
import RegistryDependsFromWarningDialog from './RegistryDependsFromWarningDialog.vue'
import RegistryGrid from './grid/RegistryGrid.vue'
import { useRegistryColumnOptions } from '../composables/useRegistryColumnOptions'
import registryDescriptor from '../RegistryDescriptor.json'

const $q = useQuasar()
const { t } = useI18n()

const props = defineProps<{
    propColumns: any[]
    propRows: any[]
    columnMap?: any
    propConfiguration?: any
    pagination?: any
    entity?: string | null
    id?: string
    keyColumnName?: string
    stopWarningsState?: any[]
    dataLoading?: boolean
}>()

const emit = defineEmits<{
    (e: 'rowChanged', row: any): void
    (e: 'rowDeleted', rows: any[]): void
    (e: 'pageChanged', params: any): void
    (e: 'warningChanged', warnings: any[]): void
    (e: 'saveRegistry'): void
    (e: 'sortingChanged', sortModel: any): void
    (e: 'clonedRowRemoved', row: any): void
}>()

// ── State ────────────────────────────────────────────────────────────────
const registryGridRef = ref<InstanceType<typeof RegistryGrid> | null>(null)
const columns = ref<any[]>([])
const rows = ref<any[]>([])
const configuration = ref<any[]>([])
const buttons = ref<any>({})
const lazyParams = ref<any>({})
const dependentColumns = ref<any[]>([])
const selectedRow = ref<any>(null)
const warningVisible = ref(false)
const stopWarnings = ref<any[]>([])
const dependsFromWarningVisible = ref(false)
const dependsFromWarningColumn = ref('')
const dependsFromWarningSource = ref('')
const dependsFromCurrentField = ref('')
const dependsFromSuppressed = ref<Record<string, boolean>>({})
const loading = ref(false)
const sortModel = ref<any>({ fieldName: '', orderType: 'NONE' })

// ── Dropdown options (shared composable) ────────────────────────────────
const { comboColumnOptions, addColumnOptions } = useRegistryColumnOptions(
    () => props.entity,
    () => props.id,
    (row, field) => row[field]
)

// ── Computed ─────────────────────────────────────────────────────────────
const deleteButtonEnabled = computed<boolean>(() => {
    if (Object.prototype.hasOwnProperty.call(buttons.value, 'enableDeleteRecords')) return buttons.value.enableDeleteRecords
    return buttons.value.enableButtons ?? false
})

const addButtonEnabled = computed<boolean>(() => {
    if (Object.prototype.hasOwnProperty.call(buttons.value, 'enableAddRecords')) return buttons.value.enableAddRecords
    return buttons.value.enableButtons ?? false
})

const selectedRowCount = computed(() => registryGridRef.value?.getSelectedRows().length ?? 0)
const paginatorEnabled = computed<boolean>(() => Boolean(lazyParams.value?.enabled))
const rowsPerPage = computed<number>(() => lazyParams.value?.limit ?? registryDescriptor.paginationNumberOfItems)
const currentPage = computed<number>(() => {
    const pageSize = rowsPerPage.value
    if (!pageSize) return 1
    return Math.floor((lazyParams.value?.start ?? 0) / pageSize) + 1
})
const maxPages = computed<number>(() => {
    const totalRows = lazyParams.value?.size ?? 0
    const pageSize = rowsPerPage.value
    if (!pageSize) return 1
    return Math.max(1, Math.ceil(totalRows / pageSize))
})
const paginationReport = computed<string>(() => {
    const totalRows = lazyParams.value?.size ?? 0
    const start = lazyParams.value?.start ?? 0
    const pageSize = rowsPerPage.value
    const firstRow = totalRows > 0 ? start + 1 : 0
    const lastRow = totalRows > 0 ? Math.min(start + pageSize, totalRows) : 0
    return t('common.table.footer.paginated', { first: firstRow, last: lastRow, totalRecords: totalRows })
})

// ── Load column definitions ──────────────────────────────────────────────
async function loadColumnDefinitions() {
    if (props.propColumns.length === 0 || columns.value.length > 0) return
    loading.value = true
    const newColumns: any[] = []
    for (const el of props.propColumns) {
        if (el.isVisible) newColumns.push(el)
    }
    columns.value = newColumns
    // Pre-load options for COMBO columns
    for (const col of columns.value) {
        if (col.editorType === 'COMBO') {
            await addColumnOptions({ column: col, row: {} })
        }
    }
    loading.value = false
}

// ── Load rows ────────────────────────────────────────────────────────────
function loadRows() {
    rows.value = props.propRows as any[]
}

// ── Load button configuration ────────────────────────────────────────────
function loadConfiguration() {
    const rawConfig = props.propConfiguration
    configuration.value = Array.isArray(rawConfig) ? rawConfig : (rawConfig?.configurations ?? [])
    for (const item of configuration.value) {
        if (item.name === 'enableButtons') buttons.value.enableButtons = item.value === 'true'
        else if (item.name === 'enableDeleteRecords') buttons.value.enableDeleteRecords = item.value === 'true'
        else if (item.name === 'enableAddRecords') buttons.value.enableAddRecords = item.value === 'true'
    }
}

function loadPagination() {
    lazyParams.value = { ...props.pagination }
}

function loadWarningState() {
    stopWarnings.value = (props.stopWarningsState as any[]) ?? []
}

// ── Add / clone row ──────────────────────────────────────────────────────
function addNewRow() {
    const newRow: any = { uniqueId: crypto.randomUUID(), id: rows.value.length + 1, isNew: true }
    columns.value.forEach((col: any) => {
        if (col.isVisible && col.field && col.field !== 'id') {
            newRow[col.field] = col.defaultValue ?? ''
        }
    })
    rows.value.unshift(newRow)
    emit('rowChanged', newRow)
}

function cloneRows() {
    const selected = registryGridRef.value?.getSelectedRows() ?? []
    selected.forEach((row: any) => {
        const tempRow = { ...row, uniqueId: crypto.randomUUID(), isNew: true }
        delete tempRow.id
        if (props.keyColumnName) tempRow[props.keyColumnName] = ''
        columns.value.filter((x: any) => x.isAudit).forEach((col: any) => delete tempRow[col.field])
        rows.value.unshift(tempRow)
        emit('rowChanged', tempRow)
    })
}

// ── Delete rows ──────────────────────────────────────────────────────────
function rowsDeleteConfirm() {
    $q.dialog({
        title: t('common.toast.deleteTitle'),
        message: t('common.toast.deleteMessage'),
        cancel: true,
        persistent: true
    }).onOk(() => deleteSelectedRows())
}

function deleteSelectedRows() {
    const selected = registryGridRef.value?.getSelectedRows() ?? []
    const newRows = selected.filter((r: any) => r.isNew)
    newRows.forEach((row: any) => {
        const idx = rows.value.findIndex((r: any) => r.uniqueId === row.uniqueId)
        if (idx !== -1) rows.value.splice(idx, 1)
        emit('clonedRowRemoved', row)
    })
    const existingRows = selected.filter((r: any) => !r.isNew)
    if (existingRows.length > 0) emit('rowDeleted', existingRows)
}

// Called by RegistryGrid when the user deletes already-saved rows
function onRowsDeletedFromGrid(rowsToDelete: any[]) {
    emit('rowDeleted', rowsToDelete)
}

// ── Cell edit ────────────────────────────────────────────────────────────
function onRowChanged(row: any, field?: string) {
    if (field) {
        const col = columns.value.find((c: any) => c.field === field)
        if (col?.dependsFrom && !dependsFromSuppressed.value[field]) {
            const sourceCol = columns.value.find((c: any) => c.field === col.dependsFrom)
            dependsFromCurrentField.value = field
            dependsFromWarningColumn.value = col.title ?? col.field
            dependsFromWarningSource.value = sourceCol?.title ?? col.dependsFrom
            dependsFromWarningVisible.value = true
        }
    }
    emit('rowChanged', row)
}

function onDependsFromWarningClose(payload: { dontShowAgain: boolean }) {
    if (payload.dontShowAgain && dependsFromCurrentField.value) dependsFromSuppressed.value[dependsFromCurrentField.value] = true
    dependsFromWarningVisible.value = false
}

// ── Dropdown with dependent columns ─────────────────────────────────────
function onDropdownChange(payload: any) {
    if (payload.action === 'load-options') {
        addColumnOptions({ column: payload.column, row: payload.row })
        return
    }
    // action === 'value-changed'
    const column = payload.column
    const row = payload.row
    selectedRow.value = row

    if (column.hasDependencies) {
        dependentColumns.value = []
        collectDependentColumns(column)
        if (!stopWarnings.value[column.field]) {
            const hasValues = dependentColumns.value.some((col: any) => selectedRow.value[col.field])
            if (hasValues) warningVisible.value = true
            else clearDependentColumnsValues()
        } else {
            clearDependentColumnsValues()
        }
    }
    row.edited = true
    emit('rowChanged', row)
}

function collectDependentColumns(column: any) {
    if (!column.hasDependencies) return
    column.hasDependencies.forEach((col: any) => {
        dependentColumns.value.push(col)
        collectDependentColumns(col)
    })
}

function onWarningDialogClose(payload: any) {
    if (payload.stopWarnings) {
        stopWarnings.value[payload.columnField] = true
        emit('warningChanged', stopWarnings.value)
    }
    clearDependentColumnsValues()
    warningVisible.value = false
}

function clearDependentColumnsValues() {
    dependentColumns.value.forEach((col: any) => (selectedRow.value[col.field] = ''))
    selectedRow.value.edited = true
    emit('rowChanged', selectedRow.value)
}

// ── Pagination ───────────────────────────────────────────────────────────
function onPageChanged(params: any) {
    lazyParams.value = {
        ...lazyParams.value,
        start: params.paginationStart ?? lazyParams.value.start ?? 0,
        limit: params.paginationLimit ?? lazyParams.value.limit ?? registryDescriptor.paginationNumberOfItems,
        size: params.size ?? lazyParams.value.size,
        enabled: params.enabled ?? lazyParams.value.enabled ?? false
    }
    emit('pageChanged', {
        paginationStart: lazyParams.value.start,
        paginationLimit: lazyParams.value.limit,
        paginationEnd: lazyParams.value.start + lazyParams.value.limit,
        size: lazyParams.value.size,
        enabled: lazyParams.value.enabled
    })
}

function onPageChangeByPage(page: number) {
    onPageChanged({
        paginationStart: (page - 1) * rowsPerPage.value,
        paginationLimit: rowsPerPage.value,
        paginationEnd: page * rowsPerPage.value,
        size: lazyParams.value.size,
        enabled: lazyParams.value.enabled
    })
}

// ── Sorting ──────────────────────────────────────────────────────────────
function onSortingChanged(model: any) {
    sortModel.value = model
    emit('sortingChanged', model)
}

// ── Public API ────────────────────────────────────────────────────────────
function stopGridEditing() {
    // The new grid does not need an explicit stopEditing call:
    // input blur automatically confirms the edit.
    // Kept for compatibility with Registry.vue.
}

// ── Watchers ─────────────────────────────────────────────────────────────
watch(
    () => props.propColumns,
    () => {
        columns.value = []
        loadColumnDefinitions()
    }
)
watch(() => props.propConfiguration, loadConfiguration)
watch(() => props.propRows, loadRows)
watch(() => props.pagination, loadPagination, { deep: true })

// ── Lifecycle ────────────────────────────────────────────────────────────
onMounted(() => {
    emitter.on('refreshTableWithData', loadRows)
    emitter.on('clearSelectedRows', () => registryGridRef.value?.clearSelectedRows())
    loadColumnDefinitions()
    loadRows()
    loadConfiguration()
    loadPagination()
    loadWarningState()
})

onUnmounted(() => {
    emitter.off('refreshTableWithData', loadRows)
    emitter.off('clearSelectedRows', () => registryGridRef.value?.clearSelectedRows())
})

defineExpose({ stopGridEditing })
</script>

<style scoped lang="scss">
.registry-pagination {
    border-top: 1px solid rgb(0 0 0 / 8%);
    justify-content: space-between;
    min-height: 40px;
}

.registry-pagination__report {
    color: rgb(0 0 0 / 60%);
    font-size: 0.875rem;
}
</style>
