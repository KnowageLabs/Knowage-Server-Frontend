import { toast } from 'vue-sonner'
import { IWidget } from '../Dashboard'
import { emitter } from '../DashboardHelpers'
import i18n from '@/App.i18n'

const { t } = i18n.global

const ERROR_TOAST_DURATION = 6000
const ACTION_TOAST_DURATION = 3000
const WIDGET_TYPE_LABELS: Record<string, string> = {
    table: 'Table',
    selector: 'Selector',
    highcharts: 'Chart',
    chartJS: 'Chart',
    customchart: 'Chart',
    'static-pivot-table': 'Pivot Table',
    'ce-pivot-table': 'Pivot Table',
    discovery: 'Discovery',
    python: 'Python',
    map: 'Map',
    html: 'HTML',
    text: 'Text',
    image: 'Image',
    selection: 'Active Selections'
}

const getWidgetLabel = (widget?: IWidget) => {
    if (!widget) return t('dashboard.widgetTypeLabels.genericWidget')
    const title = widget.settings?.style?.title?.text?.trim()
    if (title) return title
    return WIDGET_TYPE_LABELS[widget.type] ?? widget.type ?? t('dashboard.widgetTypeLabels.genericWidget')
}

// Shows an error toast for a dashboard widget, deduped by widget id so repeated failures update the same toast instead of stacking.
export const showDashboardWidgetError = (widget: IWidget | undefined, message: string, datasetLabel?: string) => {
    toast.error(getWidgetLabel(widget), {
        id: widget?.id ?? message,
        description: datasetLabel ? `${datasetLabel} - ${message}` : message,
        duration: ERROR_TOAST_DURATION,
        action: widget?.id
            ? {
                  label: t('dashboard.widgetTypeLabels.locateWidget'),
                  onClick: () => emitter.emit('highlightWidget', widget.id)
              }
            : undefined
    })
}

// Shows a plain success/info/warning/error toast for dashboard-level actions (save, export, cache clear) with no widget context.
export const showDashboardActionToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => {
    // 'success' renders as 'info' since the app doesn't use green toasts elsewhere
    const toastType = type === 'success' ? 'info' : type
    toast[toastType](title, {
        description: message,
        duration: type === 'error' ? ERROR_TOAST_DURATION : ACTION_TOAST_DURATION
    })
}
