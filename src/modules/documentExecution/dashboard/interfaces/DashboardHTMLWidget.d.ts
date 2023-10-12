import { IWidgetBackgroundStyle, IWidgetBordersStyle, IWidgetExports, IWidgetInteractions, IWidgetPaddingStyle, IWidgetResponsive, IWidgetShadowsStyle, IWidgetTitle } from "../Dashboard";

export interface IHTMLWidgetSettings {
    sortingColumn?: string,
    sortingOrder?: string,
    updatable: boolean,
    clickable: boolean,
    editor: IHTMLWidgetEditor,
    configuration: IHTMLWidgetConfiguration,
    interactions: IWidgetInteractions,
    style: IHTMLWidgetStyle,
    responsive: IWidgetResponsive
}

export interface IHTMLWidgetEditor {
    css: string,
    html: string
}

export interface IHTMLWidgetConfiguration {
    exports: IWidgetExports
}

export interface IHTMLWidgetStyle {
    themeName: string
    title: IWidgetTitle,
    padding: IWidgetPaddingStyle,
    borders: IWidgetBordersStyle,
    shadows: IWidgetShadowsStyle,
    background: IWidgetBackgroundStyle
}

