import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { KnowageHighchartsPieChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsPieChart'
import { IHighchartsChartModel, IHighchartsWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { KnowageHighchartsActivityGaugeChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsActivityGaugeChart'
import { KnowageHighchartsSolidGaugeChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsSolidGaugeChart'
import { KnowageHighchartsGaugeSeriesChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsGaugeSeriesChart'
import { KnowageHighchartsHeatmapChart } from './../../../../ChartWidget/classes/highcharts/KnowageHighchartsHeatmapChart'
import { KnowageHighchartsRadarChart } from './../../../../ChartWidget/classes/highcharts/KnowageHighchartsRadarChart'
import { KnowageHighchartsBarChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsBarChart'
import { KnowageHighchartsLineChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsLineChart'
import { KnowageHighchartsScatterChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsScatterChart'
import { KnowageHighchartsTreemapChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsTreemapChart'
import { KnowageHighchartsSunburstChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsSunburstChart'
import { KnowageHighchartsBubbleChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsBubbleChart'
import { KnowageHighchartsChordChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsChordChart'
import { KnowageHighchartsParallelChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsParallelChart'
import * as widgetCommonDefaultValues from '../../common/WidgetCommonDefaultValues'
import * as highchartsDefaultValues from '../highcharts/HighchartsDefaultValues'
import descriptor from '../../../WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'
import { KnowageHighchartsPictorialChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsPictorialChart'
import { KnowageHighchartsSankeyChart } from '../../../../ChartWidget/classes/highcharts/KnowageHighchartsSankeyChart'

export const createNewHighchartsSettings = () => {
    const settings = {
        updatable: true,
        clickable: true,
        chartModel: null,
        configuration: { exports: { showExcelExport: true, showScreenshot: true }, datetypeSettings: highchartsDefaultValues.getDefaultDateTypeSettings(), grouping: { enabled: false, secondSeries: { enabled: false }, secondDimension: { enabled: false, serie: '' } }, limit: { enabled: true, itemsNumber: 5 }, axisLines: { color: '', crosshairColor: '', crosshairWidth: 8 } },
        accesssibility: { seriesAccesibilitySettings: getSeriesAccesibilitySettings() },
        series: { seriesSettings: getSerieSettings(), conditionalStyles: { enabled: false, conditions: [widgetCommonDefaultValues.getDefaultConditionalStyles()] } },
        interactions: {
            drilldown: { enabled: false },
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            link: widgetCommonDefaultValues.getDefaultLinks(),
            preview: widgetCommonDefaultValues.getDefaultPreview(),
            selection: highchartsDefaultValues.getDefaultHighchartsSelections()
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
    const isStacking = chartModel.plotOptions?.series?.stacking
    const isInverted = chartModel.chart.inverted
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
            widget.settings.chartModel = new KnowageHighchartsBarChart(chartModel, 'area', isStacking)
            break
        case 'bar':
            widget.settings.chartModel = new KnowageHighchartsBarChart(chartModel, 'bar', isStacking)
            break
        case 'column':
            widget.settings.chartModel = new KnowageHighchartsBarChart(chartModel, 'column', isStacking)
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
            break
        case 'dependencywheel':
            widget.settings.chartModel = new KnowageHighchartsChordChart(chartModel)
            break
        case 'spline':
            widget.settings.chartModel = new KnowageHighchartsParallelChart(chartModel)
            break
        case 'pictorial':
            setPictorialSettings(widget)
            widget.settings.chartModel = new KnowageHighchartsPictorialChart(chartModel)
            break
        case 'sankey':
            widget.settings.chartModel = new KnowageHighchartsSankeyChart(chartModel, isInverted)
            break
    }
}

export const createNewHighchartsModel = (widget: IWidget, chartType: string, model: IHighchartsChartModel | null = null, isStacked: boolean, isInverted: boolean) => {
    console.log('------ IS INVERTED: ', isInverted)
    console.log('------ IS chartType: ', chartType)
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
            return new KnowageHighchartsBarChart(model, 'area', isStacked)
        case 'bar':
            return new KnowageHighchartsBarChart(model, 'bar', isStacked)
        case 'column':
            return new KnowageHighchartsBarChart(model, 'column', isStacked)
        case 'bubble':
            return new KnowageHighchartsBubbleChart(model)
        case 'scatter':
            return new KnowageHighchartsScatterChart(model)
        case 'line':
            return new KnowageHighchartsLineChart(model)
        case 'treemap':
            return new KnowageHighchartsTreemapChart(model)
        case 'sunburst':
            return new KnowageHighchartsSunburstChart(model)
        case 'dependencywheel':
            return new KnowageHighchartsChordChart(model)
        case 'spline':
            return new KnowageHighchartsParallelChart(model)
        case 'pictorial':
            setPictorialSettings(widget)
            return new KnowageHighchartsPictorialChart(model)
        case 'sankey':
        case 'sankeyInverted':
            return new KnowageHighchartsSankeyChart(model, isInverted)
        default:
            return null
    }
}

const setPictorialSettings = (widget: IWidget) => {
    if (!widget.settings.configuration.svgSettings) widget.settings.configuration.svgSettings = {
        definition: 'M480.15 0.510986V0.531986C316.002 0.531986 197.223 56.655 119.105 139.78C40.987 222.905 3.50699 332.801 0.884992 440.062C-1.74001 547.459 36.194 644.769 79.287 725.354C122.38 805.938 170.742 870.203 188.861 909.922C205.994 947.479 203.626 990.232 206.788 1033.17C209.95 1076.11 219.126 1119.48 260.261 1156.26C260.888 1156.83 261.679 1157.18 262.52 1157.27C262.639 1157.28 262.75 1157.28 262.87 1157.29L262.747 1173.69L274.021 1200.24C275.812 1214.45 275.053 1222.2 273.364 1229.45C261.44 1238.59 250.866 1253.57 283.323 1261.97V1283.88C249.425 1299.28 261.103 1315.14 283.323 1327.03L281.331 1342.96C249.673 1354.72 261.6 1377.5 282.645 1388.76V1403.36C256.094 1414.86 256.771 1436.12 283.323 1451.16V1473.73L349.035 1535.46L396.163 1582.58L397.498 1600.51H565.433V1585.91L619.193 1535.46C631.786 1531.75 660.881 1505.66 698.191 1468.41L702.729 1451.49L686.753 1440.38L687.226 1426.38C714.969 1420.61 718.256 1388.06 687.226 1382.78V1366.87C725.039 1359.03 715.965 1331.13 690.532 1325.04V1311.77C735.92 1292.94 715.774 1272.19 695.193 1267.29V1245.38C721.584 1240.94 721.209 1210.5 702.688 1201.19L711.107 1183.45L711.682 1162.54C713.198 1162.5 714.725 1162.46 716.241 1162.38C717.056 1162.36 717.845 1162.09 718.5 1161.6C754.295 1134.83 762.81 1094.37 765.299 1051.47C767.789 1008.58 764.577 962.629 775.69 923.173C788.878 876.344 833.216 822.264 875.654 750.885C918.093 679.505 958.46 590.459 963.133 472.719C967.812 354.836 929.374 236.776 848.507 148.143C767.638 59.511 644.344 0.516987 480.15 0.516987V0.510986Z'
    }
}

const getSeriesAccesibilitySettings = () => {
    return [{ names: ['all'], accessibility: highchartsDefaultValues.getDefaultSeriesAccessibilitySettings() }]
}

const getSerieSettings = () => {
    const serieLabelSettings = { names: ['all'], label: { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), enabled: true }, dial: highchartsDefaultValues.getDefaultSerieDialSettings(), pivot: highchartsDefaultValues.getDefaultSeriePivotSettings() }
    return [serieLabelSettings]
}
