<template>
    <div class="highcharts-container">
        <div v-show="!error" :id="chartID" style="width: 100%; height: 100%; margin: 0 auto"></div>
        <div
            v-if="showMeasureTogglePanel"
            class="measure-toggle-panel"
            :class="{ 'is-dragging': isDragging }"
            :style="panelStyle"
            @mousedown="startDrag"
        >
            <button
                type="button"
                class="measure-toggle-panel__header"
                @click="togglePanel"
            >
                <span class="measure-toggle-panel__drag-handle">⋮⋮</span>
                <span>{{ $t('dashboard.widgetEditor.measureToggle.title') }}</span>
                <span class="measure-toggle-panel__chevron">{{ showMeasurePanel ? '▾' : '▸' }}</span>
            </button>
            <div v-show="showMeasurePanel" class="measure-toggle-panel__body">
                <!-- Single measure selection (for pie, gauge, etc.) -->
                <select
                    v-if="isSingleMeasureChart"
                    v-model="activeMeasureNames[0]"
                    class="measure-toggle-panel__select"
                    @change="onSingleMeasureChange"
                    @mousedown.stop
                >
                    <option
                        v-for="option in measureOptions"
                        :key="option.column.id || option.column.columnName"
                        :value="option.seriesName"
                    >
                        {{ option.label }}
                    </option>
                </select>

                <!-- Multiple measure selection (for bar, line, etc.) -->
                <template v-else>
                    <label
                        v-for="option in measureOptions"
                        :key="option.column.id || option.column.columnName"
                        class="measure-toggle-panel__item"
                    >
                        <input
                            type="checkbox"
                            :checked="activeMeasureNames.includes(option.seriesName)"
                            @change="onMeasureToggle(option.seriesName, ($event.target as HTMLInputElement).checked)"
                        />
                        <span>{{ option.label }}</span>
                    </label>
                </template>
            </div>
        </div>
    </div>
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
import { getColumnAlias } from '../classes/highcharts/helpers/dataLabels/HighchartsDataLabelsHelpers'

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
            measureOptions: [] as { column: IWidgetColumn; seriesName: string; label: string }[],
            activeMeasureNames: [] as string[],
            measureSelectionInitialized: false,
            originalWidgetMeasures: [] as string[], // Track measures that were in the original widget model
            cachedData: null as any, // Cache for fetched data with all measures
            showMeasurePanel: false,
            isDragging: false,
            panelPosition: { x: 0, y: 0 },
            dragStart: { x: 0, y: 0 },
            thresholdMessageShown: false
        }
    },
    watch: {
        dataToShow() {
            // Reset cached data when original data changes
            this.cachedData = null
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

        // Cleanup drag event listeners
        document.removeEventListener('mousemove', this.onDrag)
        document.removeEventListener('mouseup', this.stopDrag)
    },
    computed: {
        ...mapState(store, ['dashboards']),
        panelStyle() {
            return {
                transform: `translate(${this.panelPosition.x}px, ${this.panelPosition.y}px)`
            }
        },
        showMeasureTogglePanel() {
            // Only show panel if explicitly enabled (true), not when undefined or false
            const isEnabled = this.widgetModel?.settings?.series?.showMeasureToggle === true

            // For single-measure charts, show if we have at least 1 measure option
            // For multi-measure charts, show if we have more than 1 measure option
            const hasEnoughOptions = this.isSingleMeasureChart
                ? this.measureOptions.length >= 1
                : this.measureOptions.length > 1

            return isEnabled && hasEnoughOptions
        },
        isSingleMeasureChart() {
            // Chart types that support only one measure at a time
            const singleMeasureTypes = ['pie', 'gauge', 'solidgauge', 'activitygauge']
            return singleMeasureTypes.includes(this.chartModel?.chart?.type)
        }
    },
    methods: {
        ...mapActions(store, ['setSelections', 'getDatasetLabel', 'getDashboardDatasets', 'getDashboardDrivers', 'getAllDatasets']),
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
            this.syncMeasureOptions()
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

            // Create a temporary widget model with selected measures from availableMeasures
            const tempWidgetModel = this.getTempWidgetModelWithActiveMeasures()

            // Use cached data if available, otherwise use the original dataToShow
            const dataToUse = this.cachedData || this.dataToShow

            this.widgetModel.settings.chartModel.setData(dataToUse, tempWidgetModel, this.variables)

            this.widgetModel.settings.chartModel.updateSeriesAccessibilitySettings(tempWidgetModel)
            if (!['heatmap', 'dependencywheel', 'sankey', 'spline'].includes(this.chartModel.chart.type)) this.widgetModel.settings.chartModel.updateSeriesLabelSettings(tempWidgetModel)
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
        getTempWidgetModelWithActiveMeasures() {
            // If measure toggle is explicitly disabled or not initialized, use original model
            if (this.widgetModel.settings?.series?.showMeasureToggle === false || !this.measureSelectionInitialized) {
                return this.widgetModel
            }

            // If no measure options available, use original model
            if (this.measureOptions.length === 0) {
                return this.widgetModel
            }

            // Create a deep copy to avoid modifying the original
            const tempModel = JSON.parse(JSON.stringify(this.widgetModel))

            // Get columns that correspond to active measures
            // Even if activeMeasureNames is empty, we want to show NO measures (not fall back to original)
            const activeColumns = this.measureOptions
                .filter((option) => this.activeMeasureNames.includes(option.seriesName))
                .map((option) => option.column)

            // Keep all non-measure columns, and add only active measure columns
            const nonMeasureColumns = this.widgetModel.columns.filter((col: IWidgetColumn) => col.fieldType !== 'MEASURE')

            // If no active measures, set columns to only non-measure columns (this will show empty chart)
            tempModel.columns = [...nonMeasureColumns, ...activeColumns]

            return tempModel
        },
        syncMeasureOptions() {
            const seriesAliases = this.widgetModel.settings?.series?.aliases ?? []
            const availableMeasures = this.widgetModel.settings?.series?.availableMeasures ?? []

            // Get all measures to show based on availableMeasures setting
            let measuresToShow: IWidgetColumn[] = []

            if (availableMeasures.length > 0) {
                // Show ALL measures from availableMeasures (from dataset)
                const allDatasets = this.getAllDatasets()
                const currentDataset = allDatasets.find((ds: any) => ds.id.dsId === this.widgetModel.dataset)

                if (currentDataset && currentDataset.metadata && currentDataset.metadata.fieldsMeta) {
                    // Get dataset measures that are in availableMeasures
                    const datasetMeasureFields = currentDataset.metadata.fieldsMeta.filter(
                        (field: any) => field.fieldType === 'MEASURE' && availableMeasures.includes(field.name)
                    )

                    // Map to widget column format
                    measuresToShow = datasetMeasureFields.map((field: any) => {
                        // Check if measure already exists in widget columns
                        const existingColumn = this.widgetModel.columns.find(
                            (col: IWidgetColumn) => col.columnName === field.name
                        )

                        if (existingColumn) {
                            return existingColumn
                        } else {
                            // Create temporary column representation for dataset measure
                            const tempColumn = {
                                id: `temp_${field.name}_${Date.now()}`, // Add unique ID
                                columnName: field.name,
                                alias: field.alias || field.name,
                                fieldType: 'MEASURE',
                                aggregation: field.aggregation || 'SUM',
                                aggregationColumn: field.name,
                                type: field.type,
                                multiValue: false,
                                filter: { enabled: false, operator: '', value: '' }
                            } as IWidgetColumn

                            return tempColumn
                        }
                    })
                }
            } else {
                // Fallback: show all widget measures if availableMeasures not configured
                measuresToShow = this.widgetModel.columns.filter(
                    (column: IWidgetColumn) =>
                        column.fieldType === 'MEASURE' &&
                        (!column.axis || ['Y', 'start'].includes(column.axis))
                )
            }

            this.measureOptions = measuresToShow.map((column: IWidgetColumn) => {
                const aliasFromSettings = getColumnAlias(column, seriesAliases)
                // Priority: alias from settings > column alias > column name
                const finalSeriesName = aliasFromSettings || column.alias || column.columnName || 'Unknown'
                const label = column.alias || column.columnName || 'Unknown'

                return {
                    column,
                    seriesName: finalSeriesName,
                    label
                }
            })

            if (!this.measureSelectionInitialized) {

                // Store the original widget measures (for data availability check)
                const widgetMeasureNames = this.widgetModel.columns
                    .filter((col: IWidgetColumn) => col.fieldType === 'MEASURE')
                    .map((col: IWidgetColumn) => getColumnAlias(col, seriesAliases) || col.columnName)

                this.originalWidgetMeasures = [...widgetMeasureNames]
                // ALWAYS activate only measures that exist in the widget model
                // The panel will show ALL measures from availableMeasures, but only widget measures are initially active
                const measuresToActivate = this.measureOptions
                    .filter((option) => widgetMeasureNames.includes(option.seriesName))
                    .map((option) => option.seriesName)

                // For single-measure charts (pie, gauge), select only the first measure with data
                if (this.isSingleMeasureChart && measuresToActivate.length > 0) {
                    this.activeMeasureNames = [measuresToActivate[0]]
                } else if (measuresToActivate.length > 0) {
                    // For multi-measure charts, activate all widget measures
                    this.activeMeasureNames = measuresToActivate
                } else {
                    // No measures with data available
                    this.activeMeasureNames = []
                }

                this.measureSelectionInitialized = true
                return
            }

            // When already initialized, keep the current selection but validate it's still valid
            const validSeries = new Set(this.measureOptions.map((option) => option.seriesName))

            // Only keep active measures that are still valid
            this.activeMeasureNames = this.activeMeasureNames.filter((name) => validSeries.has(name))
        },
        async onMeasureToggle(seriesName: string, isChecked: boolean) {
            this.measureSelectionInitialized = true

            if (isChecked) {
                // Add to active measures (only visual filter, no model modification)
                if (!this.activeMeasureNames.includes(seriesName)) {
                    this.activeMeasureNames.push(seriesName)
                }

                // Check if this measure is in the original widget model
                const isInOriginalModel = this.originalWidgetMeasures.includes(seriesName)

                if (!isInOriginalModel) {
                    // Need to fetch data for this measure
                    await this.fetchDataWithMeasures(this.activeMeasureNames)
                    // After fetching, update the chart
                    this.updateChartModel()
                    return
                } else {
                    // Measure is in original model
                    // If we have cached data, check if we need to refetch or can use original data
                    const hasNonOriginalMeasures = this.activeMeasureNames.some(
                        (name) => !this.originalWidgetMeasures.includes(name)
                    )

                    if (hasNonOriginalMeasures && !this.cachedData) {
                        // We have some non-original measures selected but no cached data yet
                        // Need to fetch data with all active measures
                        await this.fetchDataWithMeasures(this.activeMeasureNames)
                        this.updateChartModel()
                        return
                    }
                }
            } else {
                // Remove from active measures
                this.activeMeasureNames = this.activeMeasureNames.filter((name) => name !== seriesName)

                // Check if all remaining active measures are in the original model
                const allActiveInOriginal = this.activeMeasureNames.every(
                    (name) => this.originalWidgetMeasures.includes(name)
                )

                // If all remaining measures are in original model, we can clear the cache and use original data
                if (allActiveInOriginal) {
                    this.cachedData = null
                }
            }

            this.updateChartModel()
        },
        async onSingleMeasureChange() {
            this.measureSelectionInitialized = true

            const selectedMeasure = this.activeMeasureNames[0]

            // Check if this measure is in the original widget model
            const isInOriginalModel = this.originalWidgetMeasures.includes(selectedMeasure)

            if (!isInOriginalModel) {
                // Need to fetch data for this measure
                await this.fetchDataWithMeasures([selectedMeasure])
            } else {
                // Measure is in original model, clear cache and use original data
                this.cachedData = null
            }

            // Update the chart
            this.updateChartModel()
        },
        async fetchDataWithMeasures(measureNames: string[]) {

            try {
                // Create a temporary widget model with all requested measures
                const tempWidgetModel = JSON.parse(JSON.stringify(this.widgetModel))

                // Get all non-measure columns
                const nonMeasureColumns = this.widgetModel.columns.filter(
                    (col: IWidgetColumn) => col.fieldType !== 'MEASURE'
                )

                // Get measure columns for the requested measures
                const measureColumns = this.measureOptions
                    .filter((option) => measureNames.includes(option.seriesName))
                    .map((option) => option.column)


                // Update temp model columns
                tempWidgetModel.columns = [...nonMeasureColumns, ...measureColumns]

                // Fetch data with the new columns
                const dashboardDatasets = this.getDashboardDatasets(this.dashboardId)
                const newData = await getWidgetData(
                    this.dashboardId,
                    tempWidgetModel,
                    dashboardDatasets,
                    this.$http,
                    false,
                    this.propActiveSelections,
                    { searchText: '', searchColumns: [] },
                    this.dashboards[this.dashboardId].configuration,
                    null,
                    false,
                    null,
                    this.drillLevel,
                    null
                )

                // Store the fetched data
                this.cachedData = newData

                return newData
            } catch (error: any) {
                this.setError({
                    title: this.$t('common.toast.errorTitle'),
                    msg: error ? error.message : 'Failed to fetch data for selected measures'
                })
            }
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
        },
        startDrag(event: MouseEvent) {
            // Only start drag if not clicking on interactive elements
            const target = event.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'LABEL' || target.tagName === 'SPAN') {
                if (!target.classList.contains('measure-toggle-panel__drag-handle')) return
            }

            this.isDragging = true
            this.dragStart = {
                x: event.clientX - this.panelPosition.x,
                y: event.clientY - this.panelPosition.y
            }

            document.addEventListener('mousemove', this.onDrag)
            document.addEventListener('mouseup', this.stopDrag)
            event.preventDefault()
        },
        onDrag(event: MouseEvent) {
            if (!this.isDragging) return

            this.panelPosition = {
                x: event.clientX - this.dragStart.x,
                y: event.clientY - this.dragStart.y
            }
        },
        stopDrag() {
            this.isDragging = false
            document.removeEventListener('mousemove', this.onDrag)
            document.removeEventListener('mouseup', this.stopDrag)
        },
        togglePanel(event: MouseEvent) {
            // Prevent toggle if we're dragging
            const target = event.target as HTMLElement
            if (target.classList.contains('measure-toggle-panel__drag-handle')) return

            this.showMeasurePanel = !this.showMeasurePanel
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
    }
})
</script>

