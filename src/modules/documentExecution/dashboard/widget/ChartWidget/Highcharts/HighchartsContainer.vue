<template>
    <div v-show="!error" :id="chartID" style="width: 100%; height: 100%; margin: 0 auto"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { ISelection, IWidget, IWidgetColumn } from '../../../Dashboard'
import { IHighchartsChartModel } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { mapActions } from 'pinia'
import { updateStoreSelections, executeChartCrossNavigation } from '../../interactionsHelpers/InteractionHelper'
import { formatActivityGauge, formatHeatmap, formatRadar } from './HighchartsModelFormattingHelpers'
import { formatForCrossNavigation } from './HighchartsContainerHelpers'
import { getPieChartDrilldownData } from '../../../DataProxyHelper'
import Highcharts from 'highcharts'
import Highcharts3D from 'highcharts/highcharts-3d'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsSolidGauge from 'highcharts/modules/solid-gauge'
import Accessibility from 'highcharts/modules/accessibility'
import NoDataToDisplay from 'highcharts/modules/no-data-to-display'
import SeriesLabel from 'highcharts/modules/series-label'
import HighchartsHeatmap from 'highcharts/modules/heatmap'
import Drilldown from 'highcharts/modules/drilldown'
import cryptoRandomString from 'crypto-random-string'
import store from '../../../Dashboard.store'
import deepcopy from 'deepcopy'
import mainStore from '@/App.store'

HighchartsMore(Highcharts)
HighchartsSolidGauge(Highcharts)
HighchartsHeatmap(Highcharts)
Accessibility(Highcharts)
NoDataToDisplay(Highcharts)
SeriesLabel(Highcharts)
Highcharts3D(Highcharts)
Drilldown(Highcharts)

