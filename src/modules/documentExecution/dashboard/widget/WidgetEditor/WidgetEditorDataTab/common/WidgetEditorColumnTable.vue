<template>
    <q-card :class="{ ['widget-editor-column-table-invalid']: error, 'dropzone-active': listDragActive }" flat bordered>
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title v-if="settings.label">{{ $t(settings.label) }}</q-toolbar-title>
            <Button v-if="settings.hint" v-tooltip.left="$t(settings.hint)" icon="pi pi-question-circle" class="p-button-text p-button-plain" />
        </q-toolbar>
        <q-card-section class="p-p-0">
            <div @drop.stop="onDropComplete($event)" @dragover.prevent @dragenter.prevent @dragleave.prevent>
                <InlineMessage v-if="settings.dropIsActive && rows.length === 0" class="p-d-flex p-flex-row p-jc-center p-ai-center p-m-3" severity="info" closable="false">{{ $t(settings.dragColumnsHint) }}</InlineMessage>
                <DataTable v-else :value="rows" v-model:expandedRows="expandedRows" class="kn-table p-datatable-sm editor-col-table" :data-key="settings.dataKey" collapsedRowIcon="fas fa-cog" expandedRowIcon="fas fa-cog" responsiveLayout="scroll" breakpoint="940px" @rowReorder="onRowReorder">
                    <Column v-if="rowReorderEnabled" :row-reorder="rowReorderEnabled" style="padding-top: 5px" :style="settings.rowReorder.rowReorderColumnStyle" />
                    <Column v-if="widgetModel.type !== 'highcharts' && widgetModel.type !== 'chartJS'" :style="settings.rowReorder.rowReorderColumnStyle">
                        <template #body="slotProps">
                            <i :class="getIcon(slotProps.data)"></i>
                        </template>
                    </Column>
                    <Column v-for="column in settings.columns" :key="column.field" class="kn-truncated p-pl-2" :field="column.field" :header="column.header ? $t(column.header) : ''" :sortable="column.sortable">
                        <template #body="slotProps">
                            <q-input v-if="column.field === 'alias'" :label="$t('common.alias')" v-model="slotProps.data[column.field]" dense square :disable="slotProps.data.type === 'pythonFunction'" @change="onColumnAliasRenamed(slotProps.data)" />
                            <q-select v-else-if="aggregationDropdownIsVisible(column, slotProps.data)" v-model="slotProps.data[column.field]" :options="commonDescriptor.columnAggregationOptions" emitValue dense option-label="label" option-value="value" @update:model-value="$emit('itemUpdated', slotProps.data)" />
                            <q-input v-else-if="column.field === 'columnName'" :label="$t('components.knCalculatedField.columnName')" v-model="slotProps.data[column.field]" dense square readonly @change="onColumnAliasRenamed(slotProps.data)" />
                            <span v-else-if="!slotProps.data.formula && column.field !== 'columnName'" class="kn-truncated 2">{{ slotProps.data[column.field] }}</span>
                        </template>
                    </Column>
                    <Column :style="settings.buttonColumnStyle">
                        <template #body="slotProps">
                            <Button v-if="slotProps.data.formula" v-tooltip.top="$t('common.edit')" icon="fas fa-calculator" class="p-button-link" @click.stop="openCalculatedFieldDialog(slotProps.data)"></Button>
                            <Button v-if="slotProps.data.type === 'pythonFunction'" v-tooltip.top="$t('common.edit')" icon="fas fa-superscript" class="p-button-link" @click.stop="openFunctionsColumnDialog(slotProps.data)"></Button>
                        </template>
                    </Column>
                    <Column expander style="width: 10px" />
                    <Column style="width: 10px">
                        <template #body="slotProps">
                            <Button v-tooltip.top="$t('common.delete')" icon="pi pi-trash" class="p-button-link" data-test="delete-button" @click.stop="deleteItem(slotProps.data, slotProps.index)"></Button>
                        </template>
                    </Column>
                    <template #expansion="slotProps">
                        <ChartWidgetColumnForm v-if="widgetType === 'highcharts' || widgetType === 'chartjs'" :widget-model="widgetModel" :selected-column="slotProps.data" :chart-type="chartType"></ChartWidgetColumnForm>
                        <TableWidgetColumnForm v-else :widget-model="widgetModel" :selected-column="slotProps.data"></TableWidgetColumnForm>
                    </template>
                </DataTable>
            </div>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IWidget, IWidgetColumn, IWidgetFunctionColumn } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import { addChartColumnToTable } from '../../helpers/chartWidget/ChartWidgetDataTabHelpers'
import { createNewWidgetColumn } from '../../helpers/WidgetEditorHelpers'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import deepcopy from 'deepcopy'
import InlineMessage from 'primevue/inlinemessage'
import ChartWidgetColumnForm from '../ChartWidget/common/ChartWidgetColumnForm.vue'
import TableWidgetColumnForm from '../TableWidget/TableWidgetColumnForm.vue'

