import { IMapWidgetCrossNavigation, IMapWidgetLinkConfiguration, IMapWidgetPreview, IMapWidgetSelectionConfiguration, IMapWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
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
            selection: mapWidgetDefaultValues.getDefaultMapSelectionConfiguration() as IMapWidgetSelectionConfiguration,
            crossNavigation: mapWidgetDefaultValues.getDefaultMapCrossNavigationConfiguration() as IMapWidgetCrossNavigation,
            preview: mapWidgetDefaultValues.getDefaultMapPreviewConfiguration() as IMapWidgetPreview,
            link: mapWidgetDefaultValues.getDefaultMapLinkConfiguration() as IMapWidgetLinkConfiguration
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
