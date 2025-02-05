import { ISelectorWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import * as selectorWidgetDefaultValues from './SelectorWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import { IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'

export const createNewSelectorWidgetSettings = () => {
    return {
        isDateType: false,
        sortingColumn: '',
        sortingOrder: '',
        updatable: true,
        clickable: true,
        configuration: {
            selectorType: selectorWidgetDefaultValues.getDefaultSelectorType(),
            defaultValues: selectorWidgetDefaultValues.getDefaultValues(),
            valuesManagement: selectorWidgetDefaultValues.getDefaultValuesManagement(),
            exports: { showExcelExport: true }
        },
        style: {
            themeName: '',
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            label: selectorWidgetDefaultValues.getDefaultLabelStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as ISelectorWidgetSettings
}
