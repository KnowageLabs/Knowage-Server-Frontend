import { driver, Driver, DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

interface IThemeTourContext {
    t: (key: string) => string
    // Opens a theme when none is open, so the canvas steps have something to point at. Resolves when the canvas is shown.
    ensureTheme: () => Promise<boolean>
    openTablePanel: () => void
    closePanel: () => void
}

const byTourId = (id: string) => document.querySelector(`[data-tour-id='${id}']`) as Element

// The style panel slides in; the tour waits for it before it highlights something inside it.
const PANEL_ANIMATION_MS = 350
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const text = (t: IThemeTourContext['t'], key: string) => ({ title: t(`managers.dashboardThemeManager.tour.${key}Title`), description: t(`managers.dashboardThemeManager.tour.${key}Description`) })

// Order: find or add a theme, name it, edit one widget type, see what inherit does, edit the shared style for all,
// focus settings, then save.
export async function startDashboardThemeTour(context: IThemeTourContext) {
    const { t } = context
    let tour: Driver | null = null

    // Moves to a step that needs the style panel open (or closed) first.
    const moveWithPanel = async (open: boolean, direction: 'next' | 'previous') => {
        if (open) context.openTablePanel()
        else context.closePanel()
        await wait(PANEL_ANIMATION_MS)
        if (direction === 'next') tour?.moveNext()
        else tour?.movePrevious()
    }

    const steps: DriveStep[] = [
        { element: () => byTourId('theme-list'), popover: { ...text(t, 'list'), side: 'right' } },
        { element: () => byTourId('theme-add'), popover: { ...text(t, 'add'), side: 'bottom' } },
        { element: () => byTourId('theme-name'), popover: { ...text(t, 'name'), side: 'bottom' } },
        {
            element: () => document.querySelector('[data-theme-type=table]') as Element,
            popover: { ...text(t, 'widget'), side: 'right', onNextClick: () => moveWithPanel(true, 'next') }
        },
        {
            element: () => byTourId('theme-inherit'),
            popover: { ...text(t, 'inherit'), side: 'left', onPrevClick: () => moveWithPanel(false, 'previous'), onNextClick: () => moveWithPanel(false, 'next') }
        },
        {
            element: () => byTourId('theme-edit-all'),
            popover: { ...text(t, 'editAll'), side: 'bottom', onPrevClick: () => moveWithPanel(true, 'previous') }
        },
        { element: () => byTourId('theme-dim'), popover: { ...text(t, 'dim'), side: 'right' } },
        { element: () => byTourId('theme-save'), popover: { ...text(t, 'save'), side: 'bottom' } }
    ]

    if (!(await context.ensureTheme())) return

    tour = driver({
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 10,
        showProgress: true,
        nextBtnText: t('common.next'),
        prevBtnText: t('common.previous'),
        doneBtnText: t('common.close'),
        popoverClass: 'kn-tour-popover',
        steps,
        onDestroyed: () => context.closePanel()
    })
    tour.drive()
}
