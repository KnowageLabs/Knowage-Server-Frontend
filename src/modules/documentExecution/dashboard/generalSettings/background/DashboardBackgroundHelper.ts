import { IBackground } from '../../Dashboard'
import { IDashboardThemeBackground } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'

// The style of the sheet container. The dashboard renderer and the theme manager preview both use it, so the preview shows
// what a dashboard gets. The sheet container scrolls, so the background stays fixed while the widgets scroll over it.
export const getSheetBackgroundStyle = (background: IBackground | IDashboardThemeBackground | null | undefined): Record<string, string> => {
    if (background?.sheetsBackgroundStyle) {
        return { background: background.sheetsBackgroundStyle, 'min-height': '100%' }
    }

    const backgroundStyle: Record<string, string> = { 'background-size': background?.imageBackgroundSize || '100%', 'background-position': 'center', 'background-repeat': 'no-repeat', 'min-height': '100%' }

    if (background?.imageBackgroundUrl) backgroundStyle['background-image'] = `url('${background.imageBackgroundUrl}')`
    if (background?.sheetsBackgroundColor) backgroundStyle['background-color'] = background.sheetsBackgroundColor
    backgroundStyle['background-size'] = background?.imageBackgroundSize || 'contain'

    return backgroundStyle
}
