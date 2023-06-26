import { IWidget, IWidgetColumn, IWidgetColumnFilter, IWidgetInteractions, IWidgetResponsive } from '../../Dashboard'
import { getFormattedInteractions } from '../common/WidgetInteractionsHelper'
import { getFormattedPivotFields } from './cePivotTableColumnHelper'
import { IPivotTableConfiguration, IPivotTableSettings, IPivotTableStyle, IPivotTableWidgetConditionalStyles, IPivotTableWidgetVisualization, IPivotTooltips } from '../../interfaces/pivotTable/DashboardPivotTableWidget'
import { getSettingsFromPivotTableWidgetColumns } from './cePivotTableColumnSettingsHelper'
import { getFormattedConfiguration } from './cePivotTableConfigurationHelper'
import { getFormattedStyle } from './cePivotTabletStyleHelper'
import * as pivotTableDefaultValues from '../../widget/WidgetEditor/helpers/pivotTableWidget/PivotTableDefaultValues'
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'

const columnNameIdMap = {}

export const formatCEPivotTabletWidget = (widget: any) => {
    console.group('OLD PIVOT ---------------------')
    console.log(widget)
    console.groupEnd()

    const formattedWidget = {
        id: widget.id,
        dataset: widget.dataset.dsId,
        type: 'ce-pivot-table',
        fields: getFormattedPivotFields(widget, columnNameIdMap),
        columns: [],
        theme: '',
        style: {},
        settings: {} as IPivotTableSettings
    } as IWidget
    formattedWidget.settings = getFormattedWidgetSettings(widget)

    getFiltersForColumns(formattedWidget, widget)
    getSettingsFromPivotTableWidgetColumns(formattedWidget, widget)

    console.group('FORMATTED PIVOT ---------------------')
    console.log(formattedWidget)
    console.groupEnd()

    return formattedWidget
}

const getFiltersForColumns = (formattedWidget: IWidget, oldWidget: any) => {
    if (!oldWidget.filters || oldWidget.filters.length === 0 || !formattedWidget.fields) return
    const keys = ['columns', 'rows', 'data', 'filters']
    for (let i = 0; i < oldWidget.filters.length; i++) {
        const tempFilter = oldWidget.filters[i]
        for (let j = 0; j < keys.length; j++) {
            const fieldArray = formattedWidget.fields[keys[j]]
            const index = fieldArray?.findIndex((column: IWidgetColumn) => column.columnName === tempFilter.colName)
            if (index !== -1) {
                fieldArray[index].filter = { enabled: true, operator: tempFilter.filterOperator, value: tempFilter.filterVal1 }
                if (tempFilter.filterVal2 && fieldArray[index].filter) (fieldArray[index].filter as IWidgetColumnFilter).value2 = tempFilter.filterVal2
                break
            }
        }
    }
}

const getFormattedWidgetSettings = (widget: any) => {
    const formattedSettings = {
        updatable: widget.updateble,
        clickable: widget.cliccable,
        conditionalStyles: pivotTableDefaultValues.getDefaultConditionalStyles() as IPivotTableWidgetConditionalStyles,
        visualization: pivotTableDefaultValues.getDefaultVisualisationSettings() as IPivotTableWidgetVisualization,
        configuration: getFormattedConfiguration(widget) as IPivotTableConfiguration,
        interactions: getFormattedInteractions(widget) as IWidgetInteractions,
        style: getFormattedStyle(widget) as IPivotTableStyle,
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes() as IWidgetResponsive,
        tooltips: pivotTableDefaultValues.getDefaultTooltips() as IPivotTooltips[]
    } as IPivotTableSettings
    return formattedSettings
}

export const getColumnId = (widgetColumnName: string) => {
    return columnNameIdMap[widgetColumnName]
}
