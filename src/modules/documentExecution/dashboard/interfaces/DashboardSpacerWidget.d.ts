import { IWidgetBackgroundStyle, IWidgetBordersStyle, IWidgetPaddingStyle, IWidgetResponsive, IWidgetShadowsStyle, IWidgetTitle } from '../Dashboard'

export interface ISpacerWidgetSettings {
    configuration: ISpacerWidgetConfiguration
    style: ISpacerWidgetStyle
    responsive: IWidgetResponsive
}

export interface ISpacerWidgetConfiguration {
    updateFromSelections?: boolean
}

export interface ISpacerWidgetStyle {
    themeId: number | null
    title: IWidgetTitle
    padding: IWidgetPaddingStyle
    borders: IWidgetBordersStyle
    shadows: IWidgetShadowsStyle
    background: IWidgetBackgroundStyle
}
