import { ITextWidgetStyle as IGenericStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardTextWidget'
import { IDashboardThemeConfig } from './DashboardThememanagement'
import { ITableWidgetStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import { ISelectorWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { ISelectionWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import * as widgetCommonDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as tableWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/tableWidget/TableWidgetDefaultValues'
import * as selectorWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/selectorWidget/SelectorWidgetDefaultValues'
import * as selectionsWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/selectionsWidget/SelectionsWidgetDefaultValues'
import * as pivotWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/pivotTableWidget/PivotTableDefaultValues'
import { IPivotTableStyle } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import ChartColorSettingsDescriptor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'

export const getDefaultDashboardThemeConfig = () => {
    const defaultDashboardThemeConfig = {} as IDashboardThemeConfig
    const widgets = ['text', 'image', 'chart', 'html', 'map', 'customChart', 'python', 'r', 'table', 'pivot', 'discovery', 'activeSelections', 'selector', 'spacer']

    widgets.forEach((widget) => (defaultDashboardThemeConfig[widget] = createGenericWidgetStyle()))

    addUniqueTableWidgetStyles(defaultDashboardThemeConfig.table.style)
    addUniquePivotWidgetStyles(defaultDashboardThemeConfig.pivot.style)
    addUniqueDiscoveryWidgetStyles(defaultDashboardThemeConfig.discovery.style)
    addUniqueActiveSelectionsWidgetStyles(defaultDashboardThemeConfig.activeSelections.style)
    addUniqueSelectorWidgetStyles(defaultDashboardThemeConfig.selector.style)
    addUniqueChartWidgetStyles(defaultDashboardThemeConfig.chart.style)

    return defaultDashboardThemeConfig
}

const createGenericWidgetStyle = () => {
    return {
        style: {
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        } as IGenericStyle
    }
}

const addUniqueTableWidgetStyles = (config: ITableWidgetStyle) => {
    config.columns = tableWidgetDefaultValues.getDefaultColumnStyles()
    config.columnGroups = tableWidgetDefaultValues.getDefaultColumnStyles()
    config.headers = tableWidgetDefaultValues.getDefaultHeadersStyle()
    config.rows = tableWidgetDefaultValues.getDefaultRowsStyle()
    config.summary = tableWidgetDefaultValues.getDefualtSummryStyle()
    config.paginator = tableWidgetDefaultValues.getDefaultPaginatorStyle()
}

const addUniquePivotWidgetStyles = (config: IPivotTableStyle) => {
    config.fieldHeaders = pivotWidgetDefaultValues.getDefaultColumnStyles()
    config.fields = pivotWidgetDefaultValues.getDefaultColumnStyles()
    config.totals = pivotWidgetDefaultValues.getDefaultTotals()
    config.subTotals = pivotWidgetDefaultValues.getDefaultTotals()
}

const addUniqueDiscoveryWidgetStyles = (config: IDiscoveryWidgetStyle) => {
    config.columns = tableWidgetDefaultValues.getDefaultColumnStyles()
    config.headers = tableWidgetDefaultValues.getDefaultHeadersStyle()
    config.rows = tableWidgetDefaultValues.getDefaultRowsStyle()
}

const addUniqueActiveSelectionsWidgetStyles = (config: ISelectionWidgetStyle) => {
    config.chips = selectionsWidgetDefaultValues.getDefaultChipsStyle()
    config.rows = selectionsWidgetDefaultValues.getDefaultRowsStyle()
}

const addUniqueSelectorWidgetStyles = (config: ISelectorWidgetStyle) => {
    config.label = selectorWidgetDefaultValues.getDefaultLabelStyle()
    config.radio = selectorWidgetDefaultValues.getDefaultRadioStyle()
    config.checkbox = selectorWidgetDefaultValues.getDefaultCheckboxStyle()
    config.dropdown = selectorWidgetDefaultValues.getDefaultDropdownStyle()
    config.multiDropdown = selectorWidgetDefaultValues.getDefaultMultiDropdownStyle()
    config.date = selectorWidgetDefaultValues.getDefaultDateStyle()
    config.dateRange = selectorWidgetDefaultValues.getDefaultDateRangeStyle()
}

const addUniqueChartWidgetStyles = (config: any) => {
    config.colors = ChartColorSettingsDescriptor.defaultColors as string[]
}

export const themeBackwardsCompatibility = (theme: IDashboardThemeConfig) => {
    if (theme.chart?.style) {
        const chartStyle = theme.chart.style as any
        if (!chartStyle.colors) addUniqueChartWidgetStyles(chartStyle)
    }

    if (theme.selector?.style) {
        const selectorStyle = theme.selector.style as ISelectorWidgetStyle
        if (!selectorStyle.radio) selectorStyle.radio = selectorWidgetDefaultValues.getDefaultRadioStyle()
        if (!selectorStyle.checkbox) selectorStyle.checkbox = selectorWidgetDefaultValues.getDefaultCheckboxStyle()
        if (!selectorStyle.dropdown) selectorStyle.dropdown = selectorWidgetDefaultValues.getDefaultDropdownStyle()
        if (!selectorStyle.multiDropdown) selectorStyle.multiDropdown = selectorWidgetDefaultValues.getDefaultMultiDropdownStyle()
        if (!selectorStyle.date) selectorStyle.date = selectorWidgetDefaultValues.getDefaultDateStyle()
        if (!selectorStyle.dateRange) selectorStyle.dateRange = selectorWidgetDefaultValues.getDefaultDateRangeStyle()
    }
}
