<template>
    <div v-show="!error" :id="chartID" style="width: 100%; height: 100%; margin: 0 auto"></div>
    <HighchartsSonificationControls v-if="chartModel?.sonification?.enabled" @playSonify="playSonify" @pauseSonify="pauseSonify" @cancelSonify="cancelSonify"></HighchartsSonificationControls>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { ISelection, IVariable, IWidget, IWidgetColumn } from '../../../Dashboard'
import { IHighchartsChartModel } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { mapActions } from 'pinia'
import { updateStoreSelections, executeChartCrossNavigation } from '../../interactionsHelpers/InteractionHelper'
import { openNewLinkChartWidget } from '../../interactionsHelpers/InteractionLinkHelper'
import { formatActivityGauge, formatBubble, formatHeatmap, formatRadar, formatSplineChart, formatPictorialChart } from './HighchartsModelFormattingHelpers'
import { applyAdvancedSettingsToModelForRender, formatForCrossNavigation, getFormattedChartValues } from './HighchartsContainerHelpers'
import { getChartDrilldownData } from '../../../DataProxyHelper'
import HighchartsSonificationControls from './HighchartsSonificationControls.vue'
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
import HighchartsTreemap from 'highcharts/modules/treemap'
import HighchartsSunburst from 'highcharts/modules/sunburst'
import HighchartsSankey from 'highcharts/modules/sankey'
import HighchartsDependencyWheel from 'highcharts/modules/dependency-wheel'
import HighchartsParallelCoordinates from 'highcharts/modules/parallel-coordinates'
import Sonification from 'highcharts/modules/sonification'
import HighchartsPictorial from 'highcharts/modules/pictorial'
import HighchartsFunnel from 'highcharts/modules/funnel'
import HighchartsDumbbell from 'highcharts/modules/dumbbell'

HighchartsMore(Highcharts)
HighchartsSolidGauge(Highcharts)
HighchartsHeatmap(Highcharts)
HighchartsTreemap(Highcharts)
HighchartsSunburst(Highcharts)
HighchartsSankey(Highcharts)
HighchartsDependencyWheel(Highcharts)
HighchartsParallelCoordinates(Highcharts)
Accessibility(Highcharts)
Sonification(Highcharts)
NoDataToDisplay(Highcharts)
SeriesLabel(Highcharts)
Highcharts3D(Highcharts)
Drilldown(Highcharts)
HighchartsPictorial(Highcharts)
HighchartsFunnel(Highcharts)
HighchartsDumbbell(Highcharts)

