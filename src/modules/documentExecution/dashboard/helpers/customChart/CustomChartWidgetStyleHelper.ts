import { ICustomChartStyle } from '../../interfaces/customChart/DashboardCustomChartWidget'
import { getFormattedTitleStyle, getFormattedPaddingStyle, getFormattedBorderStyle, getFormattedShadowsStyle, getFormattedBackgroundStyle } from '../common/WidgetStyleHelper'

export const getFormattedStyle = (widget: any) => {
    return {
        themeId: null,
        title: getFormattedTitleStyle(widget),
        padding: getFormattedPaddingStyle(widget),
        borders: getFormattedBorderStyle(widget),
        shadows: getFormattedShadowsStyle(widget),
        background: getFormattedBackgroundStyle(widget)
    } as ICustomChartStyle
}
