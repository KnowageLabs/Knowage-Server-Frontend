<template>
    <div v-if="widgetModel" class="p-d-flex p-flex-column">
        <WidgetEditorColumnTable
            v-for="axis in ['from', 'to']"
            :key="axis"
            class="p-m-2"
            :class="{ 'p-order-1': axis === 'from', 'p-order-3': axis === 'to' }"
            :widget-model="widgetModel"
            :items="columnTableItems[axis] ?? []"
            :settings="getAttributesAxisSettings(axis)"
            :chart-type="chartType"
            :axis="axis"
            :error="isAxisTableInvalid(axis)"
            @rowReorder="onColumnsReorder($event, axis)"
            @itemAdded="onColumnAdded($event, axis)"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, axis)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <WidgetEditorColumnTable
            class="p-m-2 p-order-5"
            :widget-model="widgetModel"
            :items="columnTableItems['MEASURES'] ?? []"
            :settings="valuesColumnSettings"
            :chart-type="chartType"
            :error="isMeasureTableInvalid()"
            @rowReorder="onColumnsReorder($event, 'MEASURES')"
            @itemAdded="onColumnAdded($event, null)"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, null)"
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
    name: 'highcharts-sankey-data-container',
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
        valuesColumnSettings() {
            switch (this.chartType) {
                case 'dependencywheel':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sankeyChartColumnTableSettings[2] }
                case 'streamgraph':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.streamgraphChartColumnTableSettings[2] }
                case 'packedbubble':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.packedBubbleChartColumnTableSettings[2] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sankeyChartColumnTableSettings[2] }
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
            this.columnTableItems['MEASURES'] = []
            this.columnTableItems['from'] = []
            this.columnTableItems['to'] = []
            this.widgetModel.columns.forEach((column: IWidgetColumn, index: number) => {
                let type = 'MEASURES'
                if (column.fieldType === 'ATTRIBUTE') type = index === 0 ? 'from' : 'to'
                this.columnTableItems[type].push(column)
            })
        },
        getAttributesAxisSettings(axis: string) {
            switch (this.chartType) {
                case 'dependencywheel':
                    return axis === 'from' ? { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sankeyChartColumnTableSettings[0] } : { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sankeyChartColumnTableSettings[1] }
                case 'streamgraph':
                    return axis === 'from' ? { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.streamgraphChartColumnTableSettings[0] } : { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.streamgraphChartColumnTableSettings[1] }
                case 'packedbubble':
                    return axis === 'from' ? { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.packedBubbleChartColumnTableSettings[0] } : { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.packedBubbleChartColumnTableSettings[1] }
                default:
                    return axis === 'from' ? { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sankeyChartColumnTableSettings[0] } : { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sankeyChartColumnTableSettings[1] }
            }
        },
        onColumnsReorder(columns: IWidgetColumn[], type: string) {
            this.columnTableItems[type] = columns
            this.widgetModel.columns = this.columnTableItems['from'].concat(this.columnTableItems['to']).concat(this.columnTableItems['MEASURES'])
            emitter.emit('columnsReordered', this.widgetModel.columns)
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        },
        onColumnAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[]; settings: any }, axis: string | null) {
            if (!payload.rows) this.columnTableItems['MEASURES'] = [payload]
            else {
                const type = axis ?? 'MEASURES'
                this.columnTableItems[type] = payload.rows
            }
            this.updateWidgetColumns()
        },
        updateWidgetColumns() {
            this.widgetModel.columns = this.columnTableItems['from'].concat(this.columnTableItems['to']).concat(this.columnTableItems['MEASURES'])
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
                this.formFlexOrder = axis === 'from' ? 1 : 3
            } else {
                this.formFlexOrder = 5
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
            const type = column.axis ? column.axis : 'MEASURES'
            const index = this.columnTableItems[type].findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) this.columnTableItems[type].splice(index, 1)
        },
        isAxisTableInvalid(axis: string) {
            let invalid = false
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            switch (axis) {
                case 'from':
                case 'to':
                    invalid = this.isAttributesTableInvalid(axis)
                    break
                default:
                    invalid = false
            }
            return invalid
        },
        isAttributesTableInvalid(type: 'from' | 'to') {
            let invalid = false
            if (this.columnTableItems[type].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'dependencywheel':
                    case 'sankey':
                    case 'streamgraph':
                        invalid = this.columnTableItems[type].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            type === 'from' ? (this.widgetModel.invalid.xAxisInvalid = invalid) : (this.widgetModel.invalid.yAxisInvalid = invalid)
            return invalid
        },
        isMeasureTableInvalid() {
            let invalid = false
            if (this.columnTableItems['MEASURES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'dependencywheel':
                    case 'sankey':
                    case 'streamgraph':
                        invalid = this.columnTableItems['MEASURES'].length !== 1
                        break
                    default:
                        invalid = false
                }
            }
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            this.widgetModel.invalid.measuresInvalid = invalid
            return invalid
        }
    }
})
</script>
