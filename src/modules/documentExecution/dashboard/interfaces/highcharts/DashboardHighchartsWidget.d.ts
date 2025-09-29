import { IWidgetExports, IWidgetTitle, IWidgetPaddingStyle, IWidgetBordersStyle, IWidgetShadowsStyle, IWidgetBackgroundStyle, IDatasetColumn, IWidgetColumn } from './../../Dashboard.d'
import { IWidgetInteractions, IWidgetResponsive } from '../../Dashboard'

export interface IHighchartsWidgetSettings {
    updatable: boolean
    clickable: boolean
    chartModel: IHighchartsChartModel | null
    configuration: IHighchartsWidgetConfiguration
    accesssibility: IHighchartsWidgetAccessibility
    series: IHighchartsSeriesSetting
    interactions: IWidgetInteractions
    chart: IHighchartsChartSettings
    style: IHighchartsWidgetStyle
    responsive: IWidgetResponsive
    advancedSettings?: IHighchartsAdvancedPropertySettings[]
}

export interface IDrillOrderItem {
    orderColumnId: string
    orderColumn: string
    orderType: 'ASC' | 'DESC' | ''
}

export interface IHighchartsWidgetConfiguration {
    datetypeSettings?: any
    splitting?: any
    grouping?: any
    centerText?: any
    limit?: any
    axisLines?: any
    exports: IWidgetExports
}

export interface IHighchartsWidgetAccessibility {
    seriesAccesibilitySettings: ISerieAccessibilitySetting[]
}

export interface ISerieAccessibilitySetting {
    names: string[]
    accessibility: IHighchartsSerieAccessibility
}

export interface IHighchartsSeriesSetting {
    seriesSettings: IHighchartsSeriesLabelsSetting[]
    conditionalStyles?: any
    aliases: { column: IWidgetColumn | null; alias: string }[]
}

export interface IHighchartsSeriesLabelsSetting {
    names: string[]
    label: IHighchartsSerieLabelSettings
    dial?: any
    pivot?: any
    serieColor?: string
    serieColorEnabled?: boolean
    type?: string
}

export interface IHighchartsSerieLabelSettings {
    enabled: boolean
    style: {
        fontFamily: string
        fontSize: string
        fontWeight: string
        color: string
        textOutline?: string
    }
    backgroundColor: string
    prefix: string
    suffix: string
    scale: string
    precision: number
    absolute: boolean
    percentage: boolean
}

export interface IHighchartsWidgetStyle {
    themeId: number | null
    title: IWidgetTitle
    padding: IWidgetPaddingStyle
    borders: IWidgetBordersStyle
    shadows: IWidgetShadowsStyle
    background: IWidgetBackgroundStyle
}

export interface IHighchartsChartModel {
    title: {
        text: string
    }
    lang: {
        noData: string
    }
    chart: {
        options3d: IHighchartsOptions3D
        type: string
        backgroundColor?: any
        polar?: boolean
        events?: any
        parallelCoordinates?: any
        parallelAxes?: any
        inverted?: any
    }
    noData: IHighchartsNoDataConfiguration
    accessibility: IHighchartsAccessibilitySettings
    series: any[]
    plotOptions: {
        pie?: any
        gauge?: any
        solidgauge?: any
        heatmap?: any
        line?: any
        scatter?: any
        dependencywheel?: any
        sankey?: any
        dumbbell?: any
        packedbubble?: any
        series?: any
    }
    legend: any
    tooltip: any
    colors: string[]
    credits: {
        enabled: boolean
    }
    pane?: any
    xAxis?: any
    yAxis?: any
    colorAxis?: { stops: any[] }
    seriesForRender?: any[]
    sonification?: any
    annotations: IHighchartsAnnotation[]
}

export interface IHighchartsOptions3D {
    enabled: boolean
    alpha: number
    beta: number
    viewDistance: number
    depth: number
}

export interface IHighchartsNoDataConfiguration {
    position: {
        align: string
        verticalAlign: string
    }
    style: {
        fontFamily: string
        fontSize: string
        fontWeight: string
        color: string
        backgroundColor: string
    }
}

export interface IHighchartsAccessibilitySettings {
    enabled: boolean
    description: string
    keyboardNavigation: {
        enabled: boolean
        order: string[]
    }
}

export interface IHighchartsChartDataLabels {
    enabled: boolean
    distance?: number
    style: {
        fontFamily: string
        fontSize: string
        fontWeight: string
        color: string
        textOutline: string
    }
    position: string
    backgroundColor: string | null
    linecap?: string
    stickyTracking?: boolean
    rounded?: boolean
    format?: string
    formatter?: Function
    formatterText?: string
    formatterError?: string
    y?: number
}

export interface IHighchartsChartSerie {
    name: string
    data: IHighchartsChartSerieData[]
    accessibility?: IHighchartsSerieAccessibility
    colorByPoint?: boolean
    groupingFunction?: string
}

export interface IHighchartsChartSerieData {
    name: string
    y: number
    sliced?: boolean
    selected?: boolean
    dataLabels?: IHighchartsChartDataLabels
}

export interface IHighchartsSerieAccessibility {
    enabled: boolean
    description: string
    exposeAsGroupOnly: boolean
    keyboardNavigation: { enabled: boolean }
}

export interface IHighchartsLegend {
    enabled: boolean
    align: string
    verticalAlign: string
    layout: string
    itemStyle: {
        fontFamily: string
        fontSize: string
        fontWeight: string
        color: string
    }
    borderWidth: number
    backgroundColor: string
    borderColor: string
    labelFormat?: string
    labelFormatter?: Function
    labelFormatterText?: string
    labelFormatterError?: string
}

export interface IHighchartsTooltip {
    enabled: boolean
    valuePrefix?: string
    valueSuffix?: string
    valueDecimals?: number
    style: {
        fontFamily: string
        fontSize: string
        fontWeight: string
        color: string
    }
    backgroundColor: string
    formatter?: Function
    formatterText?: string
    formatterError?: string
    pointFormatter?: Function
    pointFormatterText?: string
    pointFormatterError?: string
}

export interface IHighchartsChartSettings {
    colors: string[]
}

export interface IHighchartsDrilldown {
    enabled: boolean
}

export interface IHighchartsAdvancedPropertySettings {
    propertyPath: string
    propertyValue: string
}

export interface IHighchartsMarkerSettings {
    symbol: string | undefined
    fillColor: string | undefined
    radius: number
}

export interface IHighchartsConnectorSettings {
    connectorColor: string | undefined
    connectorWidth: number | undefined
}

export interface IHighchartsAnnotation {
    labels: {
        point: {
            x: number
            y: number
        }
        text: string
    }[]
}
