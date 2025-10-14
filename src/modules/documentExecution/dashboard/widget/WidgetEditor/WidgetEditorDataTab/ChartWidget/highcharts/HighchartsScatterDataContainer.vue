<template>
    <div v-if="widgetModel" class="p-d-flex p-flex-column p-mx-3">
        <WidgetEditorColumnTable
            v-if="['pie', 'heatmap', 'radar', 'column', 'bubble', 'scatter', 'line', 'treemap', 'sunburst'].includes(chartType)"
            class="p-mb-3"
            :widget-model="widgetModel"
            :items="columnTableItems['ATTRIBUTES'] ?? []"
            :settings="columnTableSettings"
            :chart-type="chartType"
            :error="isAttributesTableInvalid()"
            @rowReorder="onColumnsReorder($event, 'ATTRIBUTES')"
            @itemAdded="onColumnAdded($event, null)"
            @itemUpdated="onColumnItemUpdate"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
        <WidgetEditorColumnTable
            v-for="axis in ['X', 'Y']"
            :key="axis"
            class="p-mb-3"
            :class="{ 'p-order-5': axis === 'Y', 'p-order-3': axis === 'X' }"
            :widget-model="widgetModel"
            :items="columnTableItems[axis] ?? []"
            :settings="getValuesAxisSettings(axis)"
            :chart-type="chartType"
            :axis="axis"
            :error="isAxisTableInvalid(axis)"
            @rowReorder="onColumnsReorder($event, axis)"
            @itemAdded="onColumnAdded($event, axis)"
            @itemUpdated="onColumnItemUpdate"
            @itemDeleted="onColumnDelete"
        ></WidgetEditorColumnTable>
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
import dashboardStore from "@/modules/documentExecution/dashboard/Dashboard.store";

export default defineComponent({
    name: 'highcharts-scatter-data-container',
    components: { WidgetEditorColumnTable },
    props: {
        propWidgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedDataset: { type: Object as PropType<IDataset | null> }
    },
    setup() {
      const store = dashboardStore()
      return { store }
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
                ...highchartDescriptor.scatterChartColumnTableSettings[2]
            }
        }
    },
    watch: {
        propWidgetModel() {
            this.loadWidgetModel()
        },
        selectedDataset() {
            this.selectedColumn = null
            this.clearSelectedWidgetColumnsFromWidgetModel()
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
            this.columnTableItems['X'] = []
            this.columnTableItems['Y'] = []
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                const type = column.axis ? column.axis : 'ATTRIBUTES'
                this.columnTableItems[type].push(column)
            })
        },
        getValuesAxisSettings(axis: string) {
            switch (axis) {
                case 'Y':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.scatterChartColumnTableSettings[1] }
                case 'X':
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.scatterChartColumnTableSettings[0] }
                default:
                    return { ...commonDescriptor.columnTableSettings, ...highchartDescriptor.scatterChartColumnTableSettings[2] }
            }
        },
        onColumnsReorder(columns: IWidgetColumn[], type: string) {
            this.columnTableItems[type] = columns
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['Y']).concat(this.columnTableItems['X'])
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
            this.widgetModel.columns = this.columnTableItems['ATTRIBUTES'].concat(this.columnTableItems['Y']).concat(this.columnTableItems['X'])
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
        getFormFlexOrder(axis: string | null) {
            switch (axis) {
                case 'Y':
                    return 4
                case 'X':
                    return 5
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
            if (this.columnTableItems['ATTRIBUTES'].length > 1) invalid = true
            else {
              if (this.chartType === 'scatter') {
                if (this.widgetModel.settings.chartModel?.model?.plotOptions?.scatter?.jitter) {
                  invalid = this.columnTableItems['ATTRIBUTES'].length !== 1
                } else {
                  invalid = this.columnTableItems['ATTRIBUTES'].length > 1
                  this.store.setHighchartsScatterAttributePresent(this.columnTableItems['ATTRIBUTES'].length > 0)
                }
              } else {
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
                    case 'scatter':
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
            const invalid = this.columnTableItems['Y'].length !== 1
            this.widgetModel.invalid.yAxisInvalid = invalid
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
