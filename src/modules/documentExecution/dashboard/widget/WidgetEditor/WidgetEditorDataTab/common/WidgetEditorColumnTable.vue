<template>
    <WidgetEditorColumnList
        :rows="rows"
        row-key="id"
        :label="settings.label"
        :hint="settings.hint"
        :error="error"
        :drop-active="listDragActive"
        :empty-hint="settings.dropIsActive ? settings.dragColumnsHint : null"
        :reorder-enabled="rowReorderEnabled"
        :cells-template="cellsTemplate"
        :show-type-icon="widgetModel.type !== 'highcharts' && widgetModel.type !== 'chartJS'"
        :get-row-class="getRowClass"
        @column-drop="onDropComplete"
        @row-reorder="onRowReorder"
        @handle-hover="hoveredSourceId = $event?.dynamicSourceDatasetId ?? null"
    >
        <template #header>
            <div v-for="column in displayedColumns" :key="column.field">{{ getColumnHeader(column.field) }}</div>
        </template>
        <template #cells="{ row }">
            <div v-for="column in displayedColumns" :key="column.field">
                <div v-if="column.field === 'alias'">
                    <q-input v-model="row[column.field]" outlined dense hide-bottom-space class="kn-field-compact" :disable="row.type === 'pythonFunction'" @change="onColumnAliasRenamed(row)" />
                    <q-tooltip v-if="row[column.field]" :delay="500">{{ row[column.field] }}</q-tooltip>
                </div>
                <q-select v-else-if="aggregationDropdownIsVisible(column, row)" v-model="row[column.field]" :options="commonDescriptor.columnAggregationOptions" option-label="label" option-value="value" emit-value map-options outlined dense hide-bottom-space options-dense class="kn-field-compact" @update:model-value="$emit('itemUpdated', row)">
                    <q-tooltip v-if="row[column.field]" :delay="500">{{ row[column.field] }}</q-tooltip>
                </q-select>
                <div v-else-if="column.field === 'columnName'">
                    <q-input v-model="row[column.field]" outlined dense hide-bottom-space readonly class="kn-field-compact" />
                    <q-tooltip v-if="row[column.field]" :delay="500">{{ row[column.field] }}</q-tooltip>
                </div>
                <span v-else-if="!row.formula && row.fieldType !== 'ATTRIBUTE'" class="kn-truncated">{{ row[column.field] }}</span>
            </div>
        </template>
        <template #actions="{ row }">
            <q-btn v-if="showSortButton" flat round dense size="sm" :icon="sortIcon(row.orderType)" :color="row.orderType ? 'primary' : undefined" @click.stop="toggleSort(row)">
                <q-tooltip :delay="500">{{ row.orderType ?? 'NONE' }}</q-tooltip>
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
                <q-tooltip :delay="500">{{ row.dynamicSourceDatasetId ? $t('dashboard.widgetEditor.deleteDynamicGroup') : $t('common.delete') }}</q-tooltip>
            </q-btn>
        </template>
        <template #expansion="{ row }">
            <ChartWidgetColumnForm v-if="widgetType === 'highcharts' || widgetType === 'chartJS'" :widget-model="widgetModel" :selected-column="row" :chart-type="chartType"></ChartWidgetColumnForm>
            <SelectorDataForm v-else-if="widgetType === 'selector'" :prop-column="row" :widget-model="widgetModel" />
            <TableWidgetColumnForm v-else :widget-model="widgetModel" :selected-column="row"></TableWidgetColumnForm>
        </template>
    </WidgetEditorColumnList>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IDatasetColumn, IWidget, IWidgetColumn, IWidgetFunctionColumn } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import { addChartColumnToTable } from '../../helpers/chartWidget/ChartWidgetDataTabHelpers'
import { createNewWidgetColumn } from '../../helpers/WidgetEditorHelpers'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import deepcopy from 'deepcopy'
import ChartWidgetColumnForm from '../ChartWidget/common/ChartWidgetColumnForm.vue'
import TableWidgetColumnForm from '../TableWidget/TableWidgetColumnForm.vue'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import SelectorDataForm from '../SelectorWidget/SelectorDataForm.vue'
import WidgetEditorColumnList from './WidgetEditorColumnList.vue'

