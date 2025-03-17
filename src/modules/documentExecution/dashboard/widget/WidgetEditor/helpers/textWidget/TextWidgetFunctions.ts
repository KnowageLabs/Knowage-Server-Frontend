import { ITextWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardTextWidget'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import { IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'

export const createNewTextWidgetSettings = () => {
    return {
        sortingColumn: '',
        sortingOrder: '',
        updatable: true,
        clickable: true,
        editor: { text: '' },
        configuration: {
            exports: { showExcelExport: true, showScreenshot: true }
        },
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            preview: widgetCommonDefaultValues.getDefaultPreview()
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
    } as ITextWidgetSettings
}
