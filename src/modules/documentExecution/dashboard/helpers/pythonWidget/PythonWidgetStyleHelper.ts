import { IPythonWidgetStyle } from "../../interfaces/DashboardPythonWidget"
import { getFormattedBackgroundStyle, getFormattedBorderStyle, getFormattedPaddingStyle, getFormattedShadowsStyle, getFormattedTitleStyle } from "../common/WidgetStyleHelper"


export const getFormattedStyle = (widget: any) => {
    return {
        themeName: '',
        title: getFormattedTitleStyle(widget),
        padding: getFormattedPaddingStyle(widget),
        borders: getFormattedBorderStyle(widget),
        shadows: getFormattedShadowsStyle(widget),
        background: getFormattedBackgroundStyle(widget)
    } as IPythonWidgetStyle
}
