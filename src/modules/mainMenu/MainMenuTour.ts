import { byTourId, IKnTourStep, runTour, wait } from '@/helpers/commons/tourHelper'

interface IMainMenuTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    openAccount: () => void
    closeAccount: () => void
}

// The account menu fades in; the tour waits for it before it highlights it.
const MENU_ANIMATION_MS = 250

const element = (id: string) => () => byTourId(id) as Element
const text = (t: IMainMenuTourContext['t'], key: string) => ({ title: t(`menu.tour.${key}Title`), description: t(`menu.tour.${key}Description`) })

// The fallback tour of the guided tour button: what the main menu holds, then where the account settings are.
export function startMainMenuTour(context: IMainMenuTourContext) {
    const { t } = context

    const steps: IKnTourStep[] = [
        { element: element('menu-modules'), popover: { ...text(t, 'modules'), side: 'right' } },
        { element: element('menu-items'), popover: { ...text(t, 'pages'), side: 'right' } },
        { element: element('menu-action-aiAssistant'), popover: { ...text(t, 'ai'), side: 'right' } },
        { element: element('menu-action-guidedTour'), popover: { ...text(t, 'guidedTour'), side: 'right' } },
        { element: element('menu-profile'), popover: { ...text(t, 'account'), side: 'right' } },
        {
            element: element('menu-account-popup'),
            popover: { ...text(t, 'accountMenu'), side: 'right' },
            before: async () => {
                context.openAccount()
                await wait(MENU_ANIMATION_MS)
            },
            after: () => context.closeAccount()
        }
    ]

    runTour({ t, steps })
}
