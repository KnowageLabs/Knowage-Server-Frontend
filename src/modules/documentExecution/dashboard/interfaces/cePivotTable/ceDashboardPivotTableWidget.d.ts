import { IWidgetBackgroundStyle, IWidgetBordersStyle, IWidgetExports, IWidgetInteractions, IWidgetPaddingStyle, IWidgetResponsive, IWidgetShadowsStyle, IWidgetTitle, IWidgetColumn } from '../../Dashboard'

export interface ICePivotTableSettings {
    updatable: boolean
    clickable: boolean
    conditionalStyles: ICePivotTableWidgetConditionalStyles
    configuration: ICePivotTableConfiguration
    visualization: ICePivotTableWidgetVisualization
    interactions: IWidgetInteractions
    style: ICePivotTableStyle
    responsive: IWidgetResponsive
}

export interface ICePivotTableWidgetConditionalStyles {
    enabled: boolean
    conditions: ICePivotTableWidgetConditionalStyle[]
}

export interface ICePivotTableWidgetVisualization {
    visualizationTypes: ICePivotTableWidgetVisualizationTypes
}

export interface ICePivotTableWidgetVisualizationTypes {
    enabled: boolean
    types: ICePivotTableWidgetVisualizationType[]
}

export interface ICePivotTableWidgetVisualizationType {
    target: string | string[]
    prefix: string
    suffix: string
    precision: number
    type: string
}

export interface ICePivotTableWidgetConditionalStyle {
    target: string
    condition: {
        operator: string
        value: number | null
    }
    properties: {
        'text-align': string
        'font-family': string
        'font-size': string
        'font-style': string
        'font-weight': string
        color: string
        'background-color': string
        icon: string
    }
}

export interface ICePivotTableConfiguration {
    rows: IPivotRowsConfiguration
    columns: IPivotColumnsConfiguration
    exports: IWidgetExports
    fieldPicker: IPivotFieldPicker
    fieldPanel: IPivotFieldPanel
}

export interface ICePivotTableStyle {
    title: IWidgetTitle
    fields: ICePivotTableColumnStyles
    fieldHeaders: ICePivotTableColumnStyles
    borders: IWidgetBordersStyle
    background: IWidgetBackgroundStyle
    padding: IWidgetPaddingStyle
    shadows: IWidgetShadowsStyle
    totals: IPivotTotal
    subTotals: IPivotTotal
    crossTabHeaders: IPivotTotal
}

export interface IPivotFields {
    columns: IWidgetColumn[]
    rows: IWidgetColumn[]
    data: IWidgetColumn[]
    filters: IWidgetColumn[]
}

export interface IPivotRowsConfiguration {
    grandTotal: boolean
    subTotal: boolean
    grandTotalLabel: string
    subTotalLabel: string
}

export interface IPivotColumnsConfiguration {
    grandTotal: boolean
    subTotal: boolean
    grandTotalLabel: string
    subTotalLabel: string
}

export interface IPivotFieldPicker {
    enabled: boolean
    width: number
    height: number
}

export interface IPivotFieldPanel {
    enabled: boolean
}
export interface IPivotTooltips {
    target: string | string[]
    enabled: boolean
    prefix: string
    suffix: string
    precision: number
    header: {
        enabled: boolean
        text: string
    }
}
export interface IPivotTotal {
    enabled: boolean
    properties: {
        'font-weight': string
        'font-style': string
        'font-size': string
        'font-family': string
        'text-align': string
        color: string
        'background-color': string
    }
}

export interface ICePivotTableColumnStyles {
    enabled: boolean
    styles: ICePivotTableColumnStyle[]
}

export interface ICePivotTableColumnStyle {
    target: string | string[]
    properties: {
        'background-color': string
        color: string
        'text-align': string
        'font-size': string
        'font-family': string
        'font-style': string
        'font-weight': string
    }
}
