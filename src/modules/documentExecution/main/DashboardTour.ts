import { byTourId, IKnTourStep, isVisible, runTour, wait } from '@/helpers/commons/tourHelper'

interface IDashboardTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    // The root of this document view: the document browser can keep other dashboards mounted next to it.
    root: HTMLElement
    openMenu: () => void
    closeMenu: () => void
}

// The toolbar menu fades in; the tour waits for it before it highlights it.
const MENU_ANIMATION_MS = 250

const text = (t: IDashboardTourContext['t'], key: string) => ({ title: t(`dashboard.tour.dashboard.${key}Title`), description: t(`dashboard.tour.dashboard.${key}Description`) })

// Order of a new dashboard: datasets first, then widgets, then the settings in the menu, then more sheets.
export function startDashboardTour(context: IDashboardTourContext) {
    const { t, root } = context
    const inRoot = (id: string) => () => byTourId(id, root) as Element
    const firstWidget = () => Array.from(root.querySelectorAll("[data-tour-id='dashboard-widget']")).find((widget) => isVisible(widget)) as Element

    const steps: IKnTourStep[] = [
        { element: inRoot('dashboard-datasets'), popover: { ...text(t, 'datasets'), side: 'bottom' } },
        { element: inRoot('dashboard-add-widget'), popover: { ...text(t, 'addWidget'), side: 'bottom' } },
        { element: firstWidget, popover: text(t, 'widget') },
        {
            // The menu is teleported to the body; only one toolbar menu is open at a time.
            element: () => byTourId('dashboard-menu') as Element,
            popover: { ...text(t, 'menu'), side: 'left' },
            before: async () => {
                context.openMenu()
                await wait(MENU_ANIMATION_MS)
            },
            after: () => context.closeMenu()
        },
        { element: inRoot('dashboard-sheets'), popover: { ...text(t, 'sheets'), side: 'top' } }
    ]

    runTour({ t, steps })
}
