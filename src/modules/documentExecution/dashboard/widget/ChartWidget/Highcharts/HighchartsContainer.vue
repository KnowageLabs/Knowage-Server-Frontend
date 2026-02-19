<template>
    <div v-show="!error" :id="chartID" style="width: 100%; height: 100%; margin: 0 auto"></div>
    <HighchartsSonificationControls v-if="chartModel?.sonification?.enabled" @playSonify="playSonify" @pauseSonify="pauseSonify" @cancelSonify="cancelSonify"></HighchartsSonificationControls>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IDashboardDataset, ISelection, IVariable, IWidget, IWidgetColumn } from '../../../Dashboard'
import { IHighchartsChartModel } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { mapActions, mapState } from 'pinia'
import { updateStoreSelections, executeChartCrossNavigation } from '../../interactionsHelpers/InteractionHelper'
import { openNewLinkChartWidget } from '../../interactionsHelpers/InteractionLinkHelper'
import { formatActivityGauge, formatBubble, formatHeatmap, formatRadar, formatSplineChart, formatPictorialChart, formatStreamgraphChart, formatPackedBubble, formatVariables } from './HighchartsModelFormattingHelpers'
import { applyAdvancedSettingsToModelForRender, formatChartAnnotations, formatForCrossNavigation, getFormattedChartValues } from './HighchartsContainerHelpers'
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
import HighchartsStreamgraph from 'highcharts/modules/streamgraph'
import HighchartsWordcloud from 'highcharts/modules/wordcloud'
import HighchartsAnnotations from 'highcharts/modules/annotations'
import { getWidgetData } from '../../../DashboardDataProxy'

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
HighchartsStreamgraph(Highcharts)
HighchartsAnnotations(Highcharts)
HighchartsWordcloud(Highcharts)

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
    setup() {
        const dashStore = store()
        return { dashStore }
    },
    data() {
        return {
            chartID: crypto.randomUUID(),
            chartModel: {} as IHighchartsChartModel,
            error: false,
            highchartsInstance: {} as any,
            drillLevel: 0,
            currentDrillNavigationItem: '',
            drilldown: [] as any[],
            variables: [] as IVariable[],
            originalReflow: null,
            handleMouseUp: null as (() => void) | null,
            thresholdMessageShown: false

        }
    },
    watch: {
        dataToShow() {
            this.onRefreshChart()
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadVariables()
        this.onRefreshChart()
    },
    unmounted() {
        this.removeEventListeners()

        if (this.handleMouseUp) {
            window.removeEventListener('mouseup', this.handleMouseUp)
        }
    },
    computed: {
        ...mapState(store, ['dashboards'])
    },
    methods: {
        ...mapActions(store, ['setSelections', 'getDatasetLabel', 'getDashboardDatasets', 'getDashboardDrivers']),
        ...mapActions(mainStore, ['setError']),
        setEventListeners() {
            emitter.on('refreshChart', this.onRefreshChart)
            emitter.on('widgetResized', this.resizeChart)
            emitter.on('chartTypeChanged', this.onRefreshChart)
            this.listenOnMouseUp()
        },
        removeEventListeners() {
            emitter.off('refreshChart', this.onRefreshChart)
            emitter.off('widgetResized', this.resizeChart)
            emitter.off('chartTypeChanged', this.onRefreshChart)
            if (this.handleMouseUp) {
                window.removeEventListener('mouseup', this.handleMouseUp)
            }
        },
        loadVariables() {
            this.variables = this.propVariables
        },
        onRefreshChart(widget: any | null = null) {
            if (widget && widget.id !== this.widgetModel.id) return
            this.chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.loadVariables()
            this.updateChartModel()
        },
        listenOnMouseUp() {
            const originalAddEvent = Highcharts.addEvent
            this.highchartsInstance.addEvent = function (el, type, fn, options) {
                if (el === window && type === 'resize') {
                    return
                }
                return originalAddEvent(el, type, fn, options)
            }
            this.highchartsInstance.addEvent = originalAddEvent
            this.originalReflow = this.highchartsInstance.reflow
            this.highchartsInstance.reflow = function () {}
            window.addEventListener('mouseup', () => {
                this.highchartsInstance?.reflow()
            })
            const handleMouseUp = () => {
                if (this.highchartsInstance && this.originalReflow) {
                    this.originalReflow.call(this.highchartsInstance)
                }
            }

            window.addEventListener('mouseup', handleMouseUp)
        },
        updateChartModel() {
            if (!this.chartModel) return

            const chartContainer = document.getElementById(this.chartID)
            if (!chartContainer) return

            Highcharts.setOptions({ lang: { noData: this.chartModel.lang.noData } })
            this.widgetModel.settings.chartModel.updateChartColorSettings(this.widgetModel)

            this.widgetModel.settings.chartModel.setData(this.dataToShow, this.widgetModel, this.variables)

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

            // Check category threshold before rendering
            if (this.shouldShowThresholdMessage(dataToUse)) {
                this.showCategoryThresholdMessage()
                return
            }

            // Se il messaggio era mostrato ma ora le condizioni sono OK, ripulisci il container
            if (this.thresholdMessageShown) {
                chartContainer.innerHTML = ''
                this.thresholdMessageShown = false
            }

            if (modelToRender.chart.type === 'pie' && modelToRender.plotOptions?.series?.showCheckbox) {
                modelToRender.series.forEach((series) => {
                    const isSelected = modelToRender.plotOptions?.series?.showCheckbox
                    series.selected = isSelected
                    modelToRender.series[0].data.forEach((point) => (point.selected = isSelected))
                })
            }

            modelToRender.chart.events = {
                drillup: this.onDrillUp,
                click: this.executeInteractions,
                checkboxClick: this.onCheckboxClicked
            }
            modelToRender.chart.backgroundColor = null
            applyAdvancedSettingsToModelForRender(modelToRender, this.widgetModel.settings.advancedSettings)
            formatChartAnnotations(modelToRender, this.variables, this.getDashboardDrivers(this.dashboardId))

            try {

                // Destroy existing chart instance if it exists
                if (this.highchartsInstance && typeof this.highchartsInstance.destroy === 'function') {
                    try {
                        this.highchartsInstance.destroy()
                    } catch (error) {
                        console.warn('Error destroying previous chart instance:', error)
                    }
                }

                this.highchartsInstance = Highcharts.chart(this.chartID, modelToRender as any)
                this.addAditionalCSSClasses(modelToRender)

                // Safely call reflow
                if (this.highchartsInstance && typeof this.highchartsInstance.reflow === 'function') {
                    this.highchartsInstance.reflow()
                }
            } catch (error: any) {
                this.setError({
                    title: this.$t('common.toast.errorTitle'),
                    msg: error ? error.message : ''
                })
            }
        },
        addAditionalCSSClasses(modelToRender: IHighchartsChartModel) {
            if (!modelToRender.plotOptions?.series?.showCheckbox || !modelToRender.legend) return
            setTimeout(() => {
                const container = document.getElementById(this.chartID)
                if (!container) return
                const horizontalAlignment = modelToRender.legend.layout === 'horizontal'
                container.querySelectorAll('.highcharts-legend-checkbox').forEach((el) => {
                    el.classList.add(horizontalAlignment ? 'custom-checkbox-style-horizontal' : 'custom-checkbox-style-vertical')
                    el.classList.remove(horizontalAlignment ? 'custom-checkbox-style-vertical' : 'custom-checkbox-style-horizontal')
                })
            }, 100)
        },
        updateLegendSettings() {
            if (this.chartModel.plotOptions.pie) this.chartModel.plotOptions.pie.showInLegend = true
            if (this.chartModel.plotOptions.gauge) this.chartModel.plotOptions.gauge.showInLegend = true
            return this.widgetModel.settings.chartModel.updateFormatterSettings(this.chartModel.legend, 'labelFormat', 'labelFormatter', 'labelFormatterText', 'labelFormatterError', this.variables)
        },
        updateDataLabels() {
            const dataLabels = this.chartModel.plotOptions && this.chartModel.plotOptions[this.chartModel.chart.type] ? this.chartModel.plotOptions[this.chartModel.chart.type].dataLabels : null
            if (dataLabels) {
                this.error = this.widgetModel.settings.chartModel.updateFormatterSettings(dataLabels, 'format', 'formatter', 'formatterText', 'formatterError', this.variables)
                if (this.error) return
            }
        },
        updateAxisLabels() {
            const axisLabels = this.chartModel.xAxis && this.chartModel.xAxis[0].labels ? this.chartModel.xAxis[0].labels : null
            if (axisLabels) {
                this.error = this.widgetModel.settings.chartModel.updateFormatterSettings(axisLabels, 'format', 'formatter', 'formatterText', 'formatterError', this.variables)
                if (this.error) return
            }
        },
        updateTooltipSettings() {
            let hasError = this.widgetModel.settings.chartModel.updateFormatterSettings(this.chartModel.tooltip, null, 'formatter', 'formatterText', 'formatterError', this.variables)
            if (hasError) return hasError
            hasError = this.widgetModel.settings.chartModel.updateFormatterSettings(this.chartModel.tooltip, null, 'pointFormatter', 'pointFormatterText', 'pointFormatterError', this.variables)
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
            this.drilldown = this.drilldown.slice(0, this.drillLevel)
            this.setSeriesEvents()
        },
        async executeInteractions(event: any) {
            if (this.editorMode) return
            if (this.widgetModel.settings.interactions.drilldown?.enabled) {
                const tempDataLabelSettings = this.widgetModel.settings.chartModel?.model?.series[0] && this.widgetModel.settings.chartModel.model.series[0].data[0] ? this.widgetModel.settings.chartModel.model.series[0].data[0].dataLabels : null
                const numberOfAttributeColumns = this.getNumberOfAttributeColumnsFromWidgetModel()
                if (!event.point || numberOfAttributeColumns - 1 === this.drillLevel) return
                const dashboardDatasets = this.getDashboardDatasets(this.dashboardId)
                this.drillLevel++
                if (this.drillLevel === 1 && event.point.series.name) {
                    this.currentDrillNavigationItem = event.point.series.name
                }
                const category = this.widgetModel.columns[this.drillLevel - 1]

                this.drilldown.push({ [category.columnName]: event.point.name })
                const formattedDrilldown = this.formatDrilldown(this.drilldown)

                this.highchartsInstance.showLoading(this.$t('common.info.dataLoading'))

                const tempData = await getWidgetData(this.dashboardId, this.widgetModel, dashboardDatasets, this.$http, false, this.propActiveSelections, { searchText: '', searchColumns: [] }, this.dashboards[this.dashboardId].configuration, null, false, null, this.drillLevel, formattedDrilldown)
                tempData.initialCall = false
                const newSeries = this.widgetModel.settings.chartModel.setData(tempData, this.widgetModel)

                this.highchartsInstance.hideLoading()

                const newSerieToAdd = newSeries.find((serie: any) => serie.name === this.currentDrillNavigationItem)
                this.highchartsInstance.addSeriesAsDrilldown(event.point, {
                    id: newSerieToAdd.id,
                    data: newSerieToAdd.data,
                    name: event.point.name,
                    dataLabels: tempDataLabelSettings
                })
                //TODO: Leave it for now, maybe we need to revert back to forEach, but it has to be tested first
                // newSeries.forEach((serie: any) => {
                //     this.highchartsInstance.addSeriesAsDrilldown(event.point, {
                //         id: serie.id,
                //         data: serie.data,
                //         name: event.point.name,
                //         dataLabels: tempDataLabelSettings
                //     })
                // })
                if (!['heatmap', 'dependencywheel', 'sankey', 'spline'].includes(this.chartModel.chart.type)) this.widgetModel.settings.chartModel.updateSeriesLabelSettings(this.widgetModel)
                this.setSeriesEvents()
            } else if (this.widgetModel.settings.interactions.crossNavigation.enabled) {
                if (!event.point) return
                const formattedOutputParameters = formatForCrossNavigation(event, this.widgetModel.settings.interactions.crossNavigation, this.dataToShow, this.chartModel.chart.type)
                executeChartCrossNavigation(formattedOutputParameters, this.widgetModel.settings.interactions.crossNavigation, this.dashboardId)
            } else if (this.widgetModel.settings.interactions.preview.enabled) {
                const formattedChartValues = getFormattedChartValues(event, this.dataToShow, this.chartModel.chart.type)
                this.$emit('datasetInteractionPreview', { formattedChartValues: formattedChartValues, previewSettings: this.widgetModel.settings.interactions.preview })
            } else if (this.widgetModel.settings.interactions.link.enabled) {
                const formattedChartValues = getFormattedChartValues(event, this.dataToShow, this.chartModel.chart.type)
                openNewLinkChartWidget(formattedChartValues, this.widgetModel.settings.interactions.link, this.dashboardId, this.variables)
            } else if (['pie', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'suburst', 'treemap', 'dependencywheel', 'spline', 'pictorial', 'sankey', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall', 'wordcloud'].includes(this.chartModel.chart.type)) {
                this.setSelection(event)
            }
        },
        getNumberOfAttributeColumnsFromWidgetModel() {
            const attributeColumns = this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE')
            return attributeColumns.length
        },
        setSelection(event: any) {
            if (this.editorMode || !this.widgetModel.settings.interactions.selection || !this.widgetModel.settings.interactions.selection.enabled) return
            if (['pie', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'suburst', 'treemap', 'funnel', 'dumbbell', 'streamgraph', 'waterfall', 'wordcloud'].includes(this.chartModel.chart.type)) {
                const serieClicked = event.point?.options
                if (!serieClicked || !serieClicked.name) return
                updateStoreSelections(this.createNewSelection([serieClicked.name]), this.propActiveSelections, this.dashboardId, this.setSelections, this.$http)
            } else if (['pictorial', 'spline', 'packedbubble'].includes(this.chartModel.chart.type)) {
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
            if (!this.highchartsInstance || !this.highchartsInstance.series) return

            this.highchartsInstance.series.forEach((serie: any) => {
                if (!serie || !serie.data) return
                serie.data.forEach((d: any) => {
                    if (d && d.dataLabelUpper && typeof d.dataLabelUpper.destroy === 'function') {
                        d.dataLabelUpper.destroy()
                    }
                })
            })
        },
        getModelForRender() {
            const formattedChartModel = deepcopy(this.chartModel)

            formatVariables(formattedChartModel, this.variables)

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
            } else if (formattedChartModel.chart.type === 'streamgraph') {
                formatStreamgraphChart(formattedChartModel, this.widgetModel)
            } else if (formattedChartModel.chart.type === 'packedbubble') {
                formatPackedBubble(formattedChartModel)
            }

            return formattedChartModel
        },
        onCheckboxClicked(event: any) {
            if (['area', 'bar', 'column', 'line'].includes(this.chartModel.chart.type)) {
                this.highchartsInstance.series[event.target.index].data.forEach((point: any) => {
                    const dataLabelOptions = point.options.dataLabels
                    dataLabelOptions.enabled = event.checked
                    point.update(dataLabelOptions)
                }, false)
            } else if (this.chartModel.chart.type === 'pie') {
                this.highchartsInstance.series[0].data.forEach((point: any) => {
                    const dataLabelOptions = point.options.dataLabels
                    if (point.name === event.item.name) {
                        dataLabelOptions.enabled = event.checked
                        point.update(dataLabelOptions)
                    }
                }, false)
            } else {
                this.highchartsInstance.series[event.item.columnIndex].data.forEach((point: any) => {
                    const dataLabelOptions = point.options.dataLabels
                    dataLabelOptions.enabled = event.checked
                    point.update(dataLabelOptions)
                }, false)
            }
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
        },
        formatDrilldown(likeSelections) {
            const datasets = this.getDashboardDatasets(this.dashboardId)
            const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => this.widgetModel.dataset === dataset.id)
            const selectedDataset = datasets[datasetIndex]
            const formattedLikeSelections = {}

            likeSelections.forEach((likeSelection: any) => {
                const key = Object.keys(likeSelection)[0]
                const escapedLikeSelectionString = likeSelection[key].replace(/'/g, "''")
                formattedLikeSelections[key] = escapedLikeSelectionString
            })
            const datasetLabel = selectedDataset.dsLabel as any
            return { [datasetLabel]: formattedLikeSelections }
        }
    },
  shouldShowThresholdMessage(data: any): boolean {
    const categoryThreshold = this.widgetModel.settings?.configuration?.categoryThreshold

    if (!categoryThreshold || !categoryThreshold.enabled) {
      return false
    }

    if (!categoryThreshold.conditions || categoryThreshold.conditions.length === 0) {
      return false
    }

    if (!data || !data.rows || data.rows.length === 0) {
      return false
    }

    const operator = categoryThreshold.operator || 'OR'
    const results: boolean[] = []

    // Verifica ogni condizione
    for (const condition of categoryThreshold.conditions) {
      if (!condition.category) continue

      // Trova la colonna categoria nel widget model
      const categoryColumn = this.widgetModel.columns?.find(
          (col) => col.columnName === condition.category && col.fieldType === 'ATTRIBUTE'
      )

      if (!categoryColumn) continue

      // Trova il field corrispondente nei metaData per ottenere il dataIndex (column_X)
      const fieldMeta = data.metaData?.fields?.find(
          (field: any) => field.header === (categoryColumn.alias || categoryColumn.columnName)
      )

      if (!fieldMeta) continue

      const dataIndex = fieldMeta.name // questo sarà "column_1", "column_2", ecc.

      // Conta valori univoci per questa categoria usando il dataIndex corretto
      const uniqueCategories = new Set()
      data.rows.forEach((row: any) => {
        const categoryValue = row[dataIndex]
        if (categoryValue !== null && categoryValue !== undefined) {
          uniqueCategories.add(categoryValue)
        }
      })

      // La condizione fallisce se count < threshold (dobbiamo nascondere il grafico)
      const conditionFailed = uniqueCategories.size < condition.threshold
      results.push(conditionFailed)
    }

    // Applica l'operatore logico
    if (operator === 'AND') {
      // AND: nascondi il grafico se TUTTE le condizioni falliscono
      return results.length > 0 && results.every(failed => failed)
    } else {
      // OR: nascondi il grafico se ALMENO UNA condizione fallisce
      return results.some(failed => failed)
    }
  },
  showCategoryThresholdMessage() {
    const categoryThreshold = this.widgetModel.settings?.configuration?.categoryThreshold
    const chartContainer = document.getElementById(this.chartID)

    if (!chartContainer || !categoryThreshold) return

    // Destroy existing chart if any - safely
    if (this.highchartsInstance && typeof this.highchartsInstance.destroy === 'function') {
      try {
        this.highchartsInstance.destroy()
        this.highchartsInstance = null
      } catch (error) {
        console.warn('Error destroying chart:', error)
      }
    }

    // Display the threshold message with custom styling
    const message = categoryThreshold.message || this.$t('dashboard.widgetEditor.highcharts.categoryThreshold.defaultMessage')
    const style = categoryThreshold.style || {
      fontFamily: '',
      fontSize: '14px',
      fontWeight: '',
      color: '#666',
      backgroundColor: ''
    }

    chartContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    width: 100%;
                    text-align: center;
                    padding: 20px;
                    font-size: ${style.fontSize || '14px'};
                    font-family: ${style.fontFamily || 'inherit'};
                    font-weight: ${style.fontWeight || 'normal'};
                    color: ${style.color || '#666'};
                    background-color: ${style.backgroundColor || 'transparent'};
                ">
                    <div>${message}</div>
                </div>
            `

    // Setta il flag per indicare che il messaggio è mostrato
    this.thresholdMessageShown = true
  }
})
</script>

<style lang="scss">
.custom-checkbox-style-horizontal {
    margin-top: 3.3px;
    margin-left: -10px;
    vertical-align: middle;
}

.custom-checkbox-style-vertical {
    margin-top: 3.5px;
    margin-left: 5.5px;
    vertical-align: middle;
}
</style>
