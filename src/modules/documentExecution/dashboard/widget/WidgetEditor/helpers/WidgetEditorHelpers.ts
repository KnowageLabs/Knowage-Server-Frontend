import { createNewDiscoveryWidgetSettings } from './discoveryWidget/DiscoveryWidgetFunctions'
import { IWidget, IWidgetColumn } from '../../../Dashboard'
import { formatTableWidgetForSave } from './tableWidget/TableWidgetBackendSaveHelper'
import { createNewTableWidgetSettings } from '../helpers/tableWidget/TableWidgetFunctions'
import { createNewSelectorWidgetSettings } from '../helpers/selectorWidget/SelectorWidgetFunctions'
import { createNewSelectionsWidgetSettings } from '../helpers/selectionsWidget/SelectionsWidgetFunctions'
import { createNewHtmlWidgetSettings } from './htmlWidget/HTMLWidgetFunctions'
import { createNewTextWidgetSettings } from './textWidget/TextWidgetFunctions'
import { createNewChartJSSettings, formatChartJSWidget } from './chartWidget/chartJS/ChartJSHelpers'
import { createNewHighchartsSettings, formatHighchartsWidget } from './chartWidget/highcharts/HighchartsHelpers'
import { formatHighchartsWidgetForSave } from './chartWidget/highcharts/HighchartsBackendSaveHelper'
import { formatChartJSForSave } from './chartWidget/chartJS/ChartJSBackendSaveHelper'
import { createNewImageWidgetSettings } from './imageWidget/ImageWidgetFunctions'
import { createNewCustomChartSettings } from './customchart/CustomChartFunctions'
import { createNewPivotTableWidgetSettings } from './pivotTableWidget/PivotTableFunctions'
import deepcopy from 'deepcopy'
import useStore from '@/App.store'
import { createNewMapWidgetSettings } from './mapWidget/MapWidgetFunctions'
import { createCeNewPivotTableWidgetSettings } from './cePivotTableWidget/cePivotTableFunctions'
import { createNewPythonWidgetSettings } from './pythonWidget/PythonWidgetFunctions'
import { createNewSpacerWidgetSettings } from './spacerWidget/SpacerWidgetFunctions'
import { addWidgetMenuConfig } from '../../../DashboardHelpers'
import tableDescriptor from '../WidgetEditorSettingsTab/TableWidget/TableWidgetSettingsDescriptor.json'
import selectorDescriptor from '../WidgetEditorSettingsTab/SelectorWidget/SelectorWidgetSettingsDescriptor.json'
import selectionsDescriptor from '../WidgetEditorSettingsTab/SelectionsWidget/SelectionsWidgetSettingsDescriptor.json'
import htmlDescriptor from '../WidgetEditorSettingsTab/HTMLWidget/HTMLWidgetSettingsDescriptor.json'
import customDashboardHeaderDescriptor from '../WidgetEditorSettingsTab/HTMLWidget/CustomDashboardHeaderDescriptor.json'
import textDescriptor from '../WidgetEditorSettingsTab/TextWidget/TextWidgetSettingsDescriptor.json'
import chartJSDescriptor from '../WidgetEditorSettingsTab/ChartWidget/chartJS/ChartJSWidgetSettingsDescriptor.json'
import HighchartsPieSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsPieSettingsDescriptor.json'
import HighchartsGaugeSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsGaugeSettingsDescriptor.json'
import HighchartsActivityGaugeSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsActivityGaugeSettingsDescriptor.json'
import HighchartsSolidGaugeSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsSolidGaugeSettingsDescriptor.json'
import HighchartsHeatmapSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsHeatmapSettingsDescriptor.json'
import HighchartsRadarSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsRadarSettingsDescriptor.json'
import HighchartsBarSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsBarSettingsDescriptor.json'
import HighchartsBubbleSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsBubbleSettingsDescriptor.json'
import HighchartsScatterSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsScatterSettingsDescriptor.json'
import HighchartsLineSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsLineSettingsDescriptor.json'
import HighchartsSunburstSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsSunburstSettingsDescriptor.json'
import HighchartsTreemapSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsTreemapSettingsDescriptor.json'
import HighchartsChordSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsChordSettingsDescriptor.json'
import HighchartsParallelSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsParallelSettingsDescriptor.json'
import HighchartsPictorialSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsPictorialSettingsDescriptor.json'
import HighchartsSankeySettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsSankeySettingsDescriptor.json'
import HighchartsFunnelSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsFunnelSettingsDescriptor.json'
import HighchartsDumbbellSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsDumbbellSettingsDescriptor.json'
import HighchartsStreamgraphSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsStreamgraphSettingsDescriptor.json'
import HighchartsPackedBubbleSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsPackedBubbleSettingsDescriptor.json'
import HighchartsWaterfallSettingsDescriptor from '../WidgetEditorSettingsTab/ChartWidget/highcharts/descriptors/HighchartsWaterfallSettingsDescriptor.json'
import imageDescriptor from '../WidgetEditorSettingsTab/ImageWidget/ImageWidgetSettingsDescriptor.json'
import customChartDescriptor from '../WidgetEditorSettingsTab/CustomChartWidget/CustomChartWidgetSettingsDescriptor.json'
import pivotTableDescriptor from '../WidgetEditorSettingsTab/PivotTableWidget/PivotTableSettingsDescriptor.json'
import cePivotTableDescriptor from '../WidgetEditorSettingsTab/cePivotTableWidget/cePivotTableSettingsDescriptor.json'
import discoveryDescriptor from '../WidgetEditorSettingsTab/DiscoveryWidget/DiscoveryWidgetSettingsDescriptor.json'
import mapWidgetDescriptor from '../WidgetEditorSettingsTab/MapWidget/MapSettingsDescriptor.json'
import pythonWidgetDescriptor from '../WidgetEditorSettingsTab/PythonWidget/PythonWidgetSettingsDescriptor.json'
import spacerDescriptor from '../WidgetEditorSettingsTab/SpacerWidget/SpacerWidgetSettingsDescriptor.json'

