import { IWidgetBackgroundStyle, IWidgetBordersStyle, IWidgetExports, IWidgetInteractions, IWidgetPaddingStyle, IWidgetResponsive, IWidgetShadowsStyle, IWidgetTitle } from "../Dashboard"

export interface IPythonWidgetSettings {
    updatable: boolean,
    clickable: boolean,
    configuration: IPythonWidgetConfiguration,
    editor: IPythonEditorSettings
    style: IPythonWidgetStyle,
    interactions: IWidgetInteractions,
    responsive: IWidgetResponsive
}

export interface IPythonWidgetConfiguration {
    exports: IWidgetExports
}

export interface IPythonEditorSettings {
    environment: string,
    outputType: string,
    outputName: string,
    script: string
}

export interface IPythonWidgetStyle {
    title: IWidgetTitle,
    padding: IWidgetPaddingStyle,
    borders: IWidgetBordersStyle,
    shadows: IWidgetShadowsStyle,
    background: IWidgetBackgroundStyle
}