export default defineComponent({
    name: 'widget-editor-column-table',
    components: { Column, DataTable, Dropdown, InlineMessage, ChartWidgetColumnForm, TableWidgetColumnForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, items: { type: Array, required: true }, settings: { type: Object, required: true }, chartType: { type: String }, axis: { type: String }, error: { type: Boolean } },
    emits: ['rowReorder', 'itemUpdated', 'itemDeleted', 'itemAdded', 'singleItemReplaced'],
    data() {
        return {
            commonDescriptor,
            rows: [] as IWidgetColumn[],
            inputValuesMap: {},
            listDragActive: inject('listDragActive', false) as boolean,
            expandedRows: [],
            products: [
                {
                    id: '1000',
                    code: 'f230fh0g3',
                    name: 'Bamboo Watch',
                    description: 'Product Description',
                    image: 'bamboo-watch.jpg',
                    price: 65,
                    category: 'Accessories',
                    quantity: 24,
                    inventoryStatus: 'INSTOCK',
                    rating: 5,
                    orders: [
                        {
                            id: '1000-0',
                            productCode: 'f230fh0g3',
                            date: '2020-09-13',
                            amount: 65,
                            quantity: 1,
                            customer: 'David James',
                            status: 'PENDING'
                        }
                    ]
                }
            ]
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel?.type
        },
        rowReorderEnabled(): boolean {
            return this.widgetModel && (['table', 'html', 'text', 'discovery', 'customchart'].includes(this.widgetModel.type) || this.chartType !== 'heatmap') && this.rows.length > 1
        },
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
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
        console.log('settings', this.settings)
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
        getIcon(item: IWidgetColumn) {
            return item.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'
        },
        onRowReorder(event: any) {
            this.rows = event.value
            this.$emit('rowReorder', event.value)
        },
        onDropComplete(event: any) {
            if (event.dataTransfer.getData('text/plain') === 'b') return
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
            const tempColumn = createNewWidgetColumn(eventData, this.widgetType)
            if (['table', 'html', 'text', 'highcharts', 'chartJS', 'discovery', 'customchart', 'vega', 'python', 'r'].includes(this.widgetModel.type)) {
                if (['chartJS', 'highcharts', 'vega'].includes(this.widgetModel.type)) {
                    if (this.axis) tempColumn.axis = this.axis
                    addChartColumnToTable(tempColumn, this.rows, this.chartType, this.settings.attributesOnly, this.settings.measuresOnly, this.widgetModel)
                } else if (['table', 'python', 'r'].includes(this.widgetModel.type) || !this.checkIfColumnIsAlreadyPresent(tempColumn)) this.rows.push(tempColumn as IWidgetColumn)
            } else {
                this.rows = [tempColumn]
            }
            this.$emit('itemAdded', { column: tempColumn, rows: this.rows, settings: this.settings })
        },
        checkIfColumnIsAlreadyPresent(tempColumn: IWidgetColumn) {
            const index = this.rows.findIndex((row: IWidgetColumn) => row.columnName === tempColumn.columnName)
            return index !== -1
        },
        deleteItem(item: IWidgetColumn | IWidgetFunctionColumn, index: number) {
            if ((item as IWidgetFunctionColumn).type === 'pythonFunction') {
                for (let i = this.rows.length - 1; i >= 0; i--) {
                    if (this.rows[i].id === item.id || (this.rows[i] as IWidgetFunctionColumn).originalFunctionColumnName === (item as IWidgetFunctionColumn).originalFunctionColumnName) {
                        this.$emit('itemDeleted', this.rows[i])
                        this.rows.splice(i, 1)
                    }
                }
            } else {
                this.rows.splice(index, 1)
                this.$emit('itemDeleted', item)
            }
        },
        aggregationDropdownIsVisible(column, row: any) {
            return column.field === 'aggregation' && row.type !== 'pythonFunction' && (row.fieldType === 'MEASURE' || ['Y', 'Z'].includes(row.axis)) && this.widgetType !== 'discovery' && !row.formula
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
        testMe(event) {
            console.log('itemUpdated', event)
        }
    }
})
</script>

<style lang="scss" scoped>
.editor-col-table {
    :deep(.p-datatable-thead) {
        display: none;
    }
    :deep(.p-datatable-row-expansion > td) {
        padding: 0px !important;
    }
}

#drag-columns-hint {
    min-height: 200px;
    min-width: 200px;
}

.column-aggregation-dropdown {
    min-width: 200px;
    max-width: 400px;
}

.widget-editor-column-table-invalid {
    border: 1px solid rgba(255, 0, 0, 0.61);
    border-radius: 0px 0px 6px 6px;
    box-shadow: 0px 0px 3px 1px rgba(255, 0, 0, 0.637) !important;
}
</style>
