<template>
    <div v-if="widgetModel" class="p-d-flex p-flex-column">
        <WidgetEditorColumnTable
            class="p-m-2 p-order-1"
            :widget-model="widgetModel"
            :items="columnTableItems['ATTRIBUTES'] ?? []"
            :settings="attributesColumnSettings"
            :chart-type="chartType"
            :error="isAttributesTableInvalid()"
            @rowReorder="onColumnsReorder($event, 'ATTRIBUTES')"
            @itemAdded="onColumnAdded"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, null)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <WidgetEditorColumnTable
            v-for="axis in ['start', 'end']"
            :key="axis"
            class="p-m-2"
            :class="{ 'p-order-3': axis === 'start', 'p-order-5': axis === 'end' }"
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
    name: 'highcharts-dumbbell-data-container',
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
            formFlexOrder: 5
        }
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
        },
        attributesColumnSettings() {
            switch (this.chartType) {
                case 'dumbbell':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.dumbbellChartColumnTableSettings[0] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.dumbbellChartColumnTableSettings[0] }
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
            this.columnTableItems['start'] = []
            this.columnTableItems['end'] = []
            this.widgetModel.columns.forEach((column: IWidgetColumn, index: number) => {
                let type = 'ATTRIBUTES'
                if (column.fieldType === 'MEASURE') type = index === 1 ? 'start' : 'end'
                this.columnTableItems[type].push(column)
            })
        },
        getValuesAxisSettings(axis: string) {
            switch (axis) {
                case 'start':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.dumbbellChartColumnTableSettings[1] }
                case 'end':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.dumbbellChartColumnTableSettings[2] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.dumbbellChartColumnTableSettings[1] }
            }
        },
        onColumnsReorder(columns: IWidgetColumn[], type: string) {
            this.columnTableItems[type] = columns
            this.widgetModel.columns = this.columnTableItems['MEASURES'].concat(this.columnTableItems['start']).concat(this.columnTableItems['end'])
            emitter.emit('columnsReordered', this.widgetModel.columns)
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        },
        onColumnAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[]; settings: any }, axis: string | null) {
            if (!payload.rows) this.columnTableItems['ATTRIBUTES'] = [payload]
            else {
                const type = axis ?? 'ATTRIBUTES'
                this.columnTableItems[type] = payload.rows
            }
            this.updateWidgetColumns()
        },
        updateWidgetColumns() {
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['start']).concat(this.columnTableItems['end'])
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
            if (axis) {
                this.formFlexOrder = axis === 'start' ? 3 : 5
            } else {
                this.formFlexOrder = 1
            }
            this.selectedColumn = { ...column }
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
        isAxisTableInvalid(axis: string) {
            let invalid = false
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            switch (axis) {
                case 'start':
                case 'end':
                    invalid = this.isMeasuresTableInvalid(axis)
                    break
                default:
                    invalid = false
            }
            return invalid
        },
        isMeasuresTableInvalid(type: 'start' | 'end') {
            let invalid = false
            if (this.columnTableItems[type].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'dumbbell':
                        invalid = this.columnTableItems[type].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            type === 'start' ? (this.widgetModel.invalid.xAxisInvalid = invalid) : (this.widgetModel.invalid.yAxisInvalid = invalid)
            return invalid
        },
        isAttributesTableInvalid() {
            let invalid = false
            if (this.columnTableItems['ATTRIBUTES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'dumbbell':
                        invalid = this.columnTableItems['ATTRIBUTES'].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            this.widgetModel.invalid.attributesInvalid = invalid
            return invalid
        }
    }
})
</script>
