import { IDashboardDriver, ITableWidgetLink, IVariable, IWidgetInteractionParameter, IWidgetLinks } from "../../Dashboard";
import { IChartInteractionValues } from "../../interfaces/chartJS/DashboardChartJSWidget";
import { getActiveSelectionByDatasetAndColumn } from "./InteractionHelper";
import { replaceDriversPlaceholdersByDriverUrlName, replaceVariablesPlaceholdersByVariableName } from "./InteractionsParserHelper";
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import i18n from '@/App.i18n'

const { t } = i18n.global

interface IFormattedLink { url: string, action: string }[]

export const openNewLinkTableWidget = (formattedRow: any, dashboardId: string, variables: IVariable[], activeLink: ITableWidgetLink) => {
    const formattedLinks = [getFormattedLink(activeLink, formattedRow, null, dashboardId, variables)]
    executeFormattedLinks(formattedLinks)
}

export const openNewLinkImageWidget = (linkOptions: IWidgetLinks, dashboardId: string, variables: IVariable[]) => {
    const formattedLinks = getFormattedLinks(linkOptions, null, null, dashboardId, variables)
    executeFormattedLinks(formattedLinks)
}

export const openNewLinkChartWidget = (formattedChartValues: IChartInteractionValues, linkOptions: IWidgetLinks, dashboardId: string, variables: IVariable[]) => {
    const formattedLinks = getFormattedLinks(linkOptions, null, formattedChartValues, dashboardId, variables)
    executeFormattedLinks(formattedLinks)
}

const executeFormattedLinks = (formattedLinks: IFormattedLink[]) => {
    const linksForNewTab = formattedLinks.filter((formattedLink: IFormattedLink) => formattedLink.action === 'blank')
    const linkForReplace = formattedLinks.find((formattedLink: IFormattedLink) => formattedLink.action === 'replace')
    linksForNewTab.forEach((formattedLink: IFormattedLink) => window.open(formattedLink.url, '_blank'))
    if (linkForReplace) window.open(linkForReplace.url, '_self');
}

const getFormattedLinks = (linkOptions: IWidgetLinks, formattedRow: any, formattedChartValues: IChartInteractionValues | null, dashboardId: string, variables: IVariable[]) => {
    const formattedLinks = [] as { url: string, action: string }[]
    linkOptions.links?.forEach((link: ITableWidgetLink) => {
        const formattedLink = getFormattedLink(link, formattedRow, formattedChartValues, dashboardId, variables)
        if (formattedLink) formattedLinks.push(formattedLink)
    })
    return formattedLinks
}

const getFormattedLink = (link: ITableWidgetLink, formattedRow: any, formattedChartValues: IChartInteractionValues | null, dashboardId: string, variables: IVariable[]) => {
    let url = link.baseurl
    const parameterToBeUsedAsResource = link.parameters.find((parameter: IWidgetInteractionParameter) => parameter.useAsResource)
    const resource = parameterToBeUsedAsResource ? getFormattedParametersUrl([parameterToBeUsedAsResource], formattedRow, formattedChartValues, dashboardId, variables, true) : ''
    if (resource) url += resource
    let parameters = link.parameters.length > 0 ? getFormattedParametersUrl(link.parameters, formattedRow, formattedChartValues, dashboardId, variables, false) : ''
    if (parameters) {
        parameters = parameters.substring(0, parameters.length - 1)
        url += `?${parameters}`
    }

    return { url: url, action: link.action }
}

const getFormattedParametersUrl = (parameters: IWidgetInteractionParameter[], formattedColumnRow: any, formattedChartValues: IChartInteractionValues | null, dashboardId: string, variables: IVariable[], useAsResource: boolean) => {
    let formattedParametersUrl = ''
    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const driversValuesMap = getFormattedDriverValuesMap(drivers)
    for (let i = 0; i < parameters.length; i++) {
        const tempParameter = parameters[i]
        if (tempParameter.useAsResource && !useAsResource) continue
        switch (tempParameter.type) {
            case 'static':
                formattedParametersUrl += getFormattedStaticParameterUrl(tempParameter, useAsResource)
                break
            case 'dynamic':
                if (formattedColumnRow) formattedParametersUrl += getFormattedTableDynamicParameterUrl(tempParameter, formattedColumnRow, useAsResource)
                else if (formattedChartValues) formattedParametersUrl += getFormattedChartDynamicParameterUrl(tempParameter, formattedChartValues, useAsResource)
                break
            case 'driver':
                formattedParametersUrl += getFormattedDriverParameterUrl(tempParameter, driversValuesMap, useAsResource)
                break
            case 'selection':
                formattedParametersUrl += getFormattedSelectionParameterUrl(tempParameter, dashboardId, useAsResource)
                break
            case 'jwt':
                formattedParametersUrl += getFormattedJWTParameterUrl(tempParameter, useAsResource)
                break
            case 'json':
                formattedParametersUrl += getFormattedJSONParameterUrl(tempParameter, variables, drivers, useAsResource)
        }
    }

    return formattedParametersUrl
}

