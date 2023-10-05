import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { IWidget } from '../../Dashboard'

export const applySelectedThemeToWidgets = (widgets: IWidget[], selectedTheme: IDashboardTheme) => {
    const selectedThemeConfig = selectedTheme.config

    widgets.forEach((widget) => {
        switch (widget.type) {
            case 'table':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.table)
                break
            case 'selector':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.selector)
                break
            case 'html':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.html)
                break
            case 'text':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.text)
                break
            case 'highcharts':
            case 'chartJS':
            case 'vega':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.chart)
                break
            case 'customchart':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.customChart)
                break
            case 'static-pivot-table':
            case 'ce-pivot-table':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.pivot)
                break
            case 'discovery':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.discovery)
                break
            case 'python':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.python)
                break
            case 'r':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.r)
                break
            case 'selection':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.activeSelections)
                break
            case 'image':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.image)
                break
            case 'map':
                applyStylesToWidget(widget.settings.style, selectedTheme.themeName, selectedThemeConfig.map)
                break
            default:
                break
        }
    })
}

export const applyStylesToWidget = (widgetStyle, themeName, themeStyle) => {
    widgetStyle.themeName = themeName
    for (const styleProp in themeStyle.style) {
        if (widgetStyle[styleProp]) {
            widgetStyle[styleProp] = themeStyle.style[styleProp]
        }
    }
}