<style scoped lang="scss">
.highcharts-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.measure-toggle-panel {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    min-width: 140px;
    background: #ffffff;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    transition: box-shadow 0.2s ease;
    user-select: none;

    &.is-dragging {
        cursor: grabbing;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

        .measure-toggle-panel__header {
            cursor: grabbing;
        }
    }
}

.measure-toggle-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    cursor: grab;
    gap: 4px;

    &:active {
        cursor: grabbing;
    }
}

.measure-toggle-panel__drag-handle {
    font-size: 14px;
    color: #888;
    cursor: grab;
    line-height: 1;
    letter-spacing: -2px;

    &:active {
        cursor: grabbing;
    }
}

.measure-toggle-panel__chevron {
    margin-left: auto;
    font-size: 12px;
    pointer-events: none;
}

.measure-toggle-panel__body {
    padding: 4px 8px 8px;
}

.measure-toggle-panel__select {
    width: 100%;
    padding: 4px 6px;
    font-size: 12px;
    border: 1px solid #d0d0d0;
    border-radius: 3px;
    background-color: #ffffff;
    cursor: pointer;
    outline: none;

    &:focus {
        border-color: #007ad9;
        box-shadow: 0 0 0 2px rgba(0, 122, 217, 0.1);
    }

    &:hover {
        border-color: #b0b0b0;
    }
}

.measure-toggle-panel__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    margin-top: 4px;
    cursor: pointer;

    input[type="checkbox"] {
        cursor: pointer;
    }
}
</style>
