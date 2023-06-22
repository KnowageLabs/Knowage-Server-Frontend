<template>
    <div v-if="widgetModel" class="p-d-flex p-flex-column">
        <WidgetEditorColumnTable
            v-if="['pie', 'heatmap', 'radar', 'column', 'bubble', 'scatter', 'line', 'treemap', 'sunburst'].includes(chartType)"
            class="p-m-2 p-order-1"
            :widget-model="widgetModel"
            :items="columnTableItems['ATTRIBUTES'] ?? []"
            :settings="columnTableSettings"
            :chart-type="chartType"
            :error="isAttributesTableInvalid()"
            @rowReorder="onColumnsReorder($event, 'ATTRIBUTES')"
            @itemAdded="onColumnAdded($event, null)"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, null)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <WidgetEditorColumnTable
            v-for="axis in ['Y', 'X', 'Z']"
            :key="axis"
            class="p-m-2"
            :class="{ 'p-order-3': axis === 'Y', 'p-order-5': axis === 'X', 'p-order-6': axis === 'Z' }"
            :widget-model="widgetModel"
            :items="columnTableItems[axis] ?? []"
            :settings="getValuesAxisSettings(axis)"
            :chart-type="chartType"
            :axis="axis"
            :error="isAxisTableInvalid(axis)"
            @rowReorder="onColumnsReorder($event, axis)"
            @itemAdded="onColumnAdded($event, axis)"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, axis)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <ChartWidgetColumnForm class="p-m-2" :style="{ order: formFlexOrder }" :widget-model="widgetModel" :selected-column="selectedColumn" :chart-type="chartType"></ChartWidgetColumnForm>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { removeSerieFromWidgetModel } from '../../../helpers/chartWidget/highcharts/HighchartsDataTabHelpers'
import descriptor from '../../TableWidget/TableWidgetDataDescriptor.json'
import highchartDescriptor from './HighchartsDataContainerDescriptor.json'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import WidgetEditorColumnTable from '../../common/WidgetEditorColumnTable.vue'
import ChartWidgetColumnForm from '../common/ChartWidgetColumnForm.vue'

export default defineComponent({
    name: 'highcharts-bubble-data-container',
    components: { WidgetEditorColumnTable, ChartWidgetColumnForm },
    props: {
        propWidgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedDataset: { type: Object as PropType<IDataset | null> }
    },
    data() {
        return {
            descriptor,
            widgetModel: {} as IWidget,
            highchartDescriptor,
            commonDescriptor,
            columnTableItems: {} as any,
            selectedColumn: null as IWidgetColumn | null,
            formFlexOrder: 4
        }
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
        },
        columnTableSettings() {
            return {
                ...commonDescriptor.columnTableSettings,
                ...highchartDescriptor.bubbleChartColumnTableSettings[0]
            }
        }
    },
    watch: {
        propWidgetModel() {
            this.loadWidgetModel()
        },
        selectedDataset() {
            this.selectedColumn = null
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidgetModel()
        this.loadColumnTableItems()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('reloadChartColumns', this.loadColumnTableItems)
        },
        removeEventListeners() {
            emitter.off('reloadChartColumns', this.loadColumnTableItems)
        },

        loadWidgetModel() {
            this.widgetModel = this.propWidgetModel
            this.loadColumnTableItems()
        },
        loadColumnTableItems() {
            this.columnTableItems = []
            this.columnTableItems['ATTRIBUTES'] = []
            this.columnTableItems['Y'] = []
            this.columnTableItems['X'] = []
            this.columnTableItems['Z'] = []
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                const type = column.axis ? column.axis : 'ATTRIBUTES'
                this.columnTableItems[type].push(column)
            })
        },
        getValuesAxisSettings(axis: string) {
            switch (axis) {
                case 'Y':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.bubbleChartColumnTableSettings[1] }
                case 'Z':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.bubbleChartColumnTableSettings[3] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.bubbleChartColumnTableSettings[2] }
            }
        },
        onColumnsReorder(columns: IWidgetColumn[], type: string) {
            this.columnTableItems[type] = columns
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['Y']).concat(this.columnTableItems['X']).concat(this.columnTableItems['Z'])
            emitter.emit('columnsReordered', this.widgetModel.columns)
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        },
        onColumnAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[]; settings: any }, axis: string | null) {
            if (!payload.rows) this.columnTableItems['Y'] = [payload]
            else {
                const type = axis ?? 'ATTRIBUTES'
                this.columnTableItems[type] = payload.rows
            }
            this.updateWidgetColumns()
        },
        updateWidgetColumns() {
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['Y']).concat(this.columnTableItems['X']).concat(this.columnTableItems['Z'])
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        },
        onColumnItemUpdate(column: IWidgetColumn) {
            const index = this.widgetModel.columns.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) {
                this.widgetModel.columns[index] = { ...column }
                emitter.emit('refreshWidgetWithData', this.widgetModel.id)
                if (this.widgetModel.columns[index].id === this.selectedColumn?.id) this.selectedColumn = { ...this.widgetModel.columns[index] }
            }
        },
        setSelectedColumn(column: IWidgetColumn, axis: string | null) {
            this.formFlexOrder = this.getFormFlexOrder(axis)
            this.selectedColumn = { ...column }
        },
        getFormFlexOrder(axis: string | null) {
            switch (axis) {
                case 'Y':
                    return 4
                case 'X':
                    return 5
                case 'Z':
                    return 7
                default:
                    return 2
            }
        },
        onColumnDelete(column: IWidgetColumn) {
            const index = this.widgetModel.columns.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) {
                this.widgetModel.columns.splice(index, 1)
                if (column.id === this.selectedColumn?.id) this.selectedColumn = null
                this.removeColumnFromColumnTableItems(column)
                removeSerieFromWidgetModel(this.widgetModel, column, this.chartType)
                emitter.emit('refreshWidgetWithData', this.widgetModel.id)
            }
        },
        removeColumnFromColumnTableItems(column: IWidgetColumn) {
            const type = column.axis ? column.axis : 'ATTRIBUTES'
            const index = this.columnTableItems[type].findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) this.columnTableItems[type].splice(index, 1)
        },
        isAttributesTableInvalid() {
            let invalid = false
            if (this.columnTableItems['ATTRIBUTES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'bubble':
                        invalid = this.widgetModel.settings?.configuration?.splitting && this.columnTableItems['ATTRIBUTES'].length !== 2
                        break
                    default:
                        invalid = false
                }
            }
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            this.widgetModel.invalid.attributesInvalid = invalid
            return invalid
        },
        isAxisTableInvalid(axis: string) {
            let invalid = false
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            switch (axis) {
                case 'X':
                    invalid = this.isXAxisTableInvalid()
                    break
                case 'Y':
                    invalid = this.isYAxisTableInvalid()
                    break
                case 'Z':
                    invalid = this.isZAxisTableInvalid()
                    break
                default:
                    invalid = false
            }
            return invalid
        },
        isXAxisTableInvalid() {
            let invalid = false
            if (this.columnTableItems['X'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'bubble':
                        invalid = this.columnTableItems['X'].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            this.widgetModel.invalid.xAxisInvalid = invalid
            return invalid
        },
        isYAxisTableInvalid() {
            const invalid = this.columnTableItems['Y'].length === 0
            this.widgetModel.invalid.yAxisInvalid = invalid
            return invalid
        },
        isZAxisTableInvalid() {
            let invalid = false
            if (this.columnTableItems['Z'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'bubble':
                        invalid = this.columnTableItems['Z'].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            this.widgetModel.invalid.zAxisInvalid = invalid
            return invalid
        }
    }
})
</script>
