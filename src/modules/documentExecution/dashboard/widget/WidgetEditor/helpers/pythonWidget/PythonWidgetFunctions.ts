import { IPythonWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardPythonWidget'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import * as pythonWidgetDefaultValues from './PythonWidgetDefaultValues'
import { IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'

export const createNewPythonWidgetSettings = () => {
    return {
        updatable: true,
        clickable: true,
        configuration: {
            exports: { showExcelExport: true, showScreenshot: true }
        },
        editor: pythonWidgetDefaultValues.getDefaultEditorSettings(),
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            preview: widgetCommonDefaultValues.getDefaultPreview()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as IPythonWidgetSettings
}