export default defineComponent({
    name: 'highcharts-container',
    components: {},
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dataToShow: { type: Object as any, required: true },
        dashboardId: { type: String, required: true },
        editorMode: { type: Boolean },
        propActiveSelections: {
            type: Array as PropType<ISelection[]>,
            required: true
        },
        datasets: { type: Array as any, required: true }
    },
    data() {
        return {
            chartID: cryptoRandomString({ length: 16, type: 'base64' }),
            chartModel: {} as IHighchartsChartModel,
            error: false,
            highchartsInstance: {} as any,
            drillLevel: 0,
            likeSelections: [] as any[]
        }
    },
    watch: {
        dataToShow() {
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
        ...mapActions(store, ['setSelections', 'getDatasetLabel', 'getDashboardDatasets']),
        ...mapActions(mainStore, ['setError']),
        setEventListeners() {
            emitter.on('refreshChart', this.onRefreshChart)
            emitter.on('widgetResized', this.resizeChart)
        },
        removeEventListeners() {
            emitter.off('refreshChart', this.onRefreshChart)
            emitter.off('widgetResized', this.resizeChart)
        },
        onRefreshChart(widgetId: any | null = null) {
            if (widgetId && widgetId !== this.widgetModel.id) return
            this.chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.updateChartModel()
        },
        updateChartModel() {
            if (!this.chartModel) return
            Highcharts.setOptions({ lang: { noData: this.chartModel.lang.noData } })

            this.widgetModel.settings.chartModel.setData(this.dataToShow, this.widgetModel)

            this.widgetModel.settings.chartModel.updateSeriesAccessibilitySettings(this.widgetModel)
            if (this.chartModel.chart.type !== 'heatmap') this.widgetModel.settings.chartModel.updateSeriesLabelSettings(this.widgetModel)
            if (this.chartModel.chart.type === 'heatmap') this.updateAxisLabels()
            else if (this.chartModel.chart.type !== 'radar') this.updateDataLabels()
            this.error = this.updateLegendSettings()
            if (this.error) return
            this.error = this.updateTooltipSettings()
            if (this.error) return

            this.widgetModel.settings.chartModel.updateChartColorSettings(this.widgetModel)

            this.setSeriesEvents()

            const modelToRender = this.getModelForRender()
            modelToRender.chart.backgroundColor = null

            console.log('-------- MODEL TO RENDER: ', modelToRender)
            try {
                this.highchartsInstance = Highcharts.chart(this.chartID, modelToRender as any)
                this.highchartsInstance.reflow()
            } catch (error: any) {
                console.log('--------- EROR: ', error)
                this.setError({ title: this.$t('common.toast.errorTitle'), msg: error ? error.message : '' })
            }
        },
        updateLegendSettings() {
            if (this.chartModel.plotOptions.pie) this.chartModel.plotOptions.pie.showInLegend = true
            if (this.chartModel.plotOptions.gauge) this.chartModel.plotOptions.gauge.showInLegend = true
            return this.widgetModel.settings.chartModel.updateFormatterSettings(this.chartModel.legend, 'labelFormat', 'labelFormatter', 'labelFormatterText', 'labelFormatterError')
        },
        updateDataLabels() {
            const dataLabels = this.chartModel.plotOptions && this.chartModel.plotOptions[this.chartModel.chart.type] ? this.chartModel.plotOptions[this.chartModel.chart.type].dataLabels : null
            if (dataLabels) {
                this.error = this.widgetModel.settings.chartModel.updateFormatterSettings(dataLabels, 'format', 'formatter', 'formatterText', 'formatterError')
                if (this.error) return
            }
        },
        updateAxisLabels() {
            const axisLabels = this.chartModel.xAxis && this.chartModel.xAxis.labels ? this.chartModel.xAxis.labels : null
            if (axisLabels) {
                this.error = this.widgetModel.settings.chartModel.updateFormatterSettings(axisLabels, 'format', 'formatter', 'formatterText', 'formatterError')
                if (this.error) return
            }
        },
        updateTooltipSettings() {
            let hasError = this.widgetModel.settings.chartModel.updateFormatterSettings(this.chartModel.tooltip, null, 'formatter', 'formatterText', 'formatterError')
            if (hasError) return hasError
            hasError = this.widgetModel.settings.chartModel.updateFormatterSettings(this.chartModel.tooltip, null, 'pointFormatter', 'pointFormatterText', 'pointFormatterError')
            return hasError
        },

        setSeriesEvents() {
            this.chartModel.chart.events = { drillup: this.onDrillUp }
            if (this.chartModel.plotOptions.series) this.chartModel.plotOptions.series = { events: { click: this.executeInteractions } }
        },
        onDrillUp(event: any) {
            // console.log('--------- DRILL UP CAAAAAAAAALLED!: ', event)
            this.drillLevel = event.seriesOptions._levelNumber
            this.likeSelections = this.likeSelections.slice(0, this.drillLevel)
        },
        async executeInteractions(event: any) {
            if (!['pie', 'heatmap', 'radar'].includes(this.chartModel.chart.type)) return

            // TODO - refactor
            if (this.widgetModel.settings.interactions.drilldown?.enabled) {
                const dashboardDatasets = this.getDashboardDatasets(this.dashboardId as any)
                // console.log(' this.datasets: ', dashboardDatasets)
                // console.log(' event: ', event)
                // console.log(' event.point.name: ', event.point.name)
                this.drillLevel++
                const category = this.widgetModel.columns[this.drillLevel - 1]
                this.likeSelections.push({ [category.columnName]: event.point.name })
                this.highchartsInstance.showLoading(this.$t('common.info.dataLoading'))
                const temp = await getPieChartDrilldownData(this.widgetModel, dashboardDatasets, this.$http, false, this.propActiveSelections, this.likeSelections, this.drillLevel)
                console.log(' resp: ', temp)

                const tempSeries = [] as any[]
                temp?.rows?.forEach((row: any) => {
                    const serieElement = {
                        id: row.id,
                        name: row['column_1'],
                        y: row['column_2'],
                        drilldown: false
                    }
                    serieElement.drilldown = true
                    tempSeries.push(serieElement)
                })
                // console.log('--------- TEMP SERIES: ', tempSeries)
                this.highchartsInstance.hideLoading()
                this.highchartsInstance.addSeriesAsDrilldown(event.point, { data: tempSeries, name: event.point.name })
            } else if (this.widgetModel.settings.interactions.crossNavigation.enabled) {
                const formattedOutputParameters = formatForCrossNavigation(event, this.widgetModel.settings.interactions.crossNavigation, this.dataToShow, this.chartModel.chart.type)
                executeChartCrossNavigation(formattedOutputParameters, this.widgetModel.settings.interactions.crossNavigation, this.dashboardId)
            } else if (['pie', 'radar'].includes(this.chartModel.chart.type)) {
                this.setSelection(event)
            }
        },
        setSelection(event: any) {
            if (this.editorMode || !this.widgetModel.settings.interactions.selection || !this.widgetModel.settings.interactions.selection.enabled) return
            const serieClicked = event.point?.options
            if (!serieClicked || !serieClicked.name) return
            updateStoreSelections(this.createNewSelection([serieClicked.name]), this.propActiveSelections, this.dashboardId, this.setSelections, this.$http)
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
        resizeChart() {
            setTimeout(() => {
                this.highchartsInstance.reflow()
            }, 100)
        },
        getModelForRender() {
            const formattedChartModel = deepcopy(this.chartModel)
            if (formattedChartModel.chart.type === 'activitygauge') {
                formatActivityGauge(formattedChartModel, this.widgetModel)
            } else if (formattedChartModel.chart.type === 'heatmap') {
                formatHeatmap(formattedChartModel)
            } else if (formattedChartModel.chart.type === 'radar') {
                formatRadar(formattedChartModel)
            }
            return formattedChartModel
        }
    }
})
</script>
