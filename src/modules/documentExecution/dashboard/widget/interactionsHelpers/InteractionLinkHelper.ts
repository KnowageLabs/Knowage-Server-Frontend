import { IDashboardDriver, ITableWidgetLink, IVariable, IWidgetInteractionParameter, IWidgetLinks } from "../../Dashboard";
import { parameterTextCompatibilityRegex, variableTextCompatibilityRegex } from "../../helpers/common/DashboardRegexHelper";
import { getActiveSelectionByDatasetAndColumn } from "./InteractionHelper";
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import i18n from '@/App.i18n'

const { t } = i18n.global

interface IClickedValue { value: string, type: string }

export const openNewLinkTableWidget = (clickedValue: IClickedValue, formattedRow: any, linkOptions: IWidgetLinks, dashboardId: string, variables: IVariable[]) => {
    const formattedLinks = getFormattedLinks(linkOptions, formattedRow, dashboardId, variables)
    console.log('--------- FORMATTED LINKS: ', formattedLinks)
    formattedLinks.forEach((formattedLink: { url: string, action: string }) => {
        if (formattedLink.action === 'blank') window.open(formattedLink.url, '_blank');
    })
}

const getFormattedLinks = (linkOptions: IWidgetLinks, formattedRow: any, dashboardId: string, variables: IVariable[]) => {
    const formattedLinks = [] as { url: string, action: string }[]
    linkOptions.links?.forEach((link: ITableWidgetLink) => {
        const formattedLink = getFormattedLink(link, formattedRow, dashboardId, variables)
        if (formattedLink) formattedLinks.push(formattedLink)
    })
    return formattedLinks
}

const getFormattedLink = (link: ITableWidgetLink, formattedRow: any, dashboardId: string, variables: IVariable[]) => {
    let url = link.baseurl
    const parameterToBeUsedAsResource = link.parameters.find((parameter: IWidgetInteractionParameter) => parameter.useAsResource)
    const resource = parameterToBeUsedAsResource ? getFormattedParametersUrl([parameterToBeUsedAsResource], formattedRow, dashboardId, variables, true) : ''
    if (resource) url += resource
    let parameters = link.parameters.length > 0 ? getFormattedParametersUrl(link.parameters, formattedRow, dashboardId, variables, false) : ''
    if (parameters) {
        parameters = parameters.substring(0, parameters.length - 1)
        url += `?${parameters}`
    }

    return { url: url, action: link.action }
}

const getFormattedParametersUrl = (parameters: IWidgetInteractionParameter[], formattedRow: any, dashboardId: string, variables: IVariable[], useAsResource: boolean) => {
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
                formattedParametersUrl += getFormattedDynamicParameterUrl(tempParameter, formattedRow, useAsResource)
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

const getFormattedDynamicParameterUrl = (parameter: IWidgetInteractionParameter, formattedRow: any, useAsResource: boolean) => {
    let columnValue = ''
    if (parameter.column === 'column_name_mode') columnValue = formattedRow.columnName
    else if (parameter.column) columnValue = formattedRow[parameter.column].value
    const value = columnValue ?? ''
    return useAsResource ? `${value}` : `${parameter.name}=${value}&`
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

// TODO - Move to common?
const replaceVariablesPlaceholdersByVariableName = (originalString: string, variables: IVariable[]) => {
    originalString = originalString.replace(variableTextCompatibilityRegex, (match: string, variableName: string) => {
        if (variables && variables.length > 0) {
            const dashboardVariable = variables.find((variable: IVariable) => variable.name === variableName)
            if (dashboardVariable) return dashboardVariable.value ?? ''
        }
        return ''
    })
    return originalString
}

// TODO - Move to common?
const replaceDriversPlaceholdersByDriverUrlName = (originalString: string, drivers: IDashboardDriver[]) => {
    originalString = originalString.replace(parameterTextCompatibilityRegex, (match: string, parameterName: string) => {
        if (drivers && drivers.length > 0) {
            const dashboardVariable = drivers.find((driver: IDashboardDriver) => driver.urlName === parameterName)
            if (dashboardVariable) return dashboardVariable.value ?? ''
        }
        return ''
    })
    return originalString
}