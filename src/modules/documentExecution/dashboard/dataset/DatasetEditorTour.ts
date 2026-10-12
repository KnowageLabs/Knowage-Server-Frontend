import { byTourId, IKnTourStep, runTour } from '@/helpers/commons/tourHelper'

interface IDatasetEditorTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    root: HTMLElement
    onDestroyed: () => void
}

const text = (t: IDatasetEditorTourContext['t'], key: string) => ({ title: t(`dashboard.tour.dataset.${key}Title`), description: t(`dashboard.tour.dataset.${key}Description`) })

// The editor shows the Data tab before the tour starts. The Associations tab shows only with two or more datasets.
export function startDatasetEditorTour({ t, root, onDestroyed }: IDatasetEditorTourContext) {
    const inRoot = (id: string) => () => byTourId(id, root) as Element

    const steps: IKnTourStep[] = [
        { element: inRoot('dataset-list'), popover: { ...text(t, 'list'), side: 'right' } },
        { element: inRoot('dataset-add'), popover: { ...text(t, 'add'), side: 'bottom' } },
        { element: inRoot('dataset-detail'), popover: { ...text(t, 'detail'), side: 'left' } },
        { element: inRoot('dataset-associations'), popover: { ...text(t, 'associations'), side: 'bottom' } }
    ]

    runTour({ t, steps, onDestroyed })
}
