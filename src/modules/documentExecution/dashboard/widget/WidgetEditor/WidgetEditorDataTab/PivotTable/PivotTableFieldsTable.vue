<template>
    <WidgetEditorColumnList
        :rows="rows"
        row-key="id"
        :label="settings.label"
        :hint="settings.hint"
        :error="error && fieldType !== 'filters'"
        :drop-active="listDragActive"
        :empty-hint="settings.dropIsActive ? settings.dragColumnsHint : null"
        :reorder-enabled="rowReorderEnabled"
        :cells-template="cellsTemplate"
        @column-drop="onDropComplete"
        @row-reorder="onRowReorder"
    >
        <template #header>
            <div v-for="column in displayedColumns" :key="column.field">{{ getColumnHeader(column.field) }}</div>
        </template>
        <template #cells="{ row }">
            <div v-for="column in displayedColumns" :key="column.field">
                <div v-if="column.field === 'alias'">
                    <q-input v-model="row[column.field]" outlined dense hide-bottom-space class="kn-field-compact" @change="onColumnAliasRenamed(row)" />
                    <q-tooltip v-if="row[column.field]" :delay="500">{{ row[column.field] }}</q-tooltip>
                </div>
                <q-select v-else-if="column.field === 'aggregation' && aggregationDropdownIsVisible(row)" v-model="row[column.field]" :options="getAggregationOptions(row)" option-label="label" option-value="value" emit-value map-options outlined dense hide-bottom-space options-dense class="kn-field-compact" @update:model-value="$emit('itemUpdated', row)">
                    <q-tooltip v-if="row[column.field]" :delay="500">{{ row[column.field] }}</q-tooltip>
                </q-select>
                <div v-else-if="column.field === 'columnName'">
                    <q-input v-model="row[column.field]" outlined dense hide-bottom-space readonly class="kn-field-compact" />
                    <q-tooltip v-if="row[column.field]" :delay="500">{{ row[column.field] }}</q-tooltip>
                </div>
                <span v-else-if="!row.formula" class="kn-truncated">{{ row[column.field] }}</span>
            </div>
        </template>
        <template #actions="{ row }">
            <q-btn v-if="fieldType !== 'data'" flat round dense size="sm" :icon="getColumnSortIcon(row)" :color="row.sort ? 'primary' : undefined" @click.stop="changeColumnSort(row)">
                <q-tooltip :delay="500">{{ $t('common.sort') }}</q-tooltip>
            </q-btn>
            <q-btn v-if="row.formula" flat round dense size="sm" icon="fas fa-calculator" @click.stop="openCalculatedFieldDialog(row)">
                <q-tooltip :delay="500">{{ $t('common.edit') }}</q-tooltip>
            </q-btn>
            <q-btn v-if="row.type === 'pythonFunction'" flat round dense size="sm" icon="fas fa-superscript" @click.stop="openFunctionsColumnDialog(row)">
                <q-tooltip :delay="500">{{ $t('common.edit') }}</q-tooltip>
            </q-btn>
        </template>
        <template #trailing="{ row }">
            <q-btn flat round dense size="sm" icon="delete" data-test="delete-button" @click.stop="deleteItem(row)">
                <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
            </q-btn>
        </template>
        <template #expansion="{ row }">
            <TableWidgetColumnForm :widget-model="widgetModel" :selected-column="row"></TableWidgetColumnForm>
        </template>
    </WidgetEditorColumnList>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IWidget, IWidgetColumn, IWidgetFunctionColumn } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import { createNewWidgetColumn } from '../../helpers/WidgetEditorHelpers'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import descriptor from './PivotTableDataContainerDescriptor.json'
import deepcopy from 'deepcopy'
import TableWidgetColumnForm from '../TableWidget/TableWidgetColumnForm.vue'
import WidgetEditorColumnList from '../common/WidgetEditorColumnList.vue'

