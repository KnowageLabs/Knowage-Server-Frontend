import { createNewWidget, createNewWidgetSettings } from "../widget/WidgetEditor/helpers/WidgetEditorHelpers"

export const createCustomHeaderWidget = () => {
    const customHeaderWidget = createNewWidget('html')
    createNewWidgetSettings(customHeaderWidget)
    customHeaderWidget.new = false
    customHeaderWidget.settings.isCustomDashboardHeader = true
    customHeaderWidget.settings.configuration.customDashboardHeaderConfiguration = { height: '60px' }
    delete customHeaderWidget.settings.responsive
    return customHeaderWidget
}  
