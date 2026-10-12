import { byTourId, IKnTourStep, runTour } from '@/helpers/commons/tourHelper'

interface IGeneralSettingsTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    root: HTMLElement
}

const text = (t: IGeneralSettingsTourContext['t'], key: string) => ({ title: t(`dashboard.tour.settings.${key}Title`), description: t(`dashboard.tour.settings.${key}Description`) })

export function startGeneralSettingsTour({ t, root }: IGeneralSettingsTourContext) {
    const inRoot = (id: string) => () => byTourId(id, root) as Element

    const steps: IKnTourStep[] = [
        { element: inRoot('settings-search'), popover: { ...text(t, 'search'), side: 'right' } },
        { element: inRoot('settings-list'), popover: { ...text(t, 'list'), side: 'right' } },
        { element: inRoot('settings-content'), popover: { ...text(t, 'content'), side: 'left' } }
    ]

    runTour({ t, steps })
}
