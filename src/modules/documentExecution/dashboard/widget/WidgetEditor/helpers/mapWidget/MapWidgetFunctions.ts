import { IMapWidgetSelectionConfiguration, IMapWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import * as mapWidgetDefaultValues from './MapWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'
import { IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'

export const createNewMapWidgetSettings = () => {
    return {
        configuration: {
            map: mapWidgetDefaultValues.getDefaultMapLayerSettings(),
            controlPanel: mapWidgetDefaultValues.getDefaultControlPanelSettings(),
            exports: { showExcelExport: false, showScreenshot: false }
        },
        visualizations: mapWidgetDefaultValues.getDefaultVisualizationSettings(),
        conditionalStyles: { enabled: false, conditions: [] },
        legend: mapWidgetDefaultValues.getDefaultLegendSettings(),
        dialog: mapWidgetDefaultValues.getDefaultDialogSettings(),
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            selection: { enabled: true, selections: [] } as IMapWidgetSelectionConfiguration
        },
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        tooltips: mapWidgetDefaultValues.getDefaultMapTooltips(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as IMapWidgetSettings
}
