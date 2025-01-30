import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { formatTableInteractions, formatTableSelectedColumns, formatTableWidgetConditionalStyle, formatTableWidgetTooltips, formatTableWidgetVisualisation, loadColumnIdNameMap } from '../tableWidget/TableWidgetBackendSaveHelper'
import { IDiscoveryWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'

export function formatTableWidgetForSave(widget: IWidget) {
    if (!widget) return

    loadColumnIdNameMap(widget)
    formatTableSelectedColumns(widget.columns)
    formatTableSettings(widget.settings)
}

const formatTableSettings = (widgetSettings: IDiscoveryWidgetSettings) => {
    formatTableWidgetVisualisation(widgetSettings.visualization)
    formatTableWidgetConditionalStyle(widgetSettings.conditionalStyles)
    formatTableWidgetTooltips(widgetSettings.tooltips)
    formatTableInteractions(widgetSettings.interactions)
}
