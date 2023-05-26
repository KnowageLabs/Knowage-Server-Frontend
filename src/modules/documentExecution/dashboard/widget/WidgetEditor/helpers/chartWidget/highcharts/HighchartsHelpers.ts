import { IWidget } from "@/modules/documentExecution/dashboard/Dashboard"
import { KnowageHighchartsPieChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsPieChart"
import { IHighchartsChartModel, IHighchartsWidgetSettings } from "@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget"
import { KnowageHighchartsActivityGaugeChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsActivityGaugeChart"
import { KnowageHighchartsSolidGaugeChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsSolidGaugeChart"
import { KnowageHighchartsGaugeSeriesChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsGaugeSeriesChart"
import { KnowageHighchartsHeatmapChart } from './../../../../ChartWidget/classes/highcharts/KnowageHighchartsHeatmapChart';
import { KnowageHighchartsRadarChart } from './../../../../ChartWidget/classes/highcharts/KnowageHighchartsRadarChart';
import { KnowageHighchartsBarChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsBarChart"
import * as widgetCommonDefaultValues from '../../common/WidgetCommonDefaultValues'
import * as  highchartsDefaultValues from "../highcharts/HighchartsDefaultValues"
import descriptor from '../../../WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'
import { KnowageHighchartsLineChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsLineChart"
import { KnowageHighchartsScatterChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsScatterChart"
import { KnowageHighchartsTreemapChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsTreemapChart"
import { KnowageHighchartsSunburstChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsSunburstChart"
import { KnowageHighchartsBubbleChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsBubbleChart"
import { KnowageHighchartsAreaChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsAreaChart"
import { KnowageHighchartsColumnChart } from "../../../../ChartWidget/classes/highcharts/KnowageHighchartsColumnChart"

export const createNewHighchartsSettings = () => {
    const settings = {
        updatable: true,
        clickable: true,
        chartModel: null,
        configuration: { exports: { showExcelExport: true, showScreenshot: true }, datetypeSettings: highchartsDefaultValues.getDefaultDateTypeSettings(), splitting: { enabled: false, groupedSerie: '' } },
        accesssibility: { seriesAccesibilitySettings: getSeriesAccesibilitySettings() },
        series: { seriesLabelsSettings: getSerieLabelsSettings() },
        interactions: {
            drilldown: { enabled: false },
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            link: widgetCommonDefaultValues.getDefaultLinks(),
            preview: widgetCommonDefaultValues.getDefaultPreview(),
            selection: highchartsDefaultValues.getDefaultHighchartsSelections(),
        },
        chart: { colors: descriptor.defaultColors },
        style: {
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as IHighchartsWidgetSettings
    settings.chartModel = null
    return settings
}

export const formatHighchartsWidget = (widget: IWidget) => {
    const chartModel = widget.settings.chartModel.model ?? widget.settings.chartModel
    const chartType = chartModel.chart.type
    switch (chartType) {
        case 'pie':
            widget.settings.chartModel = new KnowageHighchartsPieChart(chartModel)
            break
        case 'gauge':
            widget.settings.chartModel = new KnowageHighchartsGaugeSeriesChart(chartModel)
            break
        case 'activitygauge':
            widget.settings.chartModel = new KnowageHighchartsActivityGaugeChart(chartModel)
            break
        case 'solidgauge':
            widget.settings.chartModel = new KnowageHighchartsSolidGaugeChart(chartModel)
            break
        case 'heatmap':
            widget.settings.chartModel = new KnowageHighchartsHeatmapChart(chartModel)
            break
        case 'radar':
            widget.settings.chartModel = new KnowageHighchartsRadarChart(chartModel)
            break
        case 'area':
            widget.settings.chartModel = new KnowageHighchartsAreaChart(chartModel)
            break
        case 'bar':
            widget.settings.chartModel = new KnowageHighchartsBarChart(chartModel)
            break
        case 'column':
            widget.settings.chartModel = new KnowageHighchartsColumnChart(chartModel)
            break
        case 'bubble':
            widget.settings.chartModel = new KnowageHighchartsBubbleChart(chartModel)
            break
        case 'scatter':
            widget.settings.chartModel = new KnowageHighchartsScatterChart(chartModel)
            break
        case 'line':
            widget.settings.chartModel = new KnowageHighchartsLineChart(chartModel)
            break
        case 'treemap':
            widget.settings.chartModel = new KnowageHighchartsTreemapChart(chartModel)
            break
        case 'sunburst':
            widget.settings.chartModel = new KnowageHighchartsSunburstChart(chartModel)

    }

}

export const createNewHighchartsModel = (chartType: string, model: IHighchartsChartModel | null = null) => {
    switch (chartType) {
        case 'pie':
            return new KnowageHighchartsPieChart(model)
        case 'gauge':
            return new KnowageHighchartsGaugeSeriesChart(model)
        case 'activitygauge':
            return new KnowageHighchartsActivityGaugeChart(model)
        case 'solidgauge':
            return new KnowageHighchartsSolidGaugeChart(model)
        case 'heatmap':
            return new KnowageHighchartsHeatmapChart(model)
        case 'radar':
            return new KnowageHighchartsRadarChart(model)
        case 'area':
            return new KnowageHighchartsAreaChart(model)
        case 'bar':
            return new KnowageHighchartsBarChart(model)
        case 'column':
            return new KnowageHighchartsColumnChart(model)
        case 'bubble':
            return new KnowageHighchartsBarChart(model)
        case 'scatter':
            return new KnowageHighchartsBarChart(model)
        case 'line':
            return new KnowageHighchartsBarChart(model)
        case 'treemap':
            return new KnowageHighchartsBarChart(model)
        case 'sunburst':
            return new KnowageHighchartsBarChart(model)
        default:
            return null
    }
}

const getSeriesAccesibilitySettings = () => {
    return [{ names: ['all'], accessibility: highchartsDefaultValues.getDefaultSeriesAccessibilitySettings() }]
}

const getSerieLabelsSettings = () => {
    const serieLabelSettings = { names: ['all'], label: { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), enabled: true }, dial: highchartsDefaultValues.getDefaultSerieDialSettings(), pivot: highchartsDefaultValues.getDefaultSeriePivotSettings() }
    return [serieLabelSettings]
}