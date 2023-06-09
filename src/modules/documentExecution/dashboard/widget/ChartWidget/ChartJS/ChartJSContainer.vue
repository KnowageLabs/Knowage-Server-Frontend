<template>
    <Pie v-if="chartType === 'pie'" :style="myStyles" :chart-options="chartOptions" :chart-data="chartData" :chart-id="'pie-chart'" :dataset-id-key="'label'" />
    <Bar v-if="chartType === 'bar'" :style="myStyles" :chart-options="chartOptions" :chart-data="chartData" :chart-id="'bar-chart'" :dataset-id-key="'label'" />
    <Line v-if="chartType === 'line'" :style="myStyles" :chart-options="chartOptions" :chart-data="chartData" :chart-id="'line-chart'" :dataset-id-key="'label'" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { Pie, Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js'
import { IWidget, IWidgetColumn, ISelection } from '../../../Dashboard'
import { IChartJSChartModel, IChartJSData, IChartJSOptions } from '../../../interfaces/chartJS/DashboardChartJSWidget'
import { mapActions } from 'pinia'
import { updateStoreSelections, executeChartCrossNavigation } from '../../interactionsHelpers/InteractionHelper'
import store from '../../../Dashboard.store'
import { formatForCrossNavigation } from './ChartJSContainerHelper'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement)

export default defineComponent({
    name: 'chart-js-container',
    components: { Pie, Bar, Line },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dataToShow: { type: Object as any, required: true },
        dashboardId: { type: String, required: true },
        editorMode: { type: Boolean },
        propActiveSelections: {
            type: Array as PropType<ISelection[]>,
            required: true
        }
    },
    data() {
        return {
            chartData: { labels: [], datasets: [] } as IChartJSData,
            chartOptions: {} as IChartJSOptions,
            chartModel: {} as IChartJSChartModel,
            error: false,
            chartHeight: 0 as number
        }
    },
    computed: {
        myStyles(): any {
            return {
                height: this.editorMode ? '100%' : `${this.chartHeight}px`,
                position: 'relative'
            }
        },
        chartType(): string {
            return this.widgetModel.settings.chartModel.model.chart.type
        }
    },
    watch: {
        dataToShow() {
            this.onRefreshChart()
        },
        editorMode() {
            this.onRefreshChart()
        }
    },
    mounted() {
        this.setEventListeners()
        this.onRefreshChart()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(store, ['setSelections', 'getDatasetLabel']),
        setEventListeners() {
            emitter.on('refreshChart', this.onRefreshChart)
            emitter.on('widgetResized', (newHeight) => this.onChartResize(newHeight as number))
        },
        removeEventListeners() {
            emitter.off('refreshChart', this.onRefreshChart)
            emitter.off('widgetResized', (newHeight) => this.onChartResize(newHeight as number))
        },
        onRefreshChart() {
            this.chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.updateChartModel()
        },
        updateChartModel() {
            if (!this.chartModel) {
                this.resetChart()
                return
            }
            this.updateChartOptions()
            this.updateChartData()
        },
        updateChartOptions() {
            this.chartOptions = {
                ...this.chartModel.options,
                responsive: true,
                maintainAspectRatio: false,
                events: ['click', 'mousemove'],
                onClick: this.executeInteractions
            }
        },
        updateChartData() {
            this.widgetModel.settings.chartModel.setData(this.dataToShow, this.widgetModel)
            this.widgetModel.settings.chartModel.updateChartColorSettings(this.widgetModel)
            this.chartData = this.chartModel.data
        },
        resetChart() {
            this.chartData = { labels: [], datasets: [] }
            this.chartOptions = {} as IChartJSOptions
        },
        executeInteractions(event: any, selectionEvent: any[]) {
            if (this.editorMode || !selectionEvent[0]) return
            if (this.widgetModel.settings.interactions.crossNavigation.enabled) {
                const formattedOutputParameters = formatForCrossNavigation(selectionEvent[0], this.widgetModel, this.chartData, this.dataToShow)
                executeChartCrossNavigation(formattedOutputParameters, this.widgetModel.settings.interactions.crossNavigation, this.dashboardId)
            } else {
                this.setSelection(event, selectionEvent)
            }
        },
        setSelection(event: any, selectionEvent: any[]) {
            if (this.editorMode || !selectionEvent || !selectionEvent[0] || !this.widgetModel.settings.interactions.selection || !this.widgetModel.settings.interactions.selection.enabled) return
            const value = this.getSelectionValue(selectionEvent)
            updateStoreSelections(this.createNewSelection([value]), this.propActiveSelections, this.dashboardId, this.setSelections, this.$http)
        },
        getSelectionValue(selectionEvent: any[]) {
            const value = this.chartData.labels[selectionEvent[0].index]
            return value ?? ''
        },
        createNewSelection(value: (string | number)[]) {
            const attributeColumn = this.widgetModel.columns.find((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE')
            const selection = {
                datasetId: this.widgetModel.dataset as number,
                datasetLabel: this.getDatasetLabel(this.widgetModel.dataset as number),
                columnName: attributeColumn?.columnName ?? '',
                value: value,
                aggregated: false,
                timestamp: new Date().getTime()
            }
            return selection
        },
        onChartResize(newHeight: number) {
            this.chartHeight = newHeight
        }
    }
})
</script>
