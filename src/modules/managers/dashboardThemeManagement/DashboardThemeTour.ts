import { byTourId, IKnTourStep, runTour, wait } from '@/helpers/commons/tourHelper'

interface IThemeTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    // Opens a theme when none is open, so the canvas steps have something to point at. Resolves when the canvas is shown.
    ensureTheme: () => Promise<boolean>
    openTablePanel: () => void
    closePanel: () => void
}

const element = (id: string) => () => byTourId(id) as Element

// The style panel slides in; the tour waits for it before it highlights something inside it.
const PANEL_ANIMATION_MS = 350

const text = (t: IThemeTourContext['t'], key: string) => ({ title: t(`managers.dashboardThemeManager.tour.${key}Title`), description: t(`managers.dashboardThemeManager.tour.${key}Description`) })

// Order: find or add a theme, name it, edit one widget type, see what inherit does, edit the shared style for all,
// focus settings, then save.
export async function startDashboardThemeTour(context: IThemeTourContext) {
    const { t } = context

    // The inherit toggle lives in the style panel; the tour opens the panel for that step and closes it after.
    const steps: IKnTourStep[] = [
        { element: element('theme-list'), popover: { ...text(t, 'list'), side: 'right' } },
        { element: element('theme-add'), popover: { ...text(t, 'add'), side: 'bottom' } },
        { element: element('theme-name'), popover: { ...text(t, 'name'), side: 'bottom' } },
        { element: () => document.querySelector('[data-theme-type=table]') as Element, popover: { ...text(t, 'widget'), side: 'right' } },
        {
            element: element('theme-inherit'),
            popover: { ...text(t, 'inherit'), side: 'left' },
            before: async () => {
                context.openTablePanel()
                await wait(PANEL_ANIMATION_MS)
            },
            after: async () => {
                context.closePanel()
                await wait(PANEL_ANIMATION_MS)
            }
        },
        { element: element('theme-edit-all'), popover: { ...text(t, 'editAll'), side: 'bottom' } },
        { element: element('theme-dim'), popover: { ...text(t, 'dim'), side: 'right' } },
        { element: element('theme-save'), popover: { ...text(t, 'save'), side: 'bottom' } }
    ]

    if (!(await context.ensureTheme())) return

    await runTour({ t, steps, onDestroyed: () => context.closePanel() })
}
