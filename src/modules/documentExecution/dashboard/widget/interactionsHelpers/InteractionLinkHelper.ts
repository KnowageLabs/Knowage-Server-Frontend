import { IDashboardDriver, ITableWidgetLink, IWidgetInteractionParameter, IWidgetLinks } from "../../Dashboard";
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { getActiveSelectionByDatasetAndColumn } from "./InteractionHelper";

interface IClickedValue { value: string, type: string }

export const openNewLinkTableWidget = (clickedValue: IClickedValue, formattedRow: any, linkOptions: IWidgetLinks, dashboardId: string) => {
    const formattedLinks = getFormattedLinks(linkOptions, formattedRow, dashboardId)
    console.log('--------- openNewLinkTableWidget() - formattedLinks: ', formattedLinks)
    formattedLinks.forEach((formattedLink: { url: string, action: string }) => {
        // if (formattedLink.action === 'blank') window.open(formattedLink.url, '_blank');
    })
}

const getFormattedLinks = (linkOptions: IWidgetLinks, formattedRow: any, dashboardId: string) => {
    const formattedLinks = [] as { url: string, action: string }[]
    linkOptions.links?.forEach((link: ITableWidgetLink) => {
        const formattedLink = getFormattedLink(link, formattedRow, dashboardId)
        if (formattedLink) formattedLinks.push(formattedLink)
    })
    return formattedLinks
}

const getFormattedLink = (link: ITableWidgetLink, formattedRow: any, dashboardId: string) => {
    let url = link.baseurl
    let parameters = link.parameters.length > 0 ? getFormattedParametersUrl(link, formattedRow, dashboardId) : ''
    if (parameters) parameters = parameters.substring(0, parameters.length - 1)
    url += `?${parameters}`

    return { url: url, action: link.action }
}

const getFormattedParametersUrl = (link: ITableWidgetLink, formattedRow: any, dashboardId: string) => {
    let formattedParametersUrl = ''
    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const driversValuesMap = getFormattedDriverValuesMap(drivers)
    link.parameters.forEach((parameter: IWidgetInteractionParameter) => {
        if (parameter.type === 'static') {
            formattedParametersUrl += `${parameter.name}=${parameter.value}&`
        } else if (parameter.type === 'dynamic') {
            formattedParametersUrl += getFormattedDynamicParameterUrl(parameter, formattedRow)
        } else if (parameter.type === 'driver') {
            formattedParametersUrl += getFormattedDriverParameterUrl(parameter, driversValuesMap)
        } else if (parameter.type === 'selection') {
            formattedParametersUrl += getFormattedSelectionParameterUrl(parameter, dashboardId)
        }
    })
    return formattedParametersUrl
}

const getFormattedDriverValuesMap = (drivers: IDashboardDriver[]) => {
    if (!drivers) return {}
    const driversValuesMap = {}
    // TODO - Ask about multivalue drivers
    drivers.forEach((driver: IDashboardDriver) => driversValuesMap[driver.urlName] = driver.value)
    return driversValuesMap
}

const getFormattedDynamicParameterUrl = (parameter: IWidgetInteractionParameter, formattedRow: any) => {
    let columnValue = ''
    if (parameter.column === 'column_name_mode') columnValue = formattedRow.columnName
    else if (parameter.column) columnValue = formattedRow[parameter.column].value
    return `${parameter.name}=${columnValue ?? ''}&`
}

const getFormattedDriverParameterUrl = (parameter: IWidgetInteractionParameter, driversValuesMap: any) => {
    const value = parameter.driver && driversValuesMap[parameter.driver] ? driversValuesMap[parameter.driver] : ''
    return `${parameter.name}=${value}&`
}

const getFormattedSelectionParameterUrl = (parameter: IWidgetInteractionParameter, dashboardId: string) => {
    const dashStore = dashboardStore()
    const activeSelections = dashStore.getSelections(dashboardId)
    const activeSelection = getActiveSelectionByDatasetAndColumn(parameter.dataset, parameter.column, activeSelections)
    const value = activeSelection ? activeSelection.value : ''
    return `${parameter.name}=${value}&`
}


