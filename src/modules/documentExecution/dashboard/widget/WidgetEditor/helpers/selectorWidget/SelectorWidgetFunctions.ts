import { ISelectorWidgetSettings, ISelectorWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import * as selectorWidgetDefaultValues from './SelectorWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import { IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'

export const createNewSelectorWidgetSettings = () => {
    return {
        isDateType: false,
        sortingColumn: null,
        sortingOrder: '',
        sortingColumnAggregation: '',
        updatable: true,
        clickable: true,
        configuration: {
            selectorType: selectorWidgetDefaultValues.getDefaultSelectorType(),
            defaultValues: selectorWidgetDefaultValues.getDefaultValues(),
            valuesManagement: selectorWidgetDefaultValues.getDefaultValuesManagement(),
            exports: { showExcelExport: true }
        },
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            label: selectorWidgetDefaultValues.getDefaultLabelStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle(),
            flex: selectorWidgetDefaultValues.getDefaultFlexStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as ISelectorWidgetSettings
}

const formatSelectorWidgetFlexStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.flex) {
        widgetStyle.flex = selectorWidgetDefaultValues.getDefaultFlexStyle()
    }
}
