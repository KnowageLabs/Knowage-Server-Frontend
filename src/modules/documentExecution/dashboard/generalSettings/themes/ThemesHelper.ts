import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { IWidget } from '../../Dashboard'

export const applySelectedThemeToWidgets = (widgets: IWidget[], selectedTheme: IDashboardTheme) => {
    const selectedThemeConfig = selectedTheme.config

    widgets.forEach((widget) => {
        switch (widget.type) {
            case 'table':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.table)
                break
            case 'selector':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.selector)
                break
            case 'html':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.html)
                break
            case 'text':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.text)
                break
            case 'highcharts':
            case 'chartJS':
            case 'vega':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.chart)
                break
            case 'customchart':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.customChart)
                break
            case 'static-pivot-table':
            case 'ce-pivot-table':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.pivot)
                break
            case 'discovery':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.discovery)
                break
            case 'python':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.python)
                break
            case 'r':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.r)
                break
            case 'selection':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.activeSelections)
                break
            case 'image':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.image)
                break
            case 'map':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeId, selectedThemeConfig.map)
                break
            default:
                break
        }
    })
}

export const applyStylesToWidget = (widgetStyle, themeName, themeStyle) => {
    const propertiesToIgnore = ['title']

    widgetStyle.themeName = themeName
    for (const styleProp in themeStyle.style) {
        if (!propertiesToIgnore.includes(styleProp) && widgetStyle[styleProp]) {
            widgetStyle[styleProp] = themeStyle.style[styleProp]
        }
    }
}

export const updateWidgetThemeAndApplyStyle = (widget: IWidget, themes: IDashboardTheme[]) => {
    if (widget?.settings?.style.themeId) {
        const theme = themes.find((theme: IDashboardTheme) => theme.themeId === widget.settings.style.themeId)
        if (theme) applySelectedThemeToWidgets([widget], theme)
    }
}
