import { ISpacerWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardSpacerWidget'
import { IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'

export const createNewSpacerWidgetSettings = () => {
    return {
        updatable: false,
        clickable: false,
        configuration: {
            exports: { showExcelExport: false, showScreenshot: false }
        },
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as ISpacerWidgetSettings
}
