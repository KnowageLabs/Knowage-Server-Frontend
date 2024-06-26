<template>
    <div v-if="widget" class="p-d-flex p-flex-column">
        <WidgetEditorColumnTable
            class="p-m-2 p-order-1"
            :widget-model="widget"
            :items="columnTableItems['ATTRIBUTES'] ?? []"
            :settings="{ ...commonDescriptor.columnTableSettings, ...chartJSDescriptor.pieChartColumnTableSettings[0] }"
            :error="isAttributesTableInvalid()"
            @rowReorder="onColumnsReorder"
            @itemAdded="onColumnAdded"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, 2)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <WidgetEditorColumnTable
            class="p-m-2 p-order-3"
            :widget-model="widget"
            :items="columnTableItems['MEASURES'] ?? []"
            :settings="{ ...commonDescriptor.columnTableSettings, ...chartJSDescriptor.pieChartColumnTableSettings[1] }"
            :error="isMeasureTableInvalid()"
            @itemAdded="onColumnAdded"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, 4)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <ChartWidgetColumnForm class="p-m-2" :style="{ order: formFlexOrder }" :widget-model="widget" :selected-column="selectedColumn" :chart-type="'pie'"></ChartWidgetColumnForm>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '../../../../../DashboardHelpers'
import { IDataset, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from '../../TableWidget/TableWidgetDataDescriptor.json'
import chartJSDescriptor from './ChartJSDataContainerDescriptor.json'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import WidgetEditorColumnTable from '../../common/WidgetEditorColumnTable.vue'
import ChartWidgetColumnForm from '../common/ChartWidgetColumnForm.vue'

export default defineComponent({
    name: 'chart-js-widget-pie-chart-data-container',
    components: { WidgetEditorColumnTable, ChartWidgetColumnForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
    data() {
        return {
            descriptor,
            widget: {} as IWidget,
            chartJSDescriptor,
            commonDescriptor,
            columnTableItems: {} as any,
            selectedColumn: null as IWidgetColumn | null,
            formFlexOrder: 4
        }
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
        }
    },
    watch: {
        selectedDataset() {
            this.selectedColumn = null
            this.clearSelectedWidgetColumnsFromWidgetModel()
        }
    },
    async created() {
        this.loadWidget()
        this.$watch('widget.columns', () => this.loadColumnTableItems())
        this.loadColumnTableItems()
    },
    methods: {
        loadWidget() {
            this.widget = this.widgetModel
        },
        loadColumnTableItems() {
            this.columnTableItems = []
            this.columnTableItems['ATTRIBUTES'] = []
            this.columnTableItems['MEASURES'] = []
            this.widget.columns.forEach((column: IWidgetColumn) => {
                const type = column.fieldType == 'MEASURE' ? 'MEASURES' : 'ATTRIBUTES'
                this.columnTableItems[type].push(column)
            })
        },
        onColumnsReorder(columns: IWidgetColumn[]) {
            this.columnTableItems['ATTRIBUTES'] = columns
            this.widget.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['MEASURES'])
            emitter.emit('columnsReordered', this.widget.columns)
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        onColumnAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[]; settings: any }) {
            if (!payload.rows) this.columnTableItems['MEASURES'] = [payload]
            else {
                const type = payload.settings?.measuresOnly ? 'MEASURES' : 'ATTRIBUTES'
                this.columnTableItems[type] = payload.rows
            }
            this.updateWidgetColumns()
        },
        updateWidgetColumns() {
            this.widget.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['MEASURES'])
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        onColumnItemUpdate(column: IWidgetColumn) {
            const index = this.widget.columns.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) {
                this.widget.columns[index] = { ...column }
                emitter.emit('refreshWidgetWithData', this.widget.id)
                if (this.widget.columns[index].id === this.selectedColumn?.id) this.selectedColumn = { ...this.widget.columns[index] }
            }
        },
        setSelectedColumn(column: IWidgetColumn, formFlexOrder: number) {
            this.formFlexOrder = formFlexOrder
            this.selectedColumn = { ...column }
        },
        onColumnDelete(column: IWidgetColumn) {
            const index = this.widget.columns.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) {
                this.widget.columns.splice(index, 1)
                if (column.id === this.selectedColumn?.id) this.selectedColumn = null
                this.removeColumnFromColumnTableItems(column)
                emitter.emit('refreshWidgetWithData', this.widget.id)
            }
        },
        removeColumnFromColumnTableItems(column: IWidgetColumn) {
            const type = column.fieldType == 'MEASURE' ? 'MEASURES' : 'ATTRIBUTES'
            const index = this.columnTableItems[type].findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) this.columnTableItems[type].splice(index, 1)
        },
        isAttributesTableInvalid() {
            let invalid = false
            if (this.columnTableItems['ATTRIBUTES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'bar':
                    case 'line':
                    case 'pie':
                        invalid = this.columnTableItems['ATTRIBUTES'].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            if (!this.widget.invalid) this.widget.invalid = {}
            this.widget.invalid.attributesInvalid = invalid
            return invalid
        },
        isMeasureTableInvalid() {
            let invalid = false
            if (this.columnTableItems['MEASURES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'pie':
                        invalid = this.columnTableItems['MEASURES'].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            if (!this.widget.invalid) this.widget.invalid = {}
            this.widget.invalid.measuresInvalid = invalid
            return invalid
        },
        clearSelectedWidgetColumnsFromWidgetModel() {
            for (let i = this.widgetModel.columns.length - 1; i >= 0; i--) {
                this.widgetModel.columns.forEach((column: IWidgetColumn) => this.onColumnDelete(column))
            }
        }
    }
})
</script>
