import { IWidgetExports } from '../../Dashboard'
import { IPivotColumnsConfiguration, IPivotFieldPanel, IPivotFieldPicker, IPivotRowsConfiguration, IPivotTableConfiguration } from '../../interfaces/pivotTable/DashboardPivotTableWidget'
import * as pivotTableDefaultValues from '../../widget/WidgetEditor/helpers/pivotTableWidget/PivotTableDefaultValues'

export const getFormattedConfiguration = (widget: any) => {
    const widgetConfig = widget.content.crosstabDefinition.config
    return {
        exports: { showExcelExport: widget.style?.showExcelExport ?? false, showScreenshot: widget.style?.showScreenshot ?? false } as IWidgetExports,
        rows: { grandTotal: widgetConfig.calculatetotalsonrows ?? false, grandTotalLabel: widgetConfig.rowtotalLabel, subTotal: widgetConfig.calculatesubtotalsonrows ?? false, subTotalLabel: widgetConfig.rowsubtotalLabel } as IPivotRowsConfiguration,
        columns: { grandTotal: widgetConfig.calculatetotalsoncolumns ?? false, grandTotalLabel: widgetConfig.columntotalLabel, subTotal: widgetConfig.calculatesubtotalsoncolumns ?? false, subTotalLabel: widgetConfig.columnsubtotalLabel } as IPivotColumnsConfiguration,
        fieldPicker: pivotTableDefaultValues.getDefaultFieldPicker() as IPivotFieldPicker,
        fieldPanel: pivotTableDefaultValues.getDefaultFieldPanel() as IPivotFieldPanel
    } as IPivotTableConfiguration
}