const store = useStore()

export function createNewWidget(type: string, dashboardModel: any) {
    const widget = {
        id: crypto.randomUUID(),
        new: true,
        type: type,
        dataset: null,
        columns: [],
        settings: {}
    } as IWidget
    if (widget.type === 'static-pivot-table' || widget.type === 'ce-pivot-table') widget.fields = { columns: [], rows: [], data: [], filters: [] }

    createNewWidgetSettings(widget, dashboardModel)
    addWidgetMenuConfig(widget)
    widget.settings.configuration.updateFromSelections = true

    if (store.isEnterprise && !widget.settings.style.themeId) widget.settings.style.themeId = dashboardModel?.configuration?.theme?.id ?? null

    return widget
}

export const createNewWidgetColumn = (eventData: any, widgetType: string) => {
    const tempColumn = {
        id: crypto.randomUUID(),
        columnName: eventData.name,
        alias: eventData.alias,
        type: eventData.type,
        fieldType: eventData.fieldType,
        filter: {}
    } as IWidgetColumn
    if (tempColumn.fieldType === 'MEASURE') tempColumn.aggregation = 'SUM'
    else if (widgetType === 'discovery' && tempColumn.fieldType === 'ATTRIBUTE') tempColumn.aggregation = 'COUNT'
    return tempColumn
}

export const createNewWidgetSettings = (widget: IWidget, dashboardModel: any) => {
    switch (widget.type) {
        case 'table':
            widget.settings = createNewTableWidgetSettings()
            break
        case 'selector':
            widget.settings = createNewSelectorWidgetSettings()
            break
        case 'selection':
            widget.settings = createNewSelectionsWidgetSettings()
            break
        case 'html':
            widget.settings = createNewHtmlWidgetSettings()
            break
        case 'text':
            widget.settings = createNewTextWidgetSettings()
            break
        case 'chartJS':
            widget.settings = createNewChartJSSettings()
            break
        case 'highcharts':
            widget.settings = createNewHighchartsSettings()
            break
        case 'image':
            widget.settings = createNewImageWidgetSettings()
            break
        case 'customchart':
            widget.settings = createNewCustomChartSettings()
            break
        case 'static-pivot-table':
            widget.settings = createNewPivotTableWidgetSettings()
            break
        case 'ce-pivot-table':
            widget.settings = createCeNewPivotTableWidgetSettings()
            break
        case 'discovery':
            widget.settings = createNewDiscoveryWidgetSettings()
            break
        case 'map':
            widget.layers = []
            widget.settings = createNewMapWidgetSettings()
            break
        case 'python':
            widget.settings = createNewPythonWidgetSettings()
            break
        case 'spacer':
            widget.settings = createNewSpacerWidgetSettings()
            break
    }
}

