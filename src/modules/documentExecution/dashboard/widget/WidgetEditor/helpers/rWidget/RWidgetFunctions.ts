import { IRWidgetSettings } from "@/modules/documentExecution/dashboard/interfaces/DashboardRWidget"
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import * as  rWidgetDefaultValues from './RWidgetDefaultValues'

export const createNewRWidgetSettings = () => {
    return {
        updatable: true,
        clickable: true,
        configuration: {
            exports: { showExcelExport: true, showScreenshot: true }
        },
        editor: rWidgetDefaultValues.getDefaultEditorSettings(),
        style: {
            themeName: '',
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            preview: widgetCommonDefaultValues.getDefaultPreview(),
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as IRWidgetSettings
}
