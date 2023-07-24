import { IDashboardDriver, IFrameInteractionSettings, IVariable } from "../../Dashboard"
import { replaceDriversPlaceholdersByDriverUrlName, replaceVariablesPlaceholdersByVariableName } from "./InteractionLinkHelper"
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import i18n from '@/App.i18n'

const { t } = i18n.global


interface IClickedValue { value: string, type: string }

export const startTableWidgetIFrameInteractions = (clickedValue: IClickedValue, formattedRow: any, iFrameInteractionSettings: IFrameInteractionSettings, dashboardId: string, variables: IVariable[], parentWindow: any) => {
    // TODO - FOR TESTING ONLY!
    parentWindow.addEventListener('message', test)

    if (!parentWindow) return
    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const formattedJSON = getFormattedJSON(iFrameInteractionSettings, variables, drivers)
    console.log('--------- parentWindow: ', parentWindow)
    sendMessageToParentWindow(parentWindow, formattedJSON)
}

const getFormattedJSON = (iFrameInteractionSettings: IFrameInteractionSettings, variables: IVariable[], drivers: IDashboardDriver[]) => {
    if (!iFrameInteractionSettings.json) return ''
    const store = mainStore()
    let json = replacePlaceholders(iFrameInteractionSettings.json, variables, drivers)
    try {
        json = JSON.parse(json)
        return json
    } catch (error: any) {
        store.setError({ title: t('common.error.generic'), msg: t('dashboard.widgetEditor.jsonLinkParsingError') })
        return ''
    }
}

const replacePlaceholders = (originalString: string, variables: IVariable[], drivers: IDashboardDriver[]) => {
    originalString = replaceVariablesPlaceholdersByVariableName(originalString, variables)
    originalString = replaceDriversPlaceholdersByDriverUrlName(originalString, drivers)
    return originalString
}

const sendMessageToParentWindow = (parentWindow: any, formattedJSON: string) => {
    console.log('--------- CAAAAAAAAAAALED!', formattedJSON)
    parentWindow.postMessage({
        "source": "knowage",
        "type": "message",
        "json": formattedJSON
    }, "*")
}

// TODO - FOR TESTING!
const test = (event: any) => {
    console.log('----- TEST: ', event)
    console.log('----- TEST MESSAGE: ', event.data)
}