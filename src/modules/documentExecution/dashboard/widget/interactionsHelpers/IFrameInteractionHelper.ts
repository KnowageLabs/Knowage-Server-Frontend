import { IDashboardDriver, IFrameInteractionSettings, IVariable } from "../../Dashboard"
import { replaceDriversPlaceholdersByDriverUrlName, replaceVariablesPlaceholdersByVariableName } from "./InteractionLinkHelper"
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import i18n from '@/App.i18n'
import { columnFieldRegex } from "../../helpers/common/DashboardRegexHelper"

const { t } = i18n.global


interface IClickedValue { value: string, type: string }

export const startTableWidgetIFrameInteractions = (clickedValue: IClickedValue, formattedRow: any, iFrameInteractionSettings: IFrameInteractionSettings, dashboardId: string, variables: IVariable[], parentWindow: any) => {
    // TODO - FOR TESTING ONLY!
    parentWindow.addEventListener('message', test)

    if (!parentWindow) return
    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const formattedJSON = getFormattedJSON(iFrameInteractionSettings, variables, drivers, formattedRow, null)
    console.log('--------- PARENT WINDOW: ', parentWindow)
    sendMessageToParentWindow(parentWindow, formattedJSON)
}

export const startHTMLIFrameInteractions = (iframeMessage: string, iFrameInteractionSettings: IFrameInteractionSettings, dashboardId: string, variables: IVariable[], parentWindow: any) => {
    // TODO - FOR TESTING ONLY!
    parentWindow.addEventListener('message', test)

    if (!parentWindow) return
    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const formattedJSON = getFormattedJSON(iFrameInteractionSettings, variables, drivers, null, iframeMessage)
    sendMessageToParentWindow(parentWindow, formattedJSON)
}

const getFormattedJSON = (iFrameInteractionSettings: IFrameInteractionSettings, variables: IVariable[], drivers: IDashboardDriver[], formattedRow: any, iframeMessage: string | null) => {
    if (!iFrameInteractionSettings.json) return ''
    const store = mainStore()
    let json = formattedRow ? replacePlaceholdersForTable(iFrameInteractionSettings.json, variables, drivers, formattedRow) : replacePlaheoldersForHTMLAndCustomChart(iFrameInteractionSettings.json, variables, drivers, iframeMessage)
    try {
        json = JSON.parse(json)
        return json
    } catch (error: any) {
        store.setError({ title: t('common.error.generic'), msg: t('dashboard.widgetEditor.jsonLinkParsingError') })
        return ''
    }
}

const replacePlaceholdersForTable = (originalString: string, variables: IVariable[], drivers: IDashboardDriver[], formattedRow: any) => {
    originalString = replaceVariablesPlaceholdersByVariableName(originalString, variables)
    originalString = replaceDriversPlaceholdersByDriverUrlName(originalString, drivers)
    originalString = replaceFieldPlaceholdersByColumnName(originalString, formattedRow)
    return originalString
}

const sendMessageToParentWindow = (parentWindow: any, formattedJSON: string) => {
    console.log('--------- JSON TO SEND: ', formattedJSON)
    parentWindow.postMessage({
        "source": "knowage",
        "type": "message",
        "json": formattedJSON
    }, "*")
}

// TODO - Move to common?
export const replaceFieldPlaceholdersByColumnName = (originalString: string, formattedRow: any) => {
    originalString = originalString.replace(columnFieldRegex, (match: string, fieldName: string) => {
        return formattedRow[fieldName] ? formattedRow[fieldName].value : ''
    })
    return originalString
}

const replacePlaheoldersForHTMLAndCustomChart = (originalString: string, variables: IVariable[], drivers: IDashboardDriver[], iframeMessage: string | null) => {
    originalString = replaceVariablesPlaceholdersByVariableName(originalString, variables)
    originalString = replaceDriversPlaceholdersByDriverUrlName(originalString, drivers)
    originalString = replaceFieldPlaceholdersMessagePlaceholder(originalString, iframeMessage)
    return originalString
}

const replaceFieldPlaceholdersMessagePlaceholder = (originalString, iframeMessage: string | null) => {
    const valueRegex = /\$\{value\}/g;
    return iframeMessage ? originalString.replaceAll(valueRegex, iframeMessage) : ''
}


// TODO - FOR TESTING!
const test = (event: any) => {
    // console.log('----- TEST: ', event)
    //console.log('----- TEST MESSAGE: ', event.data)
}