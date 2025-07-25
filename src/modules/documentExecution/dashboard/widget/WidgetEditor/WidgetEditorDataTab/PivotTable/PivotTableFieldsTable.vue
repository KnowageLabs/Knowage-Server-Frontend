<template>
    <div class="widget-editor-card p-d-flex p-flex-column">
        <div class="p-d-flex p-flex-column">
            <label v-if="settings?.label" class="kn-material-input-label">{{ $t(settings?.label) }}</label>
            <small v-if="settings?.hint">{{ $t(settings?.hint) }}</small>
        </div>

        <div class="p-d-flex p-flex-column kn-flex" :class="{ 'dropzone-active': settings.dropIsActive, ['widget-editor-column-table-invalid']: error && fieldType !== 'filters' }" @drop.stop="onDropComplete($event)" @dragover.prevent @dragenter.prevent @dragleave.prevent>
            <span v-if="settings.dropIsActive && rows.length === 0" class="drag-columns-hint">{{ $t(settings.dragColumnsHint) }}</span>
            <DataTable v-else v-model:filters="filters" :value="rows" class="p-datatable-sm kn-table table-headers-hidden p-m-2" :data-key="settings.dataKey" :global-filter-fields="settings.globalFilterFields" :responsive-layout="'scroll'" :breakpoint="'600px'" @rowReorder="onRowReorder">
                <Column v-if="rowReorderEnabled" :row-reorder="rowReorderEnabled" :style="settings.rowReorder.rowReorderColumnStyle" />
                <Column>
                    <template #body="slotProps">
                        <i :class="getIcon(slotProps.data)"></i>
                    </template>
                </Column>
                <Column v-for="column in settings.columns" :key="column.field" class="kn-truncated" :field="column.field" :header="column.header ? $t(column.header) : ''" :sortable="column.sortable">
                    <template #body="slotProps">
                        <div :style="column.style ?? ''">
                            <InputText v-if="column.field === 'alias'" v-model="slotProps.data[column.field]" class="kn-material-input" @change="onColumnAliasRenamed(slotProps.data)" />
                            <Dropdown v-else-if="column.field === 'aggregation' && aggregationDropdownIsVisible(slotProps.data)" v-model="slotProps.data[column.field]" class="kn-material-input column-aggregation-dropdown" :options="getAggregationOptions(slotProps.data)" option-label="label" option-value="value" @change="$emit('itemUpdated', slotProps.data)" />
                            <span v-else-if="column.field === 'columnName'" class="kn-truncated">{{ '(' + slotProps.data[column.field] + ')' }}</span>
                            <span v-else class="kn-truncated">{{ slotProps.data[column.field] }}</span>
                        </div>
                    </template>
                </Column>
                <Column :style="settings.buttonColumnStyle">
                    <template #body="slotProps">
                        <div>
                            <Button v-if="slotProps.data.formula" v-tooltip.top="$t('common.edit')" icon="fas fa-calculator" class="p-button-link" @click.stop="openCalculatedFieldDialog(slotProps.data)"></Button>
                            <Button v-if="slotProps.data.type === 'pythonFunction'" v-tooltip.top="$t('common.edit')" icon="fas fa-superscript" class="p-button-link" @click.stop="openFunctionsColumnDialog(slotProps.data)"></Button>
                            <Button v-if="fieldType !== 'data'" v-tooltip.top="$t('common.sort')" :icon="getColumnSortIcon(slotProps.data)" class="p-button-link" @click.stop="changeColumnSort(slotProps.data)"></Button>
                            <Button v-tooltip.top="$t('common.edit')" icon="fas fa-cog" class="p-button-link" data-test="edit-button" @click.stop="$emit('itemSelected', slotProps.data)"></Button>
                            <Button v-tooltip.top="$t('common.delete')" icon="pi pi-trash" class="p-button-link" data-test="delete-button" @click.stop="deleteItem(slotProps.data, slotProps.index)"></Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { IWidget, IWidgetColumn, IWidgetFunctionColumn } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import { createNewWidgetColumn } from '../../helpers/WidgetEditorHelpers'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import descriptor from './PivotTableDataContainerDescriptor.json'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'widget-editor-column-table',
    components: { Column, DataTable, Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, items: { type: Array, required: true }, settings: { type: Object, required: true }, fieldType: { type: String }, error: { type: Boolean } },
    emits: ['rowReorder', 'itemUpdated', 'itemSelected', 'itemDeleted', 'itemAdded', 'singleItemReplaced'],
    data() {
        return {
            descriptor,
            commonDescriptor,
            rows: [] as IWidgetColumn[],
            filters: {} as any,
            inputValuesMap: {}
        }
    },
    computed: {
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
        this.setFilters()
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
            emitter.on('addNewFunctionColumn', this.onFunctionsColumnAdded)
            emitter.on('functionColumnEdited', this.onFunctionsColumnEdited)
        },
        onSelectedColumnUpdated(column: any) {
            this.updateSelectedColumn(column)
        },
        loadItems() {
            this.rows = this.items as IWidgetColumn[]
        },
        setFilters() {
            if (this.settings?.globalFilterFields?.length) this.filters.global = [filterDefault]
        },
        getIcon(item: IWidgetColumn) {
            return item.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'
        },
        onRowReorder(event: any) {
            this.rows = event.value
            this.$emit('rowReorder', { fields: event.value, fieldType: this.fieldType })
        },
        onDropComplete(event: any) {
            if (event.dataTransfer.getData('text/plain') === 'b') return
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
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
        deleteItem(item: IWidgetColumn, index: number) {
            this.rows.splice(index, 1)
            this.$emit('itemDeleted', item)
        },
        aggregationDropdownIsVisible(row: any) {
            return row.fieldType === 'MEASURE' && this.widgetType !== 'discovery'
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
        getColumnSortIcon(column: IWidgetColumn) {
            switch (column.sort) {
                case 'ASC':
                    return 'fa-solid fa-arrow-up-short-wide'
                case 'DESC':
                    return 'fa-solid fa-arrow-down-short-wide'
                default:
                    return 'fa-solid fa-bars'
            }
        },
        changeColumnSort(column: IWidgetColumn) {
            column.sort = column.sort === 'ASC' ? 'DESC' : 'ASC'
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
            this.deleteItem(functionColumn, -1)
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

<style lang="scss" scoped>
.drag-columns-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1;
}
.table-headers-hidden {
    ::v-deep(.p-datatable-header) {
        display: none;
    }
}
.column-aggregation-dropdown {
    min-width: 200px;
    max-width: 400px;
}
.widget-editor-column-table-invalid {
    border: 1.5px dashed red !important;
}
</style>
