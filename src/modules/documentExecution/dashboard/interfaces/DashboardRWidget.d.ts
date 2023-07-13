import { IWidgetBackgroundStyle, IWidgetBordersStyle, IWidgetExports, IWidgetInteractions, IWidgetPaddingStyle, IWidgetResponsive, IWidgetShadowsStyle, IWidgetTitle } from "../Dashboard"

export interface IRWidgetSettings {
    updatable: boolean,
    clickable: boolean,
    configuration: IRWidgetConfiguration,
    editor: IREditorSettings
    style: IRWidgetStyle,
    interactions: IWidgetInteractions,
    responsive: IWidgetResponsive
}

export interface IRWidgetConfiguration {
    exports: IWidgetExports
}

export interface IREditorSettings {
    environment: string,
    outputType: string,
    outputName: string,
    script: string
}

export interface IRWidgetStyle {
    title: IWidgetTitle,
    padding: IWidgetPaddingStyle,
    borders: IWidgetBordersStyle,
    shadows: IWidgetShadowsStyle,
    background: IWidgetBackgroundStyle
}
