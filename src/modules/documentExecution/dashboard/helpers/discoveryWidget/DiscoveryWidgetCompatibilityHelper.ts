import { ITableWidgetStyle, IWidget, IDashboardDriver, IWidgetInteractions, IWidgetResponsive, ITableWidgetTooltipStyle, IWidgetHelpSettings } from '../../Dashboard'
import { IDiscoveryWidgetSettings, IDiscoveryWidgetConfiguration, IDiscoveryWidgetFacetsSettings, IDiscoveryWidgetSearchSettings } from '../../interfaces/DashboardDiscoveryWidget'
import { getFormattedWidgetColumns } from '../common/WidgetColumnHelper'
import { getFormattedInteractions } from '../common/WidgetInteractionsHelper'
import { getFiltersForColumns } from '../DashboardBackwardCompatibilityHelper'
import { getFormattedStyle } from '../tableWidget/TableWidgetStyleHelper'
import { getFormattedDiscoveryConfiguration } from './DiscoveryWidgetConfigurationHelper'
import { getStyleFromColumn, getTooltipFromColumn } from '../tableWidget/TableWidgetColumnSettingsHelper'
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as discoveryWidgetDefaultValues from '../../widget/WidgetEditor/helpers/discoveryWidget/DiscoveryWidgetDefaultValues'
import * as tableWidgetDefaultValues from '../../widget/WidgetEditor/helpers/tableWidget/TableWidgetDefaultValues'

const columnNameIdMap = {}

export const formatDiscoveryWidget = (widget: any, drivers: IDashboardDriver[]) => {
    const formattedWidget = {
        id: widget.id,
        dataset: widget.dataset.dsId,
        type: widget.type,
        columns: getFormattedWidgetColumns(widget, columnNameIdMap),
        theme: '',
        style: {},
        settings: {} as IDiscoveryWidgetSettings
    } as IWidget
    formattedWidget.settings = getFormattedWidgetSettings(widget, drivers)
    getFiltersForColumns(formattedWidget, widget)
    getSettingsFromWidgetColumns(formattedWidget, widget)
    return formattedWidget
}

const getFormattedWidgetSettings = (widget: any, drivers: IDashboardDriver[]) => {
    const formattedSettings = {
        updatable: widget.updateble,
        clickable: widget.cliccable,
        conditionalStyles: tableWidgetDefaultValues.getDefaultConditionalStyles(),
        facets: getFormattedFacetsSettings(widget) as IDiscoveryWidgetFacetsSettings,
        search: getFormattedSearchSettings(widget, drivers) as IDiscoveryWidgetSearchSettings,
        configuration: getFormattedDiscoveryConfiguration(widget) as IDiscoveryWidgetConfiguration,
        interactions: getFormattedInteractions(widget) as IWidgetInteractions,
        style: getFormattedStyle(widget) as ITableWidgetStyle,
        tooltips: tableWidgetDefaultValues.getDefaultTooltips() as ITableWidgetTooltipStyle[],
        visualization: tableWidgetDefaultValues.getDefaultVisualizations(),
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes() as IWidgetResponsive,
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as IDiscoveryWidgetSettings
    return formattedSettings
}

const getFormattedFacetsSettings = (widget: any) => {
    const formattedFacetSettings = discoveryWidgetDefaultValues.getDefaultFacetsSettings() as IDiscoveryWidgetFacetsSettings
    if (!widget.settings.facets) return formattedFacetSettings
    formattedFacetSettings.enabled = widget.settings.facets.enabled
    formattedFacetSettings.closedByDefault = widget.settings.facets.closed
    formattedFacetSettings.limit = widget.settings.facets.limit
    formattedFacetSettings.precision = widget.settings.facets.precision
    formattedFacetSettings.selection = widget.settings.facets.selection
    formattedFacetSettings.width = widget.settings.facets.width
    return formattedFacetSettings
}

const getFormattedSearchSettings = (widget: any, drivers: IDashboardDriver[]) => {
    const formattedSearchSettings = discoveryWidgetDefaultValues.getDefaultSearchSettings()
    if (!widget.search) return formattedSearchSettings
    formattedSearchSettings.columns = widget.search.columns
    formattedSearchSettings.default = widget.settings.defaultTextSearch
    formattedSearchSettings.defaultType = widget.settings.defaultTextSearchType

    if (widget.settings.defaultTextSearchType === 'static') formattedSearchSettings.defaultValue = widget.search.text
    else formattSearchSettingsWithDriverValue(widget.settings.defaultTextSearchValue, drivers, formattedSearchSettings)

    if (widget.search.facets) formatFacetSearchParams(widget, formattedSearchSettings)
    else formattedSearchSettings.facetSearchParams = {}

    return formattedSearchSettings
}

const formattSearchSettingsWithDriverValue = (driverLabel: string | undefined, drivers: IDashboardDriver[], formattedSearchSettings: IDiscoveryWidgetSearchSettings) => {
    const index = drivers.findIndex((driver: IDashboardDriver) => driver.driverLabel === driverLabel)
    if (index !== -1) {
        formattedSearchSettings.driverLabel = drivers[index].driverLabel
        formattedSearchSettings.defaultValue = drivers[index].value ? drivers[index].value : ''
    }
}

const getSettingsFromWidgetColumns = (formattedWidget: IWidget, widget: any) => {
    for (let i = 0; i < widget.content.columnSelectedOfDataset.length; i++) {
        const tempColumn = widget.content.columnSelectedOfDataset[i]
        if (tempColumn.facet) formattedWidget.settings.facets.columns.push(tempColumn.name)
        getTooltipFromColumn(formattedWidget, tempColumn)
        getStyleFromColumn(formattedWidget, tempColumn, columnNameIdMap)
    }
}

const formatFacetSearchParams = (widget, formattedSearchSettings: IDiscoveryWidgetSearchSettings) => {
    formattedSearchSettings.facetSearchParams = {}
    Object.keys(widget.search.facets).forEach((facet) => {
        if (widget.search.facets[facet].filterVals.length > 0) {
            formattedSearchSettings.facetSearchParams[facet] = widget.search.facets[facet].filterVals
        }
    })
}
