import { ISelectorWidgetSettings, ISelectorWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import * as selectorWidgetDefaultValues from './SelectorWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import { IWidget, IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'

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
            radio: selectorWidgetDefaultValues.getDefaultRadioStyle(),
            checkbox: selectorWidgetDefaultValues.getDefaultCheckboxStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as ISelectorWidgetSettings
}

export const formatSelectorSettings = (widget: IWidget) => {
    if (!widget.settings) return
    formatSelectorWidgetRadioStyle(widget.settings.style)
    formatSelectorWidgetCheckboxStyle(widget.settings.style)
}

//TODO - delete label when all selector widgets have been updated
//kind of a backward compatibility function for 9.0 > 9.1
const formatSelectorWidgetRadioStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.radio) {
        widgetStyle.radio = selectorWidgetDefaultValues.getDefaultRadioStyle()

        const defaults = selectorWidgetDefaultValues.getDefaultRadioStyle()
        const radio = widgetStyle.radio
        const label = widgetStyle.label.properties

        if (radio.label) {
            radio.label['font-weight'] = label['font-weight'] ?? defaults.label?.['font-weight'] ?? ''
            radio.label['font-style'] = label['font-style'] ?? defaults.label?.['font-style'] ?? ''
            radio.label['font-size'] = label['font-size'] ?? defaults.label?.['font-size'] ?? ''
            radio.label['font-family'] = label['font-family'] ?? defaults.label?.['font-family'] ?? ''
            radio.label.color = label.color ?? defaults.label?.color ?? ''
            radio.label['background-color'] = label['background-color'] ?? defaults.label?.['background-color'] ?? ''
        }

        return
    }
}

const formatSelectorWidgetCheckboxStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.checkbox) {
        widgetStyle.checkbox = selectorWidgetDefaultValues.getDefaultCheckboxStyle()

        const defaults = selectorWidgetDefaultValues.getDefaultCheckboxStyle()
        const checkbox = widgetStyle.checkbox
        const label = widgetStyle.label.properties

        if (checkbox.label) {
            checkbox.label['font-weight'] = label['font-weight'] ?? defaults.label?.['font-weight'] ?? ''
            checkbox.label['font-style'] = label['font-style'] ?? defaults.label?.['font-style'] ?? ''
            checkbox.label['font-size'] = label['font-size'] ?? defaults.label?.['font-size'] ?? ''
            checkbox.label['font-family'] = label['font-family'] ?? defaults.label?.['font-family'] ?? ''
            checkbox.label.color = label.color ?? defaults.label?.color ?? ''
            checkbox.label['background-color'] = label['background-color'] ?? defaults.label?.['background-color'] ?? ''
        }

        return
    }
}
