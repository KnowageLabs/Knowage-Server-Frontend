import { IWidgetBordersStyle, IWidgetPaddingStyle, IWidgetShadowsStyle } from '../../Dashboard'
import { ISelectorWidgetLabelStyle, ISelectorWidgetRadioStyle, ISelectorWidgetStyle } from '../../interfaces/DashboardSelectorWidget'
import { getFormattedBackgroundStyle, getFormattedTitleStyle } from '../common/WidgetStyleHelper'
import { hexToRgba } from '../FormattingHelpers'
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as selectorWidgetDefaultValues from '../../widget/WidgetEditor/helpers/selectorWidget/SelectorWidgetDefaultValues'

export const getFormattedStyle = (widget: any) => {
    return {
        themeId: null,
        title: getFormattedTitleStyle(widget),
        label: getFormattedLabelStyle(widget),
        radio: getFormattedRadioStyle(widget),
        padding: getFormattedPaddingStyle(widget),
        borders: getFormattedBorderStyle(widget),
        shadows: getFormattedShadowsStyle(widget),
        background: getFormattedBackgroundStyle(widget)
    } as ISelectorWidgetStyle
}

const getFormattedLabelStyle = (widget) => {
    if (!widget.style) return selectorWidgetDefaultValues.getDefaultLabelStyle()
    const formattedLabelStyle = {
        enabled: true,
        wrapText: widget.settings.wrapText ?? '',
        properties: {
            'font-weight': widget.style['font-weight'] ?? '',
            'font-style': widget.style['font-style'] ?? '',
            'font-size': widget.style['font-size'] ?? '',
            'font-family': widget.style['font-family'] ?? '',
            'justify-content': widget.style['justify-content'] ?? '',
            color: widget.style.color ?? '',
            'background-color': widget.style['background-color'] ?? ''
        }
    } as ISelectorWidgetLabelStyle

    return formattedLabelStyle
}

const getFormattedRadioStyle = (widget) => {
    if (!widget.style) return selectorWidgetDefaultValues.getDefaultRadioStyle()
    const formattedRadioStyle = {
        size: widget.style.size ?? 'md',
        layout: widget.style.layout ?? 'column',
        gridColumns: widget.style.gridColumns ?? '2',
        padding: widget.style.padding ?? '4px',
        margin: widget.style.margin ?? '0px',
        color: widget.style.color ?? '',
        keepColor: widget.style.keepColor ?? false,
        icon: widget.style.icon ?? '',
        checkedIcon: widget.style.checkedIcon ?? ''
    } as ISelectorWidgetRadioStyle

    // Handle backward compatibility - if old properties structure exists
    if (widget.style.properties) {
        formattedRadioStyle.size = widget.style.properties.size ?? formattedRadioStyle.size
        formattedRadioStyle.layout = widget.style.properties.layout ?? formattedRadioStyle.layout
        formattedRadioStyle.gridColumns = widget.style.properties.gridColumns ?? formattedRadioStyle.gridColumns
        formattedRadioStyle.padding = widget.style.properties.padding ?? formattedRadioStyle.padding
        formattedRadioStyle.margin = widget.style.properties.margin ?? formattedRadioStyle.margin
        formattedRadioStyle.color = widget.style.properties.color ?? formattedRadioStyle.color
    }

    // Migrate old label values to new radio.label styling
    if (widget.label && widget.label.properties) {
        formattedRadioStyle.label = {
            'font-weight': widget.label.properties['font-weight'] ?? '',
            'font-style': widget.label.properties['font-style'] ?? '',
            'font-size': widget.label.properties['font-size'] ?? '',
            'font-family': widget.label.properties['font-family'] ?? '',
            color: widget.label.properties.color ?? '',
            'background-color': widget.label.properties['background-color'] ?? ''
        }
    }

    return formattedRadioStyle
}

const getFormattedPaddingStyle = (widget: any) => {
    if (!widget.style || !widget.style.padding) return widgetCommonDefaultValues.getDefaultPaddingStyle()

    return {
        enabled: true,
        properties: {
            'padding-top': widget.style.padding['padding-top'],
            'padding-left': widget.style.padding['padding-left'],
            'padding-bottom': widget.style.padding['padding-bottom'],
            'padding-right': widget.style.padding['padding-right'],
            unlinked: widget.style.padding.unlinked
        }
    } as IWidgetPaddingStyle
}

const getFormattedBorderStyle = (widget: any) => {
    if (!widget.style || !widget.style.border) return { ...widgetCommonDefaultValues.getDefaultBordersStyle(), enabled: true }

    return { enabled: true, properties: { ...widget.style.border, 'border-color': widget.style.border['border-color'] } } as IWidgetBordersStyle
}

const getFormattedShadowsStyle = (widget: any) => {
    if (!widget.style || !widget.style.shadow) return { ...widgetCommonDefaultValues.getDefaultShadowsStyle(), enabled: true, properties: { 'box-shadow': ' 0px 2px 3px', color: 'rgb(204, 204, 204)' } }

    return {
        enabled: true,
        properties: {
            'box-shadow': widget.style.shadow['box-shadow'],
            color: hexToRgba(widget.style.backgroundColor)
        }
    } as IWidgetShadowsStyle
}