export function formatWidgetForSave(tempWidget: IWidget) {
    if (!tempWidget) return null

    const widget = deepcopy(tempWidget)

    switch (widget.type) {
        case 'table':
            formatTableWidgetForSave(widget)
            break
        case 'highcharts':
            formatHighchartsWidgetForSave(widget)
            break
        case 'chartJS':
            formatChartJSForSave(widget)
            break
    }
    ;['state', 'search', 'invalid'].forEach((property: string) => delete widget[property])
    return widget
}

export function getRGBColorFromString(color: string) {
    const temp = color
        ?.trim()
        ?.substring(5, color.length - 1)
        ?.split(',')

    const alpha = isNaN(+temp[3]) ? 1 : +temp[3]
    if (temp) {
        return { r: +temp[0], g: +temp[1], b: +temp[2], a: alpha }
    } else return { r: 0, g: 0, b: 0, a: 0 }
}

export const recreateKnowageChartModel = (widget: IWidget) => {
    if (widget.type === 'chartJS') formatChartJSWidget(widget)
    else if (widget.type === 'highcharts' && store.user.enterprise) formatHighchartsWidget(widget)
}

function getScatterChartDescriptor(isJittered: boolean) {
    const descriptor = deepcopy(HighchartsScatterSettingsDescriptor)
    if (!isJittered) descriptor.settings.Configuration = descriptor.settings.Configuration.filter((item) => item.type !== 'JitterSettings')
    return descriptor
}

export const getSettingsDescriptor = (widget: any) => {
    const widgetType = widget.type
    switch (widgetType) {
        case 'table':
            return tableDescriptor
        case 'selector':
            return selectorDescriptor
        case 'selection':
            return selectionsDescriptor
        case 'html':
            return widget.settings.isCustomDashboardHeader ? { ...customDashboardHeaderDescriptor } : { ...htmlDescriptor }
        case 'customDashboardHeader':
            return customDashboardHeaderDescriptor
        case 'text':
            return textDescriptor
        case 'chartJS':
            return chartJSDescriptor
        case 'highcharts':
            const chartType = widget.settings?.chartModel?.model?.chart?.type
            switch (chartType) {
                case 'pie':
                    return HighchartsPieSettingsDescriptor
                case 'gauge':
                    return HighchartsGaugeSettingsDescriptor
                case 'activitygauge':
                    return HighchartsActivityGaugeSettingsDescriptor
                case 'solidgauge':
                    return HighchartsSolidGaugeSettingsDescriptor
                case 'heatmap':
                    return HighchartsHeatmapSettingsDescriptor
                case 'radar':
                    return HighchartsRadarSettingsDescriptor
                case 'area':
                case 'bar':
                case 'column':
                    return HighchartsBarSettingsDescriptor
                case 'bubble':
                    return HighchartsBubbleSettingsDescriptor
                case 'scatter':
                    const isJittered = widget.settings?.chartModel?.model?.plotOptions?.scatter?.jitter ?? false
                    return getScatterChartDescriptor(isJittered)
                case 'line':
                    return HighchartsLineSettingsDescriptor
                case 'treemap':
                    return HighchartsTreemapSettingsDescriptor
                case 'sunburst':
                    return HighchartsSunburstSettingsDescriptor
                case 'dependencywheel':
                    return HighchartsChordSettingsDescriptor
                case 'spline':
                    return HighchartsParallelSettingsDescriptor
                case 'pictorial':
                    return HighchartsPictorialSettingsDescriptor
                case 'sankey':
                    return HighchartsSankeySettingsDescriptor
                case 'funnel':
                    return HighchartsFunnelSettingsDescriptor
                case 'dumbbell':
                    return HighchartsDumbbellSettingsDescriptor
                case 'streamgraph':
                    return HighchartsStreamgraphSettingsDescriptor
                case 'packedbubble':
                    return HighchartsPackedBubbleSettingsDescriptor
                case 'waterfall':
                    return HighchartsWaterfallSettingsDescriptor
            }
        case 'image':
            return imageDescriptor
        case 'customchart':
            return customChartDescriptor
        case 'static-pivot-table':
            return pivotTableDescriptor
        case 'ce-pivot-table':
            return cePivotTableDescriptor
        case 'discovery':
            return discoveryDescriptor
        case 'map':
            return mapWidgetDescriptor
        case 'python':
            return pythonWidgetDescriptor
        case 'spacer':
            return spacerDescriptor
    }
}
