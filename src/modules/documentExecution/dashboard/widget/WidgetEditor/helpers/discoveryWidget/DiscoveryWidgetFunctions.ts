import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import * as tableWidgetDefaultValues from '../tableWidget/TableWidgetDefaultValues'
import * as discoveryWidgetDefaultValues from './DiscoveryWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import { removeColumnFromSubmodel } from '../tableWidget/TableWidgetFunctions'

export const createNewDiscoveryWidgetSettings = () => {
    return {
        updatable: true,
        clickable: true,
        facets: discoveryWidgetDefaultValues.getDefaultFacetsSettings(),
        search: discoveryWidgetDefaultValues.getDefaultSearchSettings(),
        conditionalStyles: tableWidgetDefaultValues.getDefaultConditionalStyles(),
        configuration: {
            exports: tableWidgetDefaultValues.getDefaultExportsConfiguration(),
            customMessages: tableWidgetDefaultValues.getDefaultCustomMessages()
        },
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            link: widgetCommonDefaultValues.getDefaultLinks(),
            preview: widgetCommonDefaultValues.getDefaultPreview(),
            selection: { enabled: true }
        },
        style: {
            themeName: '',
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            headers: tableWidgetDefaultValues.getDefaultHeadersStyle(),
            columns: tableWidgetDefaultValues.getDefaultColumnStyles(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            rows: tableWidgetDefaultValues.getDefaultRowsStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        tooltips: tableWidgetDefaultValues.getDefaultTooltips(),
        visualization: tableWidgetDefaultValues.getDefaultVisualizations(),
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as IDiscoveryWidgetSettings
}

export const addColumnToDiscoveryWidgetModel = (widgetModel: IWidget, column: IWidgetColumn) => {
    if (column.fieldType === 'ATTRIBUTE' && !widgetModel.settings.facets.columns.includes(column.columnName)) widgetModel.settings.facets.columns.push(column.columnName)
    if (!widgetModel.settings.search.columns.includes(column.columnName)) widgetModel.settings.search.columns.push(column.columnName)
}

export const removeColumnFromDiscoveryWidgetModel = (widgetModel: IWidget, column: IWidgetColumn) => {
    removeColumnNameFromStringArray(widgetModel.settings.facets.columns, column.columnName)
    removeColumnNameFromStringArray(widgetModel.settings.search.columns, column.columnName)
    removeColumnFromSubmodel(column, widgetModel.settings.visualization.visualizationTypes.types, 'target', 'columnRemovedFromVisibilityTypes', true)
    removeColumnFromSubmodel(column, widgetModel.settings.visualization.visibilityConditions.conditions, 'target', 'columnRemovedFromVisibilityConditions', false)
}

export const removeColumnNameFromStringArray = (array: string[], columnName: string) => {
    const index = array.findIndex((element: string) => element === columnName)
    if (index !== -1) array.splice(index, 1)
}

export const formatDashboardDiscoveryWidgetAfterLoading = (widget: IWidget) => {
    if (!widget || !widget.settings) return

    if (!widget.settings.interactions.selection) widget.settings.interactions.selection = { enabled: true }
}
