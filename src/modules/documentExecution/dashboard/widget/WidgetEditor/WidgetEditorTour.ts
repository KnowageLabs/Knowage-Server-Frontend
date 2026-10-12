import { byTourId, IKnTourStep, runTour, wait } from '@/helpers/commons/tourHelper'

interface IWidgetEditorTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    root: HTMLElement
    hasDataTab: boolean
    isMap: boolean
    // The pivot table and the chart gallery have no preview
    hasPreview: boolean
    showTab: (tab: 'data' | 'settings') => Promise<void>
    showPreview: () => void
    onDestroyed: () => void
}

// The preview drawer slides in; the tour waits for it before it highlights it.
const DRAWER_ANIMATION_MS = 300

const text = (t: IWidgetEditorTourContext['t'], key: string) => ({ title: t(`dashboard.tour.editor.${key}Title`), description: t(`dashboard.tour.editor.${key}Description`) })

// The side list shows the datasets on the Data tab and the settings groups on the Settings tab, so the tour switches tabs.
export function startWidgetEditorTour(context: IWidgetEditorTourContext) {
    const { t, root } = context
    const inRoot = (id: string) => () => byTourId(id, root) as Element
    const showData = () => context.showTab('data')

    const dataSteps: IKnTourStep[] = [
        { element: inRoot('editor-side'), popover: { ...text(t, context.isMap ? 'layers' : 'dataList'), side: 'right' }, before: showData },
        { element: inRoot('editor-main'), popover: { ...text(t, 'dataPanel'), side: 'left' }, before: showData }
    ]

    const previewStep: IKnTourStep = {
        element: inRoot('editor-preview'),
        popover: { ...text(t, 'preview'), side: 'left' },
        before: async () => {
            context.showPreview()
            await wait(DRAWER_ANIMATION_MS)
        }
    }

    const steps: IKnTourStep[] = [
        { element: inRoot('editor-tabs'), popover: { ...text(t, 'tabs'), side: 'bottom' } },
        ...(context.hasDataTab ? dataSteps : []),
        { element: inRoot('editor-side'), popover: { ...text(t, 'settings'), side: 'right' }, before: () => context.showTab('settings') },
        ...(context.hasPreview ? [previewStep] : [])
    ]

    runTour({ t, steps, onDestroyed: context.onDestroyed })
}
