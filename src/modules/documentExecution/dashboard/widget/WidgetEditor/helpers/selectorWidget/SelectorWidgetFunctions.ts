import { ISelectorWidgetSettings, ISelectorWidgetStyle, ISelectorWidgetColumnDefaultValue, ISelectorWidgetDefaultValuesConfig } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
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
            exports: { showExcelExport: true },
            descriptionColumnConfigs: []
        },
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            label: selectorWidgetDefaultValues.getDefaultLabelStyle(),
            radio: selectorWidgetDefaultValues.getDefaultRadioStyle(),
            checkbox: selectorWidgetDefaultValues.getDefaultCheckboxStyle(),
            dropdown: selectorWidgetDefaultValues.getDefaultDropdownStyle(),
            multiDropdown: selectorWidgetDefaultValues.getDefaultMultiDropdownStyle(),
            date: selectorWidgetDefaultValues.getDefaultDateStyle(),
            dateRange: selectorWidgetDefaultValues.getDefaultDateRangeStyle(),
            slider: selectorWidgetDefaultValues.getDefaultSliderStyle(),
            range: selectorWidgetDefaultValues.getDefaultRangeStyle(),
            buttonToggle: selectorWidgetDefaultValues.getDefaultButtonToggleStyle(),
            tree: selectorWidgetDefaultValues.getDefaultTreeStyle(),
            multiTree: selectorWidgetDefaultValues.getDefaultMultiTreeStyle(),
            flex: selectorWidgetDefaultValues.getDefaultFlexStyle(),
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
    formatSelectorWidgetDefaultValues(widget)
    formatSelectorWidgetRadioStyle(widget.settings.style)
    formatSelectorWidgetCheckboxStyle(widget.settings.style)
    formatSelectorWidgetDropdownStyle(widget.settings.style)
    formatSelectorWidgetMultiDropdownStyle(widget.settings.style)
    formatSelectorWidgetDateStyle(widget.settings.style)
    formatSelectorWidgetDateRangeStyle(widget.settings.style)
    formatSelectorWidgetSliderStyle(widget.settings.style)
    formatSelectorWidgetRangeStyle(widget.settings.style)
    formatSelectorWidgetButtonToggleStyle(widget.settings.style)
    formatSelectorWidgetTreeStyle(widget.settings.style)
    formatSelectorWidgetMultiTreeStyle(widget.settings.style)
    formatSelectorWidgetFlexStyle(widget.settings.style)
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

const formatSelectorWidgetDropdownStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.dropdown) {
        widgetStyle.dropdown = selectorWidgetDefaultValues.getDefaultDropdownStyle()
    }
}

const formatSelectorWidgetMultiDropdownStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.multiDropdown) {
        widgetStyle.multiDropdown = selectorWidgetDefaultValues.getDefaultMultiDropdownStyle()
    }
}

const formatSelectorWidgetDateStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.date) {
        widgetStyle.date = selectorWidgetDefaultValues.getDefaultDateStyle()
    }
}

const formatSelectorWidgetDateRangeStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.dateRange) {
        widgetStyle.dateRange = selectorWidgetDefaultValues.getDefaultDateRangeStyle()
    }
}

const formatSelectorWidgetSliderStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.slider) {
        widgetStyle.slider = selectorWidgetDefaultValues.getDefaultSliderStyle()
    }
}

const formatSelectorWidgetRangeStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.range) {
        widgetStyle.range = selectorWidgetDefaultValues.getDefaultRangeStyle()
    }
}

const formatSelectorWidgetButtonToggleStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.buttonToggle) {
        widgetStyle.buttonToggle = selectorWidgetDefaultValues.getDefaultButtonToggleStyle()
    }
}

const formatSelectorWidgetTreeStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.tree) {
        widgetStyle.tree = selectorWidgetDefaultValues.getDefaultTreeStyle()
    }
}

const formatSelectorWidgetMultiTreeStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.multiTree) {
        widgetStyle.multiTree = selectorWidgetDefaultValues.getDefaultMultiTreeStyle()
    }
}

const formatSelectorWidgetFlexStyle = (widgetStyle: ISelectorWidgetStyle) => {
    if (!widgetStyle.flex) {
        widgetStyle.flex = selectorWidgetDefaultValues.getDefaultFlexStyle()
    }
}

// 9.0 → 9.1: migrate legacy single-object defaultValues to { enabled, columns } wrapper format
const formatSelectorWidgetDefaultValues = (widget: IWidget) => {
    const config = widget.settings?.configuration
    if (!config) return
    const existing = config.defaultValues as any

    // Already in new format
    if (existing && typeof existing === 'object' && !Array.isArray(existing) && 'columns' in existing) return

    const legacyValues = existing as { enabled?: boolean; valueType?: string; value?: string } | null | undefined
    const columns: ISelectorWidgetColumnDefaultValue[] = (widget.columns ?? []).map((col: any, index: number) => ({
        columnName: col.columnName,
        valueType: (index === 0 ? (legacyValues?.valueType ?? '') : '') as '' | 'STATIC' | 'FIRST' | 'LAST',
        value: index === 0 ? (legacyValues?.value ?? '') : ''
    }))
    const wrapped: ISelectorWidgetDefaultValuesConfig = {
        enabled: legacyValues?.enabled ?? false,
        columns
    }
    config.defaultValues = wrapped
}
