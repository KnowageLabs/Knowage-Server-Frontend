<template>
    <div id="registry-gric-container" class="kn-height-full column">
        <q-toolbar dense class="registry-toolbar">
            <q-chip v-if="selectedRows.length > 0" dense color="primary" text-color="white" icon="checklist" class="q-ml-xs"> {{ selectedRows.length }} {{ $t('documentExecution.registry.grid.rowsSelected') }} </q-chip>
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
        <ag-grid-vue class="registry-grid ag-theme-balham" style="flex: 1; min-height: 0" :row-data="rows" :grid-options="gridOptions" :context="context" />
    </div>

    <RegistryDatatableWarningDialog :visible="warningVisible" :columns="dependentColumns" @close="onWarningDialogClose"></RegistryDatatableWarningDialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { luxonFormatDate, formatDateWithLocale, localeDate, primeVueDate, getLocale } from '@/helpers/commons/localeHelper'
import { setInputDataType, formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import { useI18n } from 'vue-i18n'
import { emitter } from './RegistryDatatableHelper'
import registryDescriptor from '../RegistryDescriptor.json'
import RegistryDatatableWarningDialog from './RegistryDatatableWarningDialog.vue'
import CellEditor from './registryCellRenderers/RegistryCellEditor.vue'
import HeaderRenderer from './registryCellRenderers/RegistryHeaderRenderer.vue'
import TooltipRenderer from './registryCellRenderers/RegistryTooltipRenderer.vue'
import mainStore from '../../../../App.store'
import { AgGridVue } from '@/composables/useAgGrid'
import { useRegistryColumnOptions } from '../composables/useRegistryColumnOptions'

const appStore = mainStore()
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

const columns = ref<any[]>([])
const rows = ref<any[]>([])
const configuration = ref<any>({})
const buttons = ref<any>({})

const { comboColumnOptions, addColumnOptions, loadColumnOptions } = useRegistryColumnOptions(
    () => props.entity,
    () => props.id,
    (row, field) => row[field],
    {
        onBeforeLoad: () => gridApi.value?.showLoadingOverlay(),
        onAfterLoad: () => gridApi.value?.hideOverlay()
    }
)
const lazyParams = ref<any>({})
const dependentColumns = ref<any[]>([])
const selectedRow = ref<any>(null)
const warningVisible = ref(false)
const stopWarnings = ref<any[]>([])
const first = ref(0)
const loading = ref(false)
const gridApi = ref<any>(null)
const timeout = ref<any>(null)
const selectedRows = ref<any[]>([])
const gridOptions = ref<any>(null)
const context = ref<any>(null)
const ctrlDown = ref(false)
const sortModel = ref<any>({ fieldName: '', orderType: 'NONE' })

const getCurrentLocaleDefaultDateFormat = computed(() => (column: any) => (column.isEditable ? column.format || primeVueDate() : localeDate()))

const deleteButtonEnabled = computed<boolean>(() => {
    const enableDeleteRecords = Object.prototype.hasOwnProperty.call(buttons.value, 'enableDeleteRecords')
    if (enableDeleteRecords) return buttons.value.enableDeleteRecords
    else return buttons.value.enableButtons
})

const addButtonEnabled = computed<boolean>(() => {
    const enableAddRecords = Object.prototype.hasOwnProperty.call(buttons.value, 'enableAddRecords')
    if (enableAddRecords) return buttons.value.enableAddRecords
    else return buttons.value.enableButtons
})

function onGridReady(params: any) {
    gridApi.value = params.api
    refreshGridConfiguration()
}

function refreshGridConfiguration() {
    gridApi.value.setGridOption('columnDefs', columns.value)
    gridApi.value.setGridOption('rowData', rows.value)
}

function setupDatatableOptions() {
    gridOptions.value = {
        columnDefs: columns.value,
        tooltipShowDelay: 100,
        tooltipMouseTrack: true,
        rowHeight: 30,
        headerHeight: 32,
        defaultColDef: {
            editable: false,
            enableValue: true,
            sortable: true,
            resizable: true,
            width: 100,
            tooltipComponent: TooltipRenderer,
            cellClassRules: {
                'edited-cell-color-class': (params: any) => {
                    if (params.data.isEdited) return params.data.isEdited.includes(params.colDef.field)
                }
            }
        },
        rowSelection: 'multiple',
        animateRows: true,
        suppressScrollOnNewData: true,
        onCellKeyDown: onCellKeyDown,
        onBodyScroll: onBodyScroll,
        onSelectionChanged: onSelectionChanged,
        onCellValueChanged: onCellValueChanged,
        onGridReady: onGridReady,
        getRowStyle: getRowStyle,
        getRowId: getRowId
    }
}

async function loadColumnDefinitions() {
    if (props.propColumns.length == 0 || columns.value.length > 0) return
    loading.value = true
    columns.value = [
        {
            colId: 'indexColumn',
            valueGetter: `node.rowIndex + 1`,
            headerName: 'id',
            pinned: 'left',
            isVisible: true,
            isEditable: false,
            suppressMovable: true,
            resizable: false,
            columnInfo: { type: 'int' },
            cellStyle: () => ({ color: 'black', backgroundColor: registryDescriptor.styles.colors.disabledCellColor, opacity: 0.8 })
        }
    ]
    props.propColumns?.forEach((el: any) => {
        if (el.isVisible) {
            el.editable = el.isEditable
            el.headerName = el.title ?? el.columnInfo.header
            el.tooltipField = el.field
            addColumnEditableProps(el)
            addColumnCheckboxRendererProps(el)
            addColumnFormattingProps(el)
            el.headerComponent = HeaderRenderer
            el.headerComponentParams = { sortModel: sortModel.value }
            columns.value.push(el)
        }
    })
    setColumnDependencies()
    await loadInitialDropdownOptions()
    loading.value = false
    gridApi.value?.setGridOption('columnDefs', columns.value)
}

function addColumnEditableProps(el: any) {
    if (el.editable) {
        el.cellEditor = CellEditor
        el.cellEditorParams = { comboColumnOptions: comboColumnOptions.value }
        if (el.color) el.cellStyle = () => ({ color: 'black', backgroundColor: el.color, opacity: 1 })
    } else {
        el.cellStyle = () => ({ color: 'black', backgroundColor: el.color ? el.color : 'rgba(231, 231, 231, 0.8)', opacity: 0.6 })
    }
}

function addColumnCheckboxRendererProps(el: any) {
    if (el.editorType == 'TEXT' && el.columnInfo?.type === 'boolean') {
        el.cellRenderer = (params: any) => `<i class="fas fa-${params.value ? 'check' : 'times'}"/>`
    }
}

function addColumnFormattingProps(el: any) {
    let locale = getLocale()
    locale = locale ? locale.replace('_', '-') : ''
    if (el.columnInfo?.type === 'date') {
        el.valueFormatter = (params: any) => getFormattedDate(params.value, 'yyyy-MM-dd', getCurrentLocaleDefaultDateFormat.value(el))
    } else if (el.columnInfo?.type === 'timestamp') {
        el.valueFormatter = (params: any) => getFormattedDateTime(params.value, { dateStyle: 'short', timeStyle: 'medium' }, true)
    } else if (['int', 'float', 'decimal', 'long'].includes(el.columnInfo?.type)) {
        el.valueFormatter = (params: any) => {
            const configuration = formatRegistryNumber(el)
            const formattedValue = Intl.NumberFormat(locale, { useGrouping: configuration?.useGrouping, minimumFractionDigits: configuration?.minFractionDigits, maximumFractionDigits: configuration?.maxFractionDigits }).format(params.value)
            if ('NaN' === formattedValue) return '*'
            return formattedValue
        }
    }
}

function setColumnDependencies() {
    columns.value.forEach((column: any) => {
        if (column.dependences) {
            const index = columns.value.findIndex((parentColumn: any) => parentColumn.field === column.dependences)
            if (index !== -1) {
                columns.value[index].hasDependencies ? columns.value[index].hasDependencies.push(column) : (columns.value[index].hasDependencies = [column])
                comboColumnOptions.value[column.dependences] = []
            }
        }
    })
}

async function loadInitialDropdownOptions() {
    for (let i = 0; i < columns.value.length; i++) {
        if (columns.value[i].editorType === 'COMBO') {
            await addColumnOptions({ column: columns.value[i], row: {} })
        }
    }
}

function loadConfiguration() {
    configuration.value = props.propConfiguration
    for (let i = 0; i < configuration.value.length; i++) {
        if (configuration.value[i].name === 'enableButtons') {
            buttons.value.enableButtons = configuration.value[i].value === 'true'
        } else {
            if (configuration.value[i].name === 'enableDeleteRecords') buttons.value.enableDeleteRecords = configuration.value[i].value === 'true'
            if (configuration.value[i].name === 'enableAddRecords') buttons.value.enableAddRecords = configuration.value[i].value === 'true'
        }
    }
}

function loadRows() {
    rows.value = props.propRows as any[]
    gridApi.value?.setGridOption('rowData', rows.value)
}

function getRowId(params: any) {
    return params.data.uniqueId
}

function loadPagination() {
    lazyParams.value = { ...props.pagination } as any
}

function loadWarningState() {
    stopWarnings.value = props.stopWarningsState as any[]
}

function onPage(event: any) {
    lazyParams.value = { paginationStart: event.first, paginationLimit: event.rows, paginationEnd: event.first + event.rows, size: lazyParams.value.size }
    emit('pageChanged', lazyParams.value)
}

function rowsDeleteConfirm() {
    $q.dialog({
        title: t('common.toast.deleteTitle'),
        message: t('common.toast.deleteMessage'),
        cancel: true,
        persistent: true
    }).onOk(() => deleteRows())
}

function deleteRows() {
    const rowsForTableDeletion = selectedRows.value.filter((row: any) => row.isNew)
    if (rowsForTableDeletion.length > 0) {
        rowsForTableDeletion.forEach((val: any) => {
            const foundIndex = rows.value.indexOf(val)
            if (foundIndex != -1) rows.value.splice(foundIndex, 1)
            emit('clonedRowRemoved', val)
        })
        gridApi.value.applyTransaction({ remove: rowsForTableDeletion })
    }
    const rowsForServiceDeletion = selectedRows.value.filter((row: any) => !row.isNew)
    if (rowsForServiceDeletion.length > 0) emit('rowDeleted', rowsForServiceDeletion)
}

function getFormattedDate(date: any, format: any, incomingFormat?: string) {
    return luxonFormatDate(date, format, incomingFormat)
}

function getFormattedDateTime(date: any, format?: any, keepNull?: boolean) {
    return formatDateWithLocale(date, format, keepNull)
}

function addNewRow() {
    const newRow: any = { uniqueId: crypto.randomUUID(), id: rows.value.length + 1, isNew: true }
    columns.value.forEach((el: any) => {
        if (el.isVisible && el.field && el.field !== 'id') {
            if (el.defaultValue) newRow[el.field] = el.defaultValue
            else newRow[el.field] = ''
        }
    })
    addRowToFirstPosition(newRow)
    if (lazyParams.value.size <= registryDescriptor.paginationLimit) first.value = 0
    emit('rowChanged', newRow)
}

function cloneRows() {
    selectedRows.value.forEach((row: any) => {
        const tempRow = { ...row }
        tempRow.uniqueId = crypto.randomUUID()
        tempRow.isNew = true
        delete tempRow.id
        if (props.keyColumnName) tempRow[props.keyColumnName] = ''
        columns.value.filter((x: any) => x.isAudit).forEach((column: any) => delete tempRow[column.field])
        addRowToFirstPosition(tempRow)
        emit('rowChanged', tempRow)
    })
}

function addRowToFirstPosition(newRow: any) {
    gridApi.value.applyTransaction({ addIndex: 0, add: [newRow] })
}

function onDropdownChange(payload: any) {
    const column = payload.column
    const row = payload.row
    selectedRow.value = row
    if (column.hasDependencies) {
        dependentColumns.value = []
        setDependentColumns(column)
        if (!stopWarnings.value[column.field]) {
            dependentColumns.value.forEach((el: any) => {
                if (selectedRow.value[el.field]) warningVisible.value = true
            })
        } else clearDependentColumnsValues()
    }
    row.edited = true
    emit('rowChanged', row)
}

function setDependentColumns(column: any) {
    if (!column.hasDependencies) return
    column.hasDependencies.forEach((el: any) => {
        dependentColumns.value.push(el)
        setDependentColumns(el)
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
    dependentColumns.value.forEach((el: any) => (selectedRow.value[el.field] = ''))
    selectedRow.value.edited = true
    emit('rowChanged', selectedRow.value)
    gridApi.value.refreshCells()
}

function setRowEdited(row: any) {
    row.edited = true
    emit('rowChanged', row)
}

function onSelectionChanged() {
    selectedRows.value = gridApi.value.getSelectedRows()
}

function onBodyScroll() {
    if (timeout.value) clearTimeout(timeout.value)
    timeout.value = setTimeout(() => {
        const bottom_px = gridApi.value.getVerticalPixelRange().bottom
        const grid_height = gridApi.value.getDisplayedRowCount() * gridApi.value.getSizesForCurrentTheme().rowHeight
        if (bottom_px >= grid_height) {
            const newPaginationStart = lazyParams.value.start + registryDescriptor.paginationNumberOfItems
            lazyParams.value = { paginationStart: newPaginationStart, paginationLimit: registryDescriptor.paginationLimit, size: lazyParams.value.size }
            emit('pageChanged', lazyParams.value)
        }
    }, 300)
}

async function onCellKeyDown(ev: any) {
    const myCell = getFocusedCell(ev)
    const [ctrlKey, cKey, vKey] = [17, 67, 86]
    if (ev.event.which === ctrlKey) {
        ctrlDown.value = true
    } else if (ev.event.which == cKey && ctrlDown.value == true) {
        window.navigator.clipboard.writeText(ev.value).catch((er) => console.log(er))
    } else if (ev.event.which == vKey && ctrlDown.value == true) {
        await window.navigator.clipboard.readText().then(async (value) => {
            await setCellValue(myCell, value)
        })
    }
}

function getFocusedCell(ev: any) {
    const focusedCell = ev.api.getFocusedCell()
    const rowNode = ev.api.getRowNode(ev.data.uniqueId)
    const column = focusedCell.column.colDef.field
    return { cell: focusedCell, column: column, row: rowNode }
}

async function setCellValue(selectedCell: any, pasteValue: any) {
    const colDef = selectedCell.cell.column.colDef
    const cellType = getCellType(colDef)
    if (cellAcceptsPasteValue(colDef, cellType)) {
        switch (cellType) {
            case 'text':
                selectedCell.row.setDataValue(selectedCell.column, pasteValue)
                break
            case 'number':
                setNumbericCellValue(selectedCell, pasteValue)
                break
            case 'dropdown':
                await setDropdownCellValue(colDef, selectedCell, pasteValue)
                break
            default:
                break
        }
    }
}

function setNumbericCellValue(selectedCell: any, pasteValue: any) {
    if (!isNaN(pasteValue)) selectedCell.row.setDataValue(selectedCell.column, pasteValue)
    else setCannotPasteWarning('nan')
}

async function setDropdownCellValue(colDef: any, selectedCell: any, pasteValue: any) {
    await addColumnOptions({ column: colDef, row: selectedCell.row.data })
    if (!validateDropdownValueAfterCopyPaste(colDef, pasteValue, selectedCell)) setCannotPasteWarning('dropdown')
    else {
        selectedCell.row.setDataValue(selectedCell.column, pasteValue)
        onDropdownChange({ row: selectedCell.row.data, column: selectedCell.cell.column.userProvidedColDef })
    }
}

function validateDropdownValueAfterCopyPaste(colDef: any, pasteValue: string, selectedCell: any) {
    const parentCellValue = selectedCell.row.data[colDef.dependences]
    const options = comboColumnOptions.value && comboColumnOptions.value[colDef.field] ? comboColumnOptions.value[colDef.field][parentCellValue ?? 'All'] : []
    if (!options) return false
    return options.findIndex((opt: any) => opt['column_1'] === pasteValue) !== -1
}

function cellAcceptsPasteValue(colDef: any, cellType: any) {
    if (colDef.editable == false || colDef.isEditable == false) {
        setCannotPasteWarning('notEditable')
        return false
    } else if (cellType === 'checkbox') {
        setCannotPasteWarning('checkbox')
        return false
    } else if (cellType === 'temporal') {
        setCannotPasteWarning('temporal')
        return false
    } else return true
}

function setCannotPasteWarning(type: string) {
    let message = ''
    switch (type) {
        case 'notEditable':
            message = t('documentExecution.registry.copyPasteValidationErrors.notEditable')
            break
        case 'dropdown':
            message = t('documentExecution.registry.copyPasteValidationErrors.dropdown')
            break
        case 'checkbox':
            message = t('documentExecution.registry.copyPasteValidationErrors.checkbox')
            break
        case 'temporal':
            message = t('documentExecution.registry.copyPasteValidationErrors.temporal')
            break
        case 'nan':
            message = 'NOT A NUMBER'
            break
    }
    appStore.setInfo({ title: t('common.error.generic'), msg: message })
}

function getCellType(colDef: any) {
    if (colDef.editorType == 'TEXT' && colDef.columnInfo?.type === 'boolean') return 'checkbox'
    if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'text') return 'text'
    if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'number') return 'number'
    if (colDef.editorType === 'COMBO') return 'dropdown'
    if (colDef.columnInfo?.type === 'date' || colDef.columnInfo?.type === 'timestamp') return 'temporal'
}

function onCellValueChanged(params: any) {
    if (params.oldValue !== params.newValue) {
        if (params.data.isEdited) params.data.isEdited.push(params.colDef.field)
        else params.data.isEdited = [params.colDef.field]
        emit('rowChanged', params.data)
    }
    params.api.refreshCells()
}

function getRowStyle(params: any) {
    if (params.data.isNew) return { 'background-color': registryDescriptor.styles.colors.newRowColor }
}

function sortingChanged(updatedSortModel: any) {
    sortModel.value = updatedSortModel
    columns.value.forEach((el: any) => {
        if (el.isVisible) {
            el.headerComponent = HeaderRenderer
            el.headerComponentParams = { sortModel: updatedSortModel }
        }
    })
    refreshGridConfiguration()
    emit('sortingChanged', updatedSortModel)
}

function clearSelectedRows() {
    selectedRows.value = []
}

function stopGridEditing() {
    if (gridApi.value) gridApi.value.stopEditing()
}

watch(
    () => props.propColumns,
    () => loadColumnDefinitions()
)
watch(
    () => props.propConfiguration,
    () => loadConfiguration()
)
watch(() => props.propRows, loadRows)
watch(
    () => props.dataLoading,
    () => {
        if (!gridApi.value) return
        props.dataLoading ? gridApi.value.showLoadingOverlay() : gridApi.value.hideOverlay()
    }
)
watch(
    () => props.pagination,
    () => {
        loadPagination()
        first.value = props.pagination?.start
    },
    { deep: true }
)

context.value = { componentParent: { setRowEdited, onDropdownChange, addColumnOptions } }
setupDatatableOptions()

onMounted(() => {
    emitter.on('refreshTableWithData', loadRows)
    emitter.on('clearSelectedRows', clearSelectedRows)
    loadColumnDefinitions()
    loadRows()
    loadConfiguration()
    loadPagination()
    loadWarningState()
})

onUnmounted(() => {
    emitter.off('refreshTableWithData', loadRows)
    emitter.off('clearSelectedRows', clearSelectedRows)
})

defineExpose({ stopGridEditing })
</script>
<style lang="scss">
.flag-shown {
    opacity: 1;
}

.flag-hidden {
    opacity: 0;
}

.registry-grid {
    border: none;

    // Header coerente con la palette kn-toolbar-default
    &.ag-theme-balham .ag-header {
        background-color: var(--kn-toolbar-default-background-color);
        color: var(--kn-toolbar-default-color);
        font-weight: 600;
        font-size: 0.8rem;
        letter-spacing: 0.02em;
    }

    &.ag-theme-balham .ag-header-cell-label {
        color: var(--kn-toolbar-default-color);
    }

    // Riga zebrata più leggibile
    &.ag-theme-balham .ag-row-odd {
        background-color: #f8f9fa;
    }

    // Riga selezionata
    &.ag-theme-balham .ag-row-selected {
        background-color: #dde8f5;
    }
}

// Cella modificata: sfondo + bordo sinistro accent verde
// Specificità aumentata con il selettore tema per evitare !important
.ag-theme-balham .edited-cell-color-class {
    background-color: #edf7e3;
    border-left: 3px solid #749e43;
    font-weight: 500;
}
</style>