const getFormattedStaticParameterUrl = (parameter: IWidgetInteractionParameter, useAsResource: boolean) => {
    return useAsResource ? `${parameter.value}` : `${parameter.name}=${parameter.value}&`
}


const getFormattedDriverValuesMap = (drivers: IDashboardDriver[]) => {
    if (!drivers) return {}
    const driversValuesMap = {}
    drivers.forEach((driver: IDashboardDriver) => driversValuesMap[driver.urlName] = { value: driver.value, multivalue: driver.multivalue })
    return driversValuesMap
}

const getFormattedTableDynamicParameterUrl = (parameter: IWidgetInteractionParameter, formattedRow: any, useAsResource: boolean) => {
    let columnValue = ''
    if (parameter.column === 'column_name_mode') columnValue = formattedRow.columnName
    else if (parameter.column) columnValue = formattedRow[parameter.column].value
    const value = columnValue ?? ''
    return useAsResource ? `${value}` : `${parameter.name}=${value}&`
}

const getFormattedChartDynamicParameterUrl = (parameter: IWidgetInteractionParameter, formattedChartValues: IChartInteractionValues | null, useAsResource: boolean) => {
    const columnValue = getChartDynamicParameterValue(formattedChartValues, parameter.column ?? '')
    const value = columnValue ?? ''
    return useAsResource ? `${value}` : `${parameter.name}=${value}&`
}

// TODO - Move to some common file?
export const getChartDynamicParameterValue = (formattedChartValues: IChartInteractionValues | null, column: string) => {
    if (!formattedChartValues) return ''
    switch (column) {
        case "SERIE_NAME":
            return formattedChartValues.serieName;
        case "SERIE_VALUE":
            return formattedChartValues.serieValue;
        case "CATEGORY_NAME":
            return formattedChartValues.categoryName;
        case "CATEGORY_VALUE":
            return formattedChartValues.categoryValue;
        case "GROUPING_NAME":
            return formattedChartValues.groupingName;
        case "GROUPING_VALUE":
            return formattedChartValues.groupingValue;
    }
}

const getFormattedDriverParameterUrl = (parameter: IWidgetInteractionParameter, driversValuesMap: any, useAsResource: boolean) => {
    if (!parameter.driver || !driversValuesMap[parameter.driver]) return useAsResource ? '' : `${parameter.name}=&`
    else if (!driversValuesMap[parameter.driver].multivalue) return useAsResource ? `${driversValuesMap[parameter.driver].value}` : `${parameter.name}=${driversValuesMap[parameter.driver].value}&`
    else {
        let formattedUrl = ``
        const driverValuesAsArray = driversValuesMap[parameter.driver].value.split(',')
        driverValuesAsArray.forEach((value: string) => formattedUrl += useAsResource ? `${value},` : `${parameter.name}=${value}&`)
        if (useAsResource) formattedUrl = formattedUrl.slice(0, -1)
        return formattedUrl
    }
}

const getFormattedSelectionParameterUrl = (parameter: IWidgetInteractionParameter, dashboardId: string, useAsResource: boolean) => {
    const dashStore = dashboardStore()
    const activeSelections = dashStore.getSelections(dashboardId)
    const activeSelection = getActiveSelectionByDatasetAndColumn(parameter.dataset, parameter.column, activeSelections)
    const value = activeSelection ? activeSelection.value : ''
    return useAsResource ? `${value}` : `${parameter.name}=${value}&`
}

const getFormattedJWTParameterUrl = (parameter: IWidgetInteractionParameter, useAsResource: boolean) => {
    const store = mainStore()
    const user = store.getUser()
    const value = user?.userUniqueIdentifier ?? ''
    return useAsResource ? `${value}` : `${parameter.name}=${value}&`
}

const getFormattedJSONParameterUrl = (parameter: IWidgetInteractionParameter, variables: IVariable[], drivers: IDashboardDriver[], useAsResource: boolean) => {
    const store = mainStore()
    if (!parameter.json) return `${parameter.name}=&`
    let json = replacePlaceholders(parameter.json, variables, drivers)
    try {
        json = JSON.parse(json)
        return useAsResource ? `${JSON.stringify(json)}&` : `${parameter.name}=${JSON.stringify(json)}&`
    } catch (error: any) {
        store.setError({ title: t('common.error.generic'), msg: t('dashboard.widgetEditor.jsonLinkParsingError') })
        return useAsResource ? '' : `${parameter.name}=&`
    }
}

const replacePlaceholders = (originalString: string, variables: IVariable[], drivers: IDashboardDriver[]) => {
    originalString = replaceVariablesPlaceholdersByVariableName(originalString, variables)
    originalString = replaceDriversPlaceholdersByDriverUrlName(originalString, drivers)
    return originalString
}
