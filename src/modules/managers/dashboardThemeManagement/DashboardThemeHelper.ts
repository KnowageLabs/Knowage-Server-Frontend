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

export const getDefaultDashboardThemeConfig = () => {
    const defaultDashboardThemeConfig = {} as IDashboardThemeConfig
    const widgets = ['text', 'image', 'chart', 'html', 'map', 'customChart', 'python', 'r', 'table', 'pivot', 'discovery', 'activeSelections', 'selector']

    widgets.forEach((widget) => (defaultDashboardThemeConfig[widget] = createGenericWidgetStyle()))

    addUniqueTableWidgetStyles(defaultDashboardThemeConfig.table.style)
    addUniqueDiscoveryWidgetStyles(defaultDashboardThemeConfig.discovery.style)
    addUniqueActiveSelectionsWidgetStyles(defaultDashboardThemeConfig.activeSelections.style)
    addUniqueSelectorWidgetStyles(defaultDashboardThemeConfig.selector.style)

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
}
