import { IWidgetBackgroundStyle, IWidgetBordersStyle, IWidgetExports, IWidgetInteractions, IWidgetPaddingStyle, IWidgetResponsive, IWidgetShadowsStyle, IWidgetTitle } from '../Dashboard'

export interface IHTMLWidgetSettings {
    sortingColumn?: string
    sortingOrder?: string
    updatable: boolean
    clickable: boolean
    editor: IHTMLWidgetEditor
    configuration: IHTMLWidgetConfiguration
    interactions: IWidgetInteractions
    style: IHTMLWidgetStyle
    responsive: IWidgetResponsive
}

export interface IHTMLWidgetEditor {
    css: string
    html: string
}

export interface IHTMLWidgetConfiguration {
    exports: IWidgetExports
    customDashboardHeaderConfiguration?: ICustomDashboardHeaderConfiguration
}

export interface IHTMLWidgetStyle {
    themeId: number | null
    title: IWidgetTitle
    padding: IWidgetPaddingStyle
    borders: IWidgetBordersStyle
    shadows: IWidgetShadowsStyle
    background: IWidgetBackgroundStyle
}

export interface ICustomDashboardHeaderConfiguration {
    height: string
}
