import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { IWidget } from '../../Dashboard'
import deepcopy from 'deepcopy'

export const applySelectedThemeToWidgets = (widgets: IWidget[], selectedTheme: IDashboardTheme, filterType: 'allWidgets' | 'withThemes' | 'withoutThemes' = 'allWidgets') => {
    const selectedThemeConfig = selectedTheme.config

    widgets.forEach((widget) => {
        const hasThemeId = widget.settings?.style?.themeId != null
        if (filterType === 'withThemes' && !hasThemeId) return
        if (filterType === 'withoutThemes' && hasThemeId) return

        switch (widget.type) {
            case 'table':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.table)
                break
            case 'selector':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.selector)
                break
            case 'html':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.html)
                break
            case 'text':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.text)
                break
            case 'highcharts':
            case 'chartJS':
            case 'vega':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.chart)
                break
            case 'customchart':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.customChart)
                break
            case 'static-pivot-table':
            case 'ce-pivot-table':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.pivot)
                break
            case 'discovery':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.discovery)
                break
            case 'python':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.python)
                break
            case 'r':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.r)
                break
            case 'selection':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.activeSelections)
                break
            case 'image':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.image)
                break
            case 'map':
                applyStylesToWidget(widget.settings.style, selectedTheme, selectedThemeConfig.map)
                break
            default:
                break
        }
    })
}

export const applyStylesToWidget = (widgetStyle, theme: IDashboardTheme, themeStyle) => {
    widgetStyle.themeId = theme.id
    widgetStyle.themeName = theme.themeName
    for (const styleProp in themeStyle.style) {
        if (styleProp === 'title') {
            const originalText = widgetStyle[styleProp].text
            const { text, ...rest } = themeStyle.style[styleProp]
            widgetStyle[styleProp] = { ...rest, text: originalText }
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
