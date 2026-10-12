import { byTourId, IKnTourStep, runTour } from '@/helpers/commons/tourHelper'

interface IWidgetPickerTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    root: HTMLElement
}

const text = (t: IWidgetPickerTourContext['t'], key: string) => ({ title: t(`dashboard.tour.picker.${key}Title`), description: t(`dashboard.tour.picker.${key}Description`) })

export function startWidgetPickerTour({ t, root }: IWidgetPickerTourContext) {
    const inRoot = (id: string) => () => byTourId(id, root) as Element

    // The locked step shows only without an enterprise license.
    const steps: IKnTourStep[] = [
        { element: inRoot('picker-search'), popover: { ...text(t, 'search'), side: 'left' } },
        { element: inRoot('picker-list'), popover: { ...text(t, 'list'), side: 'left' } },
        { element: inRoot('picker-locked'), popover: { ...text(t, 'locked'), side: 'left' } }
    ]

    runTour({ t, steps })
}