export default defineComponent({
    name: 'highcharts-container',
    components: { HighchartsSonificationControls },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dataToShow: { type: Object as any, required: true },
        dashboardId: { type: String, required: true },
        editorMode: { type: Boolean },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        datasets: { type: Array as any, required: true },
        propVariables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['datasetInteractionPreview'],
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
            emitter.on('chartTypeChanged', this.onRefreshChart)
        },
        removeEventListeners() {
            emitter.off('refreshChart', this.onRefreshChart)
            emitter.off('widgetResized', this.resizeChart)
            emitter.off('chartTypeChanged', this.onRefreshChart)
        },
        onRefreshChart(widget: any | null = null) {
            if (widget && widget.id !== this.widgetModel.id) return
            this.chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (this.chartModel?.chart.type === 'wordcloud') return
            this.updateChartModel()
        },
        updateChartModel() {
            if (!this.chartModel) return
            Highcharts.setOptions({ lang: { noData: this.chartModel.lang.noData } })
            this.widgetModel.settings.chartModel.updateChartColorSettings(this.widgetModel)

            this.widgetModel.settings.chartModel.setData(this.dataToShow, this.widgetModel)

            this.widgetModel.settings.chartModel.updateSeriesAccessibilitySettings(this.widgetModel)
            if (!['heatmap', 'dependencywheel', 'sankey', 'spline'].includes(this.chartModel.chart.type)) this.widgetModel.settings.chartModel.updateSeriesLabelSettings(this.widgetModel)
            if (this.chartModel.chart.type === 'heatmap') this.updateAxisLabels()
            else if (this.chartModel.chart.type !== 'radar') this.updateDataLabels()
            this.error = this.updateLegendSettings()
            if (this.error) return
            this.error = this.updateTooltipSettings()
            if (this.error) return

            this.setSeriesEvents()

            const modelToRender = this.getModelForRender()
            modelToRender.chart.events = {
                drillup: this.onDrillUp,
                click: this.executeInteractions,
                checkboxClick: this.onCheckboxClicked
            }
            modelToRender.chart.backgroundColor = null
            applyAdvancedSettingsToModelForRender(modelToRender, this.widgetModel.settings.advancedSettings)

            console.log('--------------- MODEL TO RENDER: ', modelToRender)
            try {
                this.highchartsInstance = Highcharts.chart(this.chartID, modelToRender as any)
                this.highchartsInstance.reflow()
            } catch (error: any) {
                this.setError({
                    title: this.$t('common.toast.errorTitle'),
                    msg: error ? error.message : ''
                })
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
            this.chartModel.chart.events = {
                drillup: this.onDrillUp,
                click: this.executeInteractions,
                checkboxClick: this.onCheckboxClicked
            }
            if (this.chartModel.plotOptions.series) {
                this.chartModel.plotOptions.series.events = {
                    click: this.executeInteractions,
                    checkboxClick: this.onCheckboxClicked
                }
                if (this.chartModel.chart.type === 'sunburst') this.chartModel.plotOptions.series.events.legendItemClick = this.onSunburstLegendItemClick
            }
        },
        onDrillUp(event: any) {
            this.drillLevel = event.seriesOptions._levelNumber
            this.likeSelections = this.likeSelections.slice(0, this.drillLevel)
            this.setSeriesEvents()
        },
        async executeInteractions(event: any) {
            if (!['pie', 'heatmap', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'sunburst', 'treemap', 'dependencywheel', 'spline', 'pictorial', 'sankey', 'funnel'].includes(this.chartModel.chart.type) || this.editorMode) return
            if (this.widgetModel.settings.interactions.drilldown?.enabled) {
                const numberOfAttributeColumns = this.getNumberOfAttributeColumnsFromWidgetModel()
                if (!event.point || numberOfAttributeColumns - 1 === this.drillLevel) return
                const dashboardDatasets = this.getDashboardDatasets(this.dashboardId as any)
                this.drillLevel++
                const category = this.widgetModel.columns[this.drillLevel - 1]
                this.likeSelections.push({ [category.columnName]: event.point.name })
                this.highchartsInstance.showLoading(this.$t('common.info.dataLoading'))
                const tempData = await getChartDrilldownData(this.dashboardId, this.widgetModel, dashboardDatasets, this.$http, false, this.propActiveSelections, this.likeSelections, this.drillLevel)
                const newSeries = this.widgetModel.settings.chartModel.setData(tempData, this.widgetModel)
                this.highchartsInstance.hideLoading()
                newSeries.forEach((serie: any) => {
                    this.highchartsInstance.addSeriesAsDrilldown(event.point, {
                        data: serie.data,
                        name: event.point.name
                    })
                })
                this.setSeriesEvents()
            } else if (this.widgetModel.settings.interactions.crossNavigation.enabled) {
                const formattedOutputParameters = formatForCrossNavigation(event, this.widgetModel.settings.interactions.crossNavigation, this.dataToShow, this.chartModel.chart.type)
                executeChartCrossNavigation(formattedOutputParameters, this.widgetModel.settings.interactions.crossNavigation, this.dashboardId)
            } else if (this.widgetModel.settings.interactions.preview.enabled) {
                const formattedChartValues = getFormattedChartValues(event, this.dataToShow, this.chartModel.chart.type)
                this.$emit('datasetInteractionPreview', { formattedChartValues: formattedChartValues, previewSettings: this.widgetModel.settings.interactions.preview })
            } else if (this.widgetModel.settings.interactions.link.enabled) {
                const formattedChartValues = getFormattedChartValues(event, this.dataToShow, this.chartModel.chart.type)
                openNewLinkChartWidget(formattedChartValues, this.widgetModel.settings.interactions.link, this.dashboardId, this.propVariables)
            } else if (['pie', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'suburst', 'treemap', 'dependencywheel', 'spline', 'pictorial', 'sankey', 'funnel'].includes(this.chartModel.chart.type)) {
                this.setSelection(event)
            }
        },
        getNumberOfAttributeColumnsFromWidgetModel() {
            const attributeColumns = this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE')
            return attributeColumns.length
        },
        setSelection(event: any) {
            if (this.editorMode || !this.widgetModel.settings.interactions.selection || !this.widgetModel.settings.interactions.selection.enabled) return
            if (['pie', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'suburst', 'treemap', 'funnel'].includes(this.chartModel.chart.type)) {
                const serieClicked = event.point?.options
                if (!serieClicked || !serieClicked.name) return
                updateStoreSelections(this.createNewSelection([serieClicked.name]), this.propActiveSelections, this.dashboardId, this.setSelections, this.$http)
            } else if (['pictorial', 'spline'].includes(this.chartModel.chart.type)) {
                this.setPictorialSelection(event)
            } else {
                this.setSankeySelection(event)
            }
        },
        setPictorialSelection(event: any) {
            const selectionValue = event.point?.series?.name
            if (!selectionValue) return
            updateStoreSelections(this.createNewSelection([selectionValue]), this.propActiveSelections, this.dashboardId, this.setSelections, this.$http)
        },
        setSankeySelection(event: any) {
            const serieClicked = event.point?.options
            if (!serieClicked || (!serieClicked.id && !serieClicked.from)) return
            const value = serieClicked.id ?? serieClicked.from
            updateStoreSelections(this.createNewSelection([value]), this.propActiveSelections, this.dashboardId, this.setSelections, this.$http)
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
            } else if (formattedChartModel.chart.type === 'bubble') {
                formatBubble(formattedChartModel)
            } else if (formattedChartModel.chart.type === 'spline') {
                formatSplineChart(formattedChartModel, this.widgetModel)
            } else if (formattedChartModel.chart.type === 'pictorial') {
                formatPictorialChart(formattedChartModel, this.widgetModel)
            }

            return formattedChartModel
        },
        onCheckboxClicked(event: any) {
            this.highchartsInstance.series[event.item.columnIndex].data.forEach((point: any) => {
                const dataLabelOptions = point.options.dataLabels
                dataLabelOptions.enabled = event.checked
                point.update(dataLabelOptions)
            }, false)
            this.highchartsInstance.redraw()
        },
        onSunburstLegendItemClick(event: any) {
            const pointName = event.target.name
            const point = this.highchartsInstance.series[0].points.find((point: any) => point.name === pointName)
            const tempPoints = this.getChildrenPoints(point.id)
            point.setVisible(!point.visible)
            tempPoints.forEach((point: any) => point.setVisible(!point.visible))
        },
        getChildrenPoints(parentId: string) {
            const seriesData = this.highchartsInstance.series[0].points
            const childrenPoints = [] as any

            function traversePoints(points: any, parentId: string) {
                points.forEach((point: any) => {
                    if (point.parent === parentId) {
                        childrenPoints.push(point)
                        traversePoints(points, point.id)
                    }
                })
            }
            traversePoints(seriesData, parentId)
            return childrenPoints
        },
        playSonify() {
            this.highchartsInstance.toggleSonify()
        },
        pauseSonify() {
            this.highchartsInstance.toggleSonify(false)
        },
        cancelSonify() {
            this.highchartsInstance.sonification.cancel()
        }
    }
})
</script>