export default defineComponent({
    name: 'widget-editor-column-table',
    components: { WidgetEditorColumnList, TableWidgetColumnForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, items: { type: Array, required: true }, settings: { type: Object, required: true }, fieldType: { type: String }, error: { type: Boolean } },
    emits: ['rowReorder', 'itemUpdated', 'itemSelected', 'itemDeleted', 'itemAdded', 'singleItemReplaced'],
    data() {
        return {
            descriptor,
            commonDescriptor,
            rows: [] as IWidgetColumn[],
            listDragActive: inject('listDragActive', false) as boolean
        }
    },
    computed: {
        // One grid for the header and the rows. Without an alias the name takes 2/3 and the aggregation 1/3.
        cellsTemplate(): string {
            const fields = this.displayedColumns.map((column: any) => column.field)
            const hasAlias = fields.includes('alias')
            return fields
                .map((field: string) => {
                    if (field === 'aggregation') return hasAlias ? '150px' : 'minmax(140px, 1fr)'
                    if (field === 'columnName' && !hasAlias) return 'minmax(0, 2fr)'
                    return 'minmax(0, 1fr)'
                })
                .join(' ')
        },
        // The aggregation column shows only when a row has an aggregation
        displayedColumns(): any[] {
            return this.settings.columns.filter((column: any) => column.field !== 'aggregation' || this.rows.some((row: IWidgetColumn) => this.aggregationDropdownIsVisible(row) || (!row.formula && !!row.aggregation)))
        },
        widgetType() {
            return this.widgetModel.type
        },
        rowReorderEnabled(): boolean {
            return this.rows.length > 1
        }
    },
    watch: {
        items() {
            this.loadItems()
        }
    },
    created() {
        this.setEventListeners()
        this.loadItems()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('selectedColumnUpdated', this.onSelectedColumnUpdated)
            emitter.on('addNewCalculatedField', this.onCalcFieldAdded)
            emitter.on('addNewFunctionColumn', this.onFunctionsColumnAdded)
            emitter.on('functionColumnEdited', this.onFunctionsColumnEdited)
        },
        removeEventListeners() {
            emitter.off('selectedColumnUpdated', this.onSelectedColumnUpdated)
            emitter.off('addNewCalculatedField', this.onCalcFieldAdded)
            emitter.off('addNewFunctionColumn', this.onFunctionsColumnAdded)
            emitter.off('functionColumnEdited', this.onFunctionsColumnEdited)
        },
        onSelectedColumnUpdated(column: any) {
            this.updateSelectedColumn(column)
        },
        loadItems() {
            this.rows = this.items as IWidgetColumn[]
        },
        getColumnHeader(field: string): string {
            if (field === 'columnName') return this.$t('components.knCalculatedField.columnName')
            if (field === 'alias') return this.$t('common.alias')
            if (field === 'aggregation') return this.$t('dashboard.widgetEditor.aggregation')
            return ''
        },
        onRowReorder(event: any) {
            this.rows = event.value
            this.$emit('rowReorder', { fields: event.value, fieldType: this.fieldType })
        },
        onDropComplete(event: DragEvent) {
            const data = event.dataTransfer?.getData('text/plain')
            if (!data || data === 'b') return
            let eventData: any
            try {
                eventData = JSON.parse(data)
            } catch {
                return
            }
            const tempColumn = createNewWidgetColumn(eventData, this.widgetType)
            if (!this.isFieldUsed(tempColumn)) this.rows.push(tempColumn as IWidgetColumn)

            this.$emit('itemAdded', { column: tempColumn, rows: this.rows, settings: this.settings, fieldType: this.fieldType })
        },
        isFieldUsed(tempColumn: IWidgetColumn) {
            const colIndex = this.widgetModel.fields?.columns.findIndex((row: IWidgetColumn) => row.columnName === tempColumn.columnName)
            const rowIndex = this.widgetModel.fields?.rows.findIndex((row: IWidgetColumn) => row.columnName === tempColumn.columnName)
            const dataIndex = this.widgetModel.fields?.data.findIndex((row: IWidgetColumn) => row.columnName === tempColumn.columnName)
            const filtIndex = this.widgetModel.fields?.filters.findIndex((row: IWidgetColumn) => row.columnName === tempColumn.columnName)

            return colIndex !== -1 || rowIndex !== -1 || dataIndex !== -1 || filtIndex !== -1
        },
        deleteItem(item: IWidgetColumn) {
            // Function output fields share the id of their function column: find the clicked row itself
            let index = this.rows.indexOf(item)
            if (index === -1) index = this.rows.findIndex((row: IWidgetColumn) => row.id === item.id)
            if (index === -1) return
            this.rows.splice(index, 1)
            this.$emit('itemDeleted', item)
        },
        // An edited function column replaces all of its output fields (as in WidgetEditorColumnTable)
        deleteFunctionColumns(functionColumn: IWidgetFunctionColumn) {
            for (let i = this.rows.length - 1; i >= 0; i--) {
                const row = this.rows[i] as IWidgetFunctionColumn
                if (row.id === functionColumn.id || (functionColumn.originalFunctionColumnName && row.originalFunctionColumnName === functionColumn.originalFunctionColumnName)) {
                    this.rows.splice(i, 1)
                    this.$emit('itemDeleted', row)
                }
            }
        },
        aggregationDropdownIsVisible(row: any) {
            return row.fieldType === 'MEASURE' && !row.formula
        },
        updateSelectedColumn(selectedColumn: IWidgetColumn) {
            const index = this.rows.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === selectedColumn.id)
            if (index !== -1) {
                this.rows[index] = { ...selectedColumn }
                this.$emit('itemUpdated', this.rows[index])
            }
        },
        onColumnAliasRenamed(column: IWidgetColumn) {
            emitter.emit('columnAliasRenamed', column as IWidgetColumn)
            this.$emit('itemUpdated', column)
        },
        openCalculatedFieldDialog(column: IWidgetColumn) {
            emitter.emit('editCalculatedField', column)
        },
        onCalcFieldAdded(field) {
            if (this.settings.label === 'dashboard.widgetEditor.pivotData') {
                this.rows.push(field as IWidgetColumn)
                this.$emit('itemAdded', { column: field, rows: this.rows, settings: this.settings, fieldType: this.fieldType })
            }
        },
        getColumnSortIcon(col) {
            if (col.sort === 'ASC') return 'fas fa-arrow-up-short-wide'
            if (col.sort === 'DESC') return 'fas fa-arrow-down-wide-short'
            return 'fas fa-arrows-up-down' // default/no sort
        },
        changeColumnSort(column: IWidgetColumn) {
            const next: Record<string, string | undefined> = { null: 'ASC', ASC: 'DESC', DESC: undefined }
            const currentOrder = String(column.sort ?? null)
            column.sort = next[currentOrder]
            this.$emit('itemUpdated', column)
        },
        onFunctionsColumnAdded(functionColumn: any) {
            if (this.settings.attributesOnly || this.settings.label !== 'dashboard.widgetEditor.pivotData') return

            if (functionColumn.catalogFunctionConfig?.outputColumns?.length > 0) {
                const originalColumnName = functionColumn.columnName
                functionColumn.catalogFunctionConfig.outputColumns.forEach((outputColumn: { fieldType: string; type: string; name: string }) => {
                    const columnToAdd = { ...functionColumn, alias: outputColumn.name, columnName: outputColumn.name, orderColumn: outputColumn.name, originalFunctionColumnName: originalColumnName }
                    this.addNewColumnToTheRows(columnToAdd as IWidgetColumn)
                })
            } else {
                this.addNewColumnToTheRows(functionColumn as IWidgetColumn)
            }
        },
        addNewColumnToTheRows(column: IWidgetColumn) {
            this.rows.push(column as IWidgetColumn)
            this.$emit('itemAdded', { column: column, rows: this.rows, settings: this.settings, fieldType: 'data' })
        },
        onFunctionsColumnEdited(functionColumn: any) {
            this.deleteFunctionColumns(functionColumn)
            this.onFunctionsColumnAdded(functionColumn)
        },
        openFunctionsColumnDialog(functionColumn: IWidgetFunctionColumn) {
            let functionToEmit = deepcopy(functionColumn)
            if (functionColumn.originalFunctionColumnName) {
                functionToEmit.alias = functionColumn.originalFunctionColumnName
                functionToEmit.columnName = functionColumn.originalFunctionColumnName
                functionToEmit.orderColumn = functionColumn.originalFunctionColumnName
            }
            emitter.emit('editFunctionColumn', functionToEmit)
        },
        getAggregationOptions(data) {
            if (data.formula) {
                return this.descriptor.columnAggregationOptions.filter((option) => option.value !== 'NONE')
            }
            return this.descriptor.columnAggregationOptions
        }
    }
})
</script>

