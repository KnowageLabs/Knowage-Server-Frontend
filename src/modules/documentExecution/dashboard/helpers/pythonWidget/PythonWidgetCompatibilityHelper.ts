import { IWidget, IWidgetHelpSettings, IWidgetInteractions } from '../../Dashboard'
import { IPythonWidgetConfiguration, IPythonWidgetSettings } from '../../interfaces/DashboardPythonWidget'
import { IWidgetExports } from '../../Dashboard'
import { getFormattedStyle } from './PythonWidgetStyleHelper'
import { getFormattedInteractions } from '../common/WidgetInteractionsHelper'
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as pythonWidgetDefaultValues from '../../widget/WidgetEditor/helpers/pythonWidget/PythonWidgetDefaultValues'
import { getFormattedWidgetColumns } from '../common/WidgetColumnHelper'
import { getFiltersForColumns } from '../DashboardBackwardCompatibilityHelper'

const columnNameIdMap = {}

export const formatPythonWidget = (widget: any) => {
    const formattedWidget = {
        id: widget.id,
        dataset: widget.dataset.dsId,
        type: widget.type,
        columns: getFormattedWidgetColumns(widget, columnNameIdMap),
        theme: '',
        settings: {} as IPythonWidgetSettings
    } as IWidget
    formattedWidget.settings = getFormattedWidgetSettings(widget) as IPythonWidgetSettings
    getFiltersForColumns(formattedWidget, widget)
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
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as IPythonWidgetSettings
    return formattedSettings
}

const getFormattedConfiguration = (widget: any) => {
    return {
        exports: { showExcelExport: widget.style?.showExcelExport ?? false, showScreenshot: widget.style?.showScreenshot ?? false } as IWidgetExports
    } as IPythonWidgetConfiguration
}

const getFormattedEditorSettings = (widget: any) => {
    const formattedEditor = pythonWidgetDefaultValues.getDefaultEditorSettings()
    formattedEditor.environment = widget.pythonConf.environment
    formattedEditor.outputType = widget.pythonConf.outputType
    formattedEditor.outputName = widget.pythonConf.outputVariable
    formattedEditor.script = widget.pythonConf.script
    return formattedEditor
}
