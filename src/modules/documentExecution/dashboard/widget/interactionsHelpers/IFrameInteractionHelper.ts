import { IDashboardDriver, IFrameInteractionSettings, IVariable } from "../../Dashboard"
import { replaceDriversPlaceholdersByDriverUrlName, replaceFieldPlaceholdersByColumnName, replaceVariablesPlaceholdersByVariableName } from "./InteractionsParserHelper"
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import i18n from '@/App.i18n'

const { t } = i18n.global


export const startTableWidgetIFrameInteractions = (formattedRow: any, iFrameInteractionSettings: IFrameInteractionSettings, dashboardId: string, variables: IVariable[], window: any) => {
    if (!window.parent || window.parent !== window.top) return
    // TODO - FOR TESTING ONLY!
    window.parent.addEventListener('message', test)

    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const formattedJSON = getFormattedJSON(iFrameInteractionSettings, variables, drivers, formattedRow, null)
    sendMessageToParentWindow(window.parent, formattedJSON)
}

export const startHTMLAndCustomChartIFrameInteractions = (iframeMessage: string | number, iFrameInteractionSettings: IFrameInteractionSettings, dashboardId: string, variables: IVariable[], window: any) => {
    if (!window.parent || window.parent !== window.top) return
    // TODO - FOR TESTING ONLY!
    window.parent.addEventListener('message', test)

    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const formattedJSON = getFormattedJSON(iFrameInteractionSettings, variables, drivers, null, iframeMessage)
    sendMessageToParentWindow(window.parent, formattedJSON)
}

const getFormattedJSON = (iFrameInteractionSettings: IFrameInteractionSettings, variables: IVariable[], drivers: IDashboardDriver[], formattedRow: any, iframeMessage: string | number | null) => {
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

const replacePlaheoldersForHTMLAndCustomChart = (originalString: string, variables: IVariable[], drivers: IDashboardDriver[], iframeMessage: string | number | null) => {
    originalString = replaceVariablesPlaceholdersByVariableName(originalString, variables)
    originalString = replaceDriversPlaceholdersByDriverUrlName(originalString, drivers)
    originalString = replaceFieldPlaceholdersMessagePlaceholder(originalString, iframeMessage)
    return originalString
}

const replaceFieldPlaceholdersMessagePlaceholder = (originalString, iframeMessage: string | number | null) => {
    const valueRegex = /\$\{value\}/g;
    return iframeMessage ? originalString.replaceAll(valueRegex, iframeMessage) : ''
}

// TODO - FOR TESTING!
const test = (event: any) => {
    console.log('----- TEST MESSAGE: ', event.data)
}