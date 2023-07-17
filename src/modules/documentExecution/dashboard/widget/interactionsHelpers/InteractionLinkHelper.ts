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
    console.log('--------- openNewLinkTableWidget() - formattedLinks: ', formattedLinks)
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
    let parameters = link.parameters.length > 0 ? getFormattedParametersUrl(link, formattedRow, dashboardId, variables) : ''
    if (parameters) parameters = parameters.substring(0, parameters.length - 1)
    url += `?${parameters}`

    return { url: url, action: link.action }
}

const getFormattedParametersUrl = (link: ITableWidgetLink, formattedRow: any, dashboardId: string, variables: IVariable[]) => {
    console.log('------ LINK: ', link)
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
        } else if (parameter.type === 'jwt') {
            formattedParametersUrl += getFormattedJWTParameterUrl(parameter)
        } else if (parameter.type === 'json') {
            formattedParametersUrl += getFormattedJSONParameterUrl(parameter, variables, drivers)
        }
    })
    return formattedParametersUrl
}

const getFormattedDriverValuesMap = (drivers: IDashboardDriver[]) => {
    if (!drivers) return {}
    const driversValuesMap = {}
    drivers.forEach((driver: IDashboardDriver) => driversValuesMap[driver.urlName] = { value: driver.value, multivalue: driver.multivalue })
    return driversValuesMap
}

const getFormattedDynamicParameterUrl = (parameter: IWidgetInteractionParameter, formattedRow: any) => {
    let columnValue = ''
    if (parameter.column === 'column_name_mode') columnValue = formattedRow.columnName
    else if (parameter.column) columnValue = formattedRow[parameter.column].value
    return `${parameter.name}=${columnValue ?? ''}&`
}

const getFormattedDriverParameterUrl = (parameter: IWidgetInteractionParameter, driversValuesMap: any) => {
    if (!parameter.driver || !driversValuesMap[parameter.driver]) return `${parameter.name}=&`
    else if (!driversValuesMap[parameter.driver].multivalue) return `${parameter.name}=${driversValuesMap[parameter.driver].value}&`
    else {
        let formattedUrl = ``
        const driverValuesAsArray = driversValuesMap[parameter.driver].value.split(',')
        driverValuesAsArray.forEach((value: string) => formattedUrl += `${parameter.name}=${value}&`)
        return formattedUrl
    }
}

const getFormattedSelectionParameterUrl = (parameter: IWidgetInteractionParameter, dashboardId: string) => {
    const dashStore = dashboardStore()
    const activeSelections = dashStore.getSelections(dashboardId)
    const activeSelection = getActiveSelectionByDatasetAndColumn(parameter.dataset, parameter.column, activeSelections)
    const value = activeSelection ? activeSelection.value : ''
    return `${parameter.name}=${value}&`
}

const getFormattedJWTParameterUrl = (parameter: IWidgetInteractionParameter) => {
    const store = mainStore()
    const user = store.getUser()
    return `${parameter.name}=${user?.userUniqueIdentifier ?? ''}&`
}

const getFormattedJSONParameterUrl = (parameter: IWidgetInteractionParameter, variables: IVariable[], drivers: IDashboardDriver[]) => {
    const store = mainStore()
    if (!parameter.json) return `${parameter.name}=&`
    let json = replacePlaceholders(parameter.json, variables, drivers)
    try {
        json = JSON.parse(json)
        return `${parameter.name}=${JSON.stringify(json)}&`
    } catch (error: any) {
        store.setError({ title: t('common.error.generic'), msg: t('dashboard.widgetEditor.jsonLinkParsingError') })
        return `${parameter.name}=&`
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