import { IWidget, IWidgetInteractions } from "../../Dashboard"
import { IPythonWidgetConfiguration, IPythonWidgetSettings } from "../../interfaces/DashboardPythonWidget"
import { IWidgetExports } from "../../Dashboard"
import { getFormattedStyle } from "./RWidgetStyleHelper"
import { getFormattedInteractions } from "../common/WidgetInteractionsHelper"
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as  rnWidgetDefaultValues from '../../widget/WidgetEditor/helpers/rWidget/RWidgetDefaultValues'

export const formatRWidget = (widget: any) => {
    console.log('----------- OLD R WIDGET: ', widget)
    const formattedWidget = {
        id: widget.id,
        dataset: null,
        type: widget.type,
        columns: [],
        theme: '',
        settings: {} as IPythonWidgetSettings
    } as IWidget
    formattedWidget.settings = getFormattedWidgetSettings(widget) as IPythonWidgetSettings
    console.log('----------- FORMATTED R WIDGET: ', formattedWidget)
    return formattedWidget
}


const getFormattedWidgetSettings = (widget: any) => {
    const formattedSettings = {
        updatable: widget.updateble,
        clickable: widget.cliccable,
        configuration: getFormattedConfiguration(widget),
        editor: getFormattedEditorSettings(widget),
        style: getFormattedStyle(widget),
        interactions: getFormattedInteractions(widget) as IWidgetInteractions,
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as IPythonWidgetSettings
    return formattedSettings
}

const getFormattedConfiguration = (widget: any) => {
    return {
        exports: { showExcelExport: widget.style?.showExcelExport ?? false, showScreenshot: widget.style?.showScreenshot ?? false } as IWidgetExports
    } as IPythonWidgetConfiguration
}

const getFormattedEditorSettings = (widget: any) => {
    const formattedEditor = rnWidgetDefaultValues.getDefaultEditorSettings()
    formattedEditor.environment = widget.RAddress ?? ''
    formattedEditor.outputType = widget.ROutputType ?? ''
    formattedEditor.outputName = widget.ROutput ?? ''
    formattedEditor.script = widget.RCode ?? ''
    return formattedEditor
}