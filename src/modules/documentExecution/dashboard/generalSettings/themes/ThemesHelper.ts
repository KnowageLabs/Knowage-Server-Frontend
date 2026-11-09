import { IDashboardTheme, IDashboardThemeBackground } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { migrateTitleAlignment, themeHasBackground } from '@/modules/managers/dashboardThemeManagement/DashboardThemeHelper'
import { IBackground, IDashboardConfiguration, IWidget } from '../../Dashboard'
import { normalizeSheetTabs } from '../../sheetTabs/SheetTabsHelper'
import deepcopy from 'deepcopy'

export const applySelectedThemeToWidgets = (widgets: IWidget[], selectedTheme: IDashboardTheme, filterType: 'allWidgets' | 'withThemes' | 'withoutThemes' = 'allWidgets') => {
    const selectedThemeConfig = selectedTheme.config

    widgets.forEach((widget) => {
        const hasThemeId = widget.settings?.style?.themeId != null
        if (filterType === 'withThemes' && !hasThemeId) return
        if (filterType === 'withoutThemes' && hasThemeId) return

        switch (widget.type) {
            case 'table':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.table)
                break
            case 'selector':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.selector)
                break
            case 'html':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.html)
                break
            case 'text':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.text)
                break
            case 'highcharts':
            case 'chartJS':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.chart)
                break
            case 'customchart':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.customChart)
                break
            case 'static-pivot-table':
            case 'ce-pivot-table':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.pivot)
                break
            case 'discovery':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.discovery)
                break
            case 'python':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.python)
                break
            case 'r':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.r)
                break
            case 'selection':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.activeSelections)
                break
            case 'image':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.image)
                break
            case 'map':
                applyStylesToWidget(widget, selectedTheme, selectedThemeConfig.map)
                break
            default:
                break
        }
    })
}

export const applyStylesToWidget = (widget, theme: IDashboardTheme, themeStyle) => {
    if (!themeStyle || !widget?.settings?.style) return
    const widgetStyle = widget.settings.style
    widgetStyle.themeId = theme.id
    widgetStyle.themeName = theme.themeName
    for (const styleProp in themeStyle.style) {
        if (styleProp === 'title') {
            const originalText = widgetStyle[styleProp].text
            const { text, ...rest } = deepcopy(themeStyle.style[styleProp])
            migrateTitleAlignment(rest)
            widgetStyle[styleProp] = { ...rest, text: originalText }
        } else if (styleProp === 'colors') {
            widget.settings.chart.colors = deepcopy(themeStyle.style[styleProp])
        } else {
            widgetStyle[styleProp] = deepcopy(themeStyle.style[styleProp])
        }
    }
}

export const updateWidgetThemeAndApplyStyle = (widget: IWidget, themes: IDashboardTheme[]) => {
    if (widget?.settings?.style.themeId) {
        const theme = themes.find((theme: IDashboardTheme) => theme.id === widget.settings.style.themeId)
        if (theme) applySelectedThemeToWidgets([widget], theme)
    }
}

const copySheetBackground = (background: IBackground, themeBackground: Partial<IDashboardThemeBackground> | undefined) => {
    background.sheetsBackgroundColor = themeBackground?.sheetsBackgroundColor ?? ''
    background.imageBackgroundUrl = themeBackground?.imageBackgroundUrl ?? ''
    background.imageBackgroundSize = themeBackground?.imageBackgroundSize ?? ''
    background.sheetsBackgroundStyle = themeBackground?.sheetsBackgroundStyle ?? ''
}

// Copies the theme background into the dashboard and connects it to the theme, as applyStylesToWidget does for a widget.
// A theme with no background leaves the dashboard background as it is.
export const applyThemeBackground = (background: IBackground | undefined, theme: IDashboardTheme | undefined) => {
    if (!background || !theme || !themeHasBackground(theme.config?.sheetBackground)) return
    copySheetBackground(background, theme.config.sheetBackground)
    background.themeId = theme.id
}

// On load, a connected background gets the current theme background again, as connected widgets do.
// The saved template has no theme config, so the values come from the loaded themes. A deleted theme keeps the saved values.
export const updateBackgroundFromTheme = (background: IBackground | undefined, themes: IDashboardTheme[]) => {
    if (background?.themeId == null) return
    const theme = themes.find((theme: IDashboardTheme) => theme.id === background.themeId)
    if (theme) copySheetBackground(background, theme.config?.sheetBackground)
}

// The sheet tab bar. A theme always has one (a theme saved before this feature counts as the default look),
// so applying a theme always connects it. The dashboard object is replaced: General settings rebuild their form from it.
export const applyThemeSheetTabs = (configuration: IDashboardConfiguration | undefined, theme: IDashboardTheme | undefined) => {
    if (!configuration || !theme) return
    configuration.sheetTabs = { ...normalizeSheetTabs(theme.config?.sheetTabs), themeId: theme.id }
}

// On load, connected sheet tabs get the current theme values again. A deleted theme keeps the saved values.
export const updateSheetTabsFromTheme = (configuration: IDashboardConfiguration | undefined, themes: IDashboardTheme[]) => {
    if (configuration?.sheetTabs?.themeId == null) return
    const theme = themes.find((theme: IDashboardTheme) => theme.id === configuration.sheetTabs?.themeId)
    if (theme) applyThemeSheetTabs(configuration, theme)
}