export default defineComponent({
    name: 'widget-editor-column-table',
    components: { WidgetEditorColumnList, ChartWidgetColumnForm, TableWidgetColumnForm, SelectorDataForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, items: { type: Array, required: true }, settings: { type: Object, required: true }, chartType: { type: String }, axis: { type: String }, error: { type: Boolean } },
    emits: ['rowReorder', 'itemUpdated', 'itemDeleted', 'itemAdded', 'singleItemReplaced'],
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            commonDescriptor,
            rows: [] as IWidgetColumn[],
            listDragActive: inject('listDragActive', false) as boolean,
            hoveredSourceId: null as number | null
        }
    },
    computed: {
        // One grid for the header and the rows. Without an alias the name takes 2/3 and the aggregation 1/3.
        cellsTemplate(): string {
            const fields = this.displayedColumns.map((column: any) => column.field)
            const hasAlias = fields.includes('alias')
            // A chart Dimensions table keeps the empty aggregation track, so its names line up with the Values table
            if (!hasAlias && !fields.includes('aggregation')) return 'minmax(0, 2fr) minmax(140px, 1fr)'
            return fields
                .map((field: string) => {
                    if (field === 'aggregation') return hasAlias ? '150px' : 'minmax(140px, 1fr)'
                    if (field === 'columnName' && !hasAlias) return 'minmax(0, 2fr)'
                    return 'minmax(0, 1fr)'
                })
                .join(' ')
        },
        // The aggregation column shows only when a row has an aggregation (a chart Dimensions table has none)
        displayedColumns(): any[] {
            return this.settings.columns.filter((column: any) => column.field !== 'aggregation' || this.rows.some((row: IWidgetColumn) => this.aggregationDropdownIsVisible(column, row) || (!row.formula && row.fieldType !== 'ATTRIBUTE')))
        },
        widgetType(): string {
            return this.widgetModel?.type
        },
        chartType(): string {
            return this.widgetModel?.settings?.chartModel?.model?.chart?.type
        },
        rowReorderEnabled(): boolean {
            return this.widgetModel && (['table', 'html', 'text', 'discovery', 'customchart'].includes(this.widgetModel.type) || this.chartType !== 'heatmap') && this.rows.length > 1
        },
        showSortButton(): boolean {
            if (this.widgetType === 'highcharts' && this.chartType === 'bubble') return this.axis === 'dimensions'
            if (this.widgetType === 'chartJS') return this.widgetModel.settings?.chartModel?.model?.chart?.type !== 'pie'
            return this.widgetType === 'highcharts' || this.widgetType === 'selector'
        },
        descriptorColumnNames(): Set<string> {
            if (this.widgetType !== 'selector') return new Set()
            const names = new Set<string>()
            this.widgetModel.columns.forEach((col: IWidgetColumn) => {
                if ((col as any).descriptionColumn) names.add((col as any).descriptionColumn)
            })
            return names
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
        getIcon(item: IWidgetColumn) {
            return item.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'
        },
        onRowReorder(event: any) {
            // Dragging a single dynamic column must carry its whole group along, kept contiguous.
            const newRows = this.regroupDynamicColumns(event.value as IWidgetColumn[], event.value[event.dropIndex])
            this.rows = newRows
            this.$emit('rowReorder', newRows)
        },
        regroupDynamicColumns(rows: IWidgetColumn[], draggedRow: any): IWidgetColumn[] {
            // Snapshot each group's members in their current internal order.
            const groups: Record<number, IWidgetColumn[]> = {}
            for (const r of this.rows as IWidgetColumn[]) {
                const src = r.dynamicSourceDatasetId
                if (src) (groups[src] = groups[src] || []).push(r)
            }
            if (Object.keys(groups).length === 0) return rows
            // The dragged group anchors on the dragged column; other groups on their first member.
            const draggedSrc = draggedRow?.dynamicSourceDatasetId
            const result: IWidgetColumn[] = []
            const placed = new Set<number>()
            for (const r of rows) {
                const src = r.dynamicSourceDatasetId
                if (!src) {
                    result.push(r)
                    continue
                }
                if (placed.has(src)) continue
                if (src !== draggedSrc || r.id === draggedRow.id) {
                    placed.add(src)
                    result.push(...groups[src])
                }
            }
            return result
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
            if (this.widgetType === 'highcharts' && this.chartType === 'scatter' && !this.store.getHighchartsScatterAttributePresent()) {
                if (tempColumn.fieldType === 'MEASURE') {
                    tempColumn.aggregation = 'NONE'
                } else if (tempColumn.fieldType === 'ATTRIBUTE') {
                    this.store.setHighchartsScatterAttributePresent(true)
                }
            }
            if (['table', 'html', 'text', 'highcharts', 'chartJS', 'discovery', 'customchart', 'python', 'r', 'selector'].includes(this.widgetModel.type)) {
                if (['chartJS', 'highcharts'].includes(this.widgetModel.type)) {
                    if (this.axis) tempColumn.axis = this.axis
                    addChartColumnToTable(tempColumn, this.rows, this.chartType, this.settings.attributesOnly, this.settings.measuresOnly, this.widgetModel)
                } else if (['table', 'python', 'r', 'selector'].includes(this.widgetModel.type) || !this.checkIfColumnIsAlreadyPresent(tempColumn)) this.rows.push(tempColumn as IWidgetColumn)
            } else {
                this.rows = [tempColumn]
            }
            this.$emit('itemAdded', { column: tempColumn, rows: this.rows, settings: this.settings })
        },
        checkIfColumnIsAlreadyPresent(tempColumn: IWidgetColumn) {
            const index = this.rows.findIndex((row: IWidgetColumn) => row.columnName === tempColumn.columnName)
            return index !== -1
        },
        deleteItem(item: any, _index?: number) {
            if ((item as IWidgetColumn).dynamicSourceDatasetId) {
                this.deleteDynamicGroup((item as IWidgetColumn).dynamicSourceDatasetId as number)
                return
            }
            if ((item as IWidgetFunctionColumn).type === 'pythonFunction') {
                for (let i = this.rows.length - 1; i >= 0; i--) {
                    if (this.rows[i].id === item.id || (this.rows[i] as IWidgetFunctionColumn).originalFunctionColumnName === (item as IWidgetFunctionColumn).originalFunctionColumnName) {
                        this.$emit('itemDeleted', this.rows[i])
                        this.rows.splice(i, 1)
                    }
                }
            } else {
                if (this.widgetType === 'highcharts' && this.chartType === 'scatter' && this.store.getHighchartsScatterAttributePresent() && item.fieldType === 'ATTRIBUTE') {
                    this.store.setHighchartsScatterAttributePresent(false)
                }
                const realIdx = this.rows.findIndex((r: IWidgetColumn) => r.id === item.id)
                if (realIdx !== -1) this.rows.splice(realIdx, 1)
                this.$emit('itemDeleted', item)
            }
        },
        deleteDynamicGroup(sourceId: number) {
            for (let i = this.rows.length - 1; i >= 0; i--) {
                if ((this.rows[i] as IWidgetColumn).dynamicSourceDatasetId === sourceId) {
                    this.$emit('itemDeleted', this.rows[i])
                    this.rows.splice(i, 1)
                }
            }
            if (this.widgetModel.dynamicColumnSources) {
                const srcIdx = this.widgetModel.dynamicColumnSources.findIndex((s: any) => s.datasetId === sourceId)
                if (srcIdx !== -1) this.widgetModel.dynamicColumnSources.splice(srcIdx, 1)
            }
        },
        aggregationDropdownIsVisible(column, row: any) {
            return column.field === 'aggregation' && row.type !== 'pythonFunction' && (row.fieldType === 'MEASURE' || ['Y', 'Z'].includes(row.axis)) && this.widgetType !== 'discovery' && !row.formula
        },
        updateSelectedColumn(selectedColumn: IWidgetColumn) {
            const index = this.rows.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === selectedColumn.id)
            if (index !== -1) {
                // this.rows[index] = { ...selectedColumn }
                Object.assign(this.rows[index], selectedColumn)

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
            if (this.settings.attributesOnly || (this.axis && !['Y', 'start'].includes(this.axis))) return
            this.addNewColumnToTheRows(field as IWidgetColumn)
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
        onFunctionsColumnAdded(functionColumn: any) {
            if (this.settings.attributesOnly || (this.axis && !['Y', 'start'].includes(this.axis))) return

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
            this.$emit('itemAdded', { column: column, rows: this.rows, settings: this.settings })
        },
        onFunctionsColumnEdited(functionColumn: any) {
            this.deleteItem(functionColumn, -1)
            this.onFunctionsColumnAdded(functionColumn)
        },
        getRowClass(rowData: any) {
            if (rowData.dynamicSourceDatasetId) {
                return this.hoveredSourceId === rowData.dynamicSourceDatasetId ? 'dynamic-col-row dynamic-col-row--active' : 'dynamic-col-row'
            }
            return this.descriptorColumnNames.has(rowData.columnName) ? 'col-is-descriptor' : ''
        },
        sortIcon(orderType) {
            if (orderType === 'ASC') return 'fas fa-arrow-up-short-wide'
            if (orderType === 'DESC') return 'fas fa-arrow-down-wide-short'
            return 'fas fa-arrows-up-down' // default/no sort
        },
        toggleSort(col) {
            const isMeasure = col.fieldType === 'MEASURE'
            const next = { null: 'ASC', ASC: 'DESC', DESC: null }
            const currentOrder = col.orderType ?? null
            const newOrder = next[currentOrder]

            this.widgetModel.columns.forEach((c: any) => {
                if (c === col) return
                if (isMeasure || c.fieldType === 'MEASURE') c.orderType = null
            })

            col.orderType = newOrder
            this.$emit('itemUpdated', col)
        }
    }
})
</script>

