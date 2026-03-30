import { IWidget, IWidgetColumn, IWidgetExports, IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetColumnDefaultValue, ISelectorWidgetDefaultValuesConfig, ISelectorWidgetSelectorType, ISelectorWidgetSettings, ISelectorWidgetValuesManagement, ISelectorWidgetConfiguration } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { getFormattedStyle } from './SelectorWidgetStyleHelper'
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as selectorWidgetDefaultValues from '../../widget/WidgetEditor/helpers/selectorWidget/SelectorWidgetDefaultValues'
import { getFiltersForColumns } from '../DashboardBackwardCompatibilityHelper'

export const formatSelectorWidget = (widget: any) => {
    const formattedWidget = {
        id: widget.id,
        dataset: widget.dataset.dsId,
        type: widget.type,
        columns: getFormattedSelectionColumn(widget),
        theme: '',
        settings: {} as ISelectorWidgetSettings
    } as IWidget
    formattedWidget.settings = getFormattedWidgetSettings(widget) as ISelectorWidgetSettings
    getFiltersForColumns(formattedWidget, widget)
    return formattedWidget
}

const getFormattedSelectionColumn = (widget: any) => {
    const formattedColumns = [] as IWidgetColumn[]
    if (widget.content && widget.content.selectedColumn) {
        const formattedColumn = {
            id: crypto.randomUUID(),
            columnName: widget.content.selectedColumn.name,
            alias: widget.content.selectedColumn.alias,
            type: widget.content.selectedColumn.type,
            fieldType: widget.content.selectedColumn.fieldType,
            multiValue: widget.content.selectedColumn.multiValue,
            filter: {}
        } as IWidgetColumn
        formattedColumns.push(formattedColumn)
    }
    return formattedColumns
}

const getFormattedWidgetSettings = (widget: any) => {
    const formattedSettings = {
        isDateType: widget.content.selectedColumn && (widget.content.selectedColumn.type.toLowerCase().includes('date') || widget.content.selectedColumn.type.toLowerCase().includes('timestamp')),
        sortingOrder: widget.settings?.sortingOrder ?? '',
        sortingColumn: null,
        updatable: widget.updateble,
        clickable: widget.cliccable,
        configuration: getFormattedConfiguration(widget),
        style: getFormattedStyle(widget),
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as ISelectorWidgetSettings
    return formattedSettings
}

const getFormattedConfiguration = (widget: any) => {
    return {
        selectorType: getFormattedSelectorType(widget),
        defaultValues: getFormattedDefaultValues(widget),
        valuesManagement: getFormattedWidgetValuesManagement(widget),
        exports: { showExcelExport: widget.style?.showExcelExport ?? false } as IWidgetExports
    } as ISelectorWidgetConfiguration
}

const getFormattedSelectorType = (widget: any) => {
    if (!widget.settings) return selectorWidgetDefaultValues.getDefaultSelectorType()

    const formattedSelectorType = {
        modality: widget.settings.modalityValue ?? 'radio',
        alignment: widget.settings.modalityView ?? 'vertical',
        columnSize: widget.settings.gridColumnsWidth ?? ''
    } as ISelectorWidgetSelectorType
    if (widget.content.selectedColumn.type.toLowerCase().includes('date') || widget.content.selectedColumn.type.toLowerCase().includes('timestamp')) {
        formattedSelectorType.modality = formattedSelectorType.modality === 'singleValue' ? 'date' : 'dateRange'
    }

    return formattedSelectorType
}

const getFormattedDefaultValues = (widget: any): ISelectorWidgetDefaultValuesConfig => {
    const columnName = widget.content?.selectedColumn?.name ?? ''
    if (!widget.settings || !columnName) return selectorWidgetDefaultValues.getDefaultValues()
    const hasValue = !!(widget.settings.defaultValue || widget.settings.defaultStartDate || widget.settings.defaultEndDate)
    const column: ISelectorWidgetColumnDefaultValue = {
        columnName,
        valueType: (widget.settings.defaultValue ?? '') as '' | 'STATIC' | 'FIRST' | 'LAST',
        value: widget.settings.staticValues ?? ''
    }
    return { enabled: hasValue, columns: [column] }
}

const getFormattedWidgetValuesManagement = (widget: any) => {
    if (!widget.settings) return selectorWidgetDefaultValues.getDefaultValuesManagement()
    return {
        hideDisabled: widget.settings.hideDisabled ?? false,
        enableAll: widget.settings.enableAll ?? false
    } as ISelectorWidgetValuesManagement
}
