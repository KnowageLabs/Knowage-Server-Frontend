<template>
    <div v-if="widgetModel" class="p-d-flex p-flex-column">
        <WidgetEditorColumnTable
            v-if="['pie', 'heatmap', 'radar', 'area', 'bar', 'column', 'bubble', 'scatter', 'line', 'treemap', 'sunburst', 'spline', 'pictorial', 'funnel', 'waterfall'].includes(chartType)"
            class="p-m-2 p-order-1"
            :widget-model="widgetModel"
            :items="columnTableItems['ATTRIBUTES'] ?? []"
            :settings="columnTableSettings"
            :chart-type="chartType"
            :error="isAttributesTableInvalid()"
            @rowReorder="onColumnsReorder($event, 'ATTRIBUTES')"
            @itemAdded="onColumnAdded"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, 2)"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <WidgetEditorColumnTable
            class="p-m-2 p-order-3"
            :widget-model="widgetModel"
            :items="columnTableItems['MEASURES'] ?? []"
            :settings="valuesColumnSettings"
            :chart-type="chartType"
            :error="isMeasureTableInvalid()"
            @rowReorder="onColumnsReorder($event, 'MEASURES')"
            @itemAdded="onColumnAdded"
            @itemUpdated="onColumnItemUpdate"
            @itemSelected="setSelectedColumn($event, 4)"
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
    name: 'highcharts-widget-common-data-container',
    components: { WidgetEditorColumnTable, ChartWidgetColumnForm },
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
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
            switch (this.chartType) {
                case 'pie':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pieChartColumnTableSettings[0] }
                case 'heatmap':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.heatmapColumnTableSettings[0] }
                case 'radar':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.radarColumnTableSettings[0] }
                case 'area':
                case 'bar':
                case 'column':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.barChartColumnTableSettings[0] }
                case 'bubble':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.bubbleChartColumnTableSettings[0] }
                case 'scatter':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.scatterChartColumnTableSettings[0] }
                case 'line':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.lineChartColumnTableSettings[0] }
                case 'treemap':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.treemapChartColumnTableSettings[0] }
                case 'sunburst':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sunburstChartColumnTableSettings[0] }
                case 'spline':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.splineChartColumnTableSettings[0] }
                case 'pictorial':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pictorialChartColumnTableSettings[0] }
                case 'funnel':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pictorialChartColumnTableSettings[0] }
                case 'waterfall':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.waterfallChartColumnTableSettings[0] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pieChartColumnTableSettings[0] }
            }
        },
        valuesColumnSettings() {
            switch (this.chartType) {
                case 'pie':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pieChartColumnTableSettings[1] }
                case 'gauge':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.gaugeChartColumnTableSettings[0] }
                case 'activitygauge':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.activitygaugeChartColumnTableSettings[0] }
                case 'solidgauge':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.solidgaugeChartColumnTableSettings[0] }
                case 'heatmap':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.heatmapColumnTableSettings[1] }
                case 'radar':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.radarColumnTableSettings[1] }
                case 'area':
                case 'bar':
                case 'column':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.barChartColumnTableSettings[1] }
                case 'bubble':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.bubbleChartColumnTableSettings[1] }
                case 'scatter':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.scatterChartColumnTableSettings[1] }
                case 'line':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.lineChartColumnTableSettings[1] }
                case 'treemap':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.treemapChartColumnTableSettings[1] }
                case 'sunburst':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.sunburstChartColumnTableSettings[1] }
                case 'spline':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.splineChartColumnTableSettings[1] }
                case 'pictorial':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pictorialChartColumnTableSettings[1] }
                case 'funnel':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.pictorialChartColumnTableSettings[1] }
                case 'waterfall':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.waterfallChartColumnTableSettings[1] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.gaugeChartColumnTableSettings[1] }
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
            this.columnTableItems['MEASURES'] = []
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                const type = column.fieldType == 'MEASURE' ? 'MEASURES' : 'ATTRIBUTES'
                this.columnTableItems[type].push(column)
            })
        },
        onColumnsReorder(columns: IWidgetColumn[], type: 'ATTRIBUTES' | 'MEASURES') {
            this.columnTableItems[type] = columns
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['MEASURES'])
            emitter.emit('columnsReordered', this.widgetModel.columns)
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
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
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['MEASURES'])
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
        setSelectedColumn(column: IWidgetColumn, formFlexOrder: number) {
            this.formFlexOrder = formFlexOrder
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
            const type = column.fieldType == 'MEASURE' ? 'MEASURES' : 'ATTRIBUTES'
            const index = this.columnTableItems[type].findIndex((tempColumn: IWidgetColumn) => tempColumn.id === column.id)
            if (index !== -1) this.columnTableItems[type].splice(index, 1)
        },
        isAttributesTableInvalid() {
            let invalid = false
            if (this.columnTableItems['ATTRIBUTES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'area':
                    case 'bar':
                    case 'column':
                    case 'line':
                        invalid =
                            (this.widgetModel.settings.configuration?.grouping?.enabled && this.columnTableItems['ATTRIBUTES'].length !== 2) ||
                            (this.widgetModel.settings.configuration?.grouping?.secondSeries.enabled && this.columnTableItems['ATTRIBUTES'].length !== 1) ||
                            (this.widgetModel.settings.configuration?.grouping?.secondDimension.enabled && this.columnTableItems['ATTRIBUTES'].length !== 2)
                        break
                    case 'scatter':
                    case 'spline':
                    case 'pictorial':
                    case 'funnel':
                    case 'waterfall':
                        invalid = this.columnTableItems['ATTRIBUTES'].length !== 1
                        break
                    case 'sunburst':
                    case 'treemap':
                        invalid = this.columnTableItems['ATTRIBUTES'].length < 2
                        break
                    case 'heatmap':
                        invalid = this.columnTableItems['ATTRIBUTES'].length !== 2
                        break
                    case 'radar':
                        invalid = this.widgetModel.settings.configuration?.grouping?.secondDimension.enabled && this.columnTableItems['ATTRIBUTES'].length !== 2
                        break
                    default:
                        invalid = false
                }
            }
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            this.widgetModel.invalid.attributesInvalid = invalid
            return invalid
        },
        isMeasureTableInvalid() {
            let invalid = false
            if (this.columnTableItems['MEASURES'].length === 0) invalid = true
            else {
                switch (this.chartType) {
                    case 'area':
                    case 'bar':
                    case 'column':
                    case 'line':
                        invalid = this.widgetModel.settings.configuration?.grouping?.secondSeries.enabled && this.columnTableItems['MEASURES'].length !== 2
                        break
                    case 'solidgauge':
                    case 'heatmap':
                    case 'sunburst':
                    case 'treemap':
                    case 'pictorial':
                    case 'funnel':
                    case 'waterfall':
                        invalid = this.columnTableItems['MEASURES'].length !== 1
                        break
                    case 'pie':
                    case 'gauge':
                    case 'activitygauge':
                        invalid = this.columnTableItems['MEASURES'].length > 4
                        break
                    case 'spline':
                        invalid = this.columnTableItems['MEASURES'].length < 2
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
