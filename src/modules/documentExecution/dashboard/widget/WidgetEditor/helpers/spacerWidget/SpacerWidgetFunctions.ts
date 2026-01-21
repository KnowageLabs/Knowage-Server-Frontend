import { ISpacerWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardSpacerWidget'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'

export const createNewSpacerWidgetSettings = () => {
    return {
        configuration: {},
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as ISpacerWidgetSettings
}
