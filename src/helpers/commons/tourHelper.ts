import { driver, Driver, DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

export interface IKnTourStep extends DriveStep {
    // Runs before the tour shows the step, from either direction: it opens the menu, the panel or the tab that holds the element.
    // A step with before is kept even when its element is not on the page yet.
    before?: () => void | Promise<void>
    // Runs when the tour leaves the step or ends: it closes what before opened.
    after?: () => void | Promise<void>
}

interface IRunTourOptions {
    t: (key: string, values?: Record<string, unknown>) => string
    steps: IKnTourStep[]
    onDestroyed?: () => void
}

let activeTour: Driver | null = null

export function isTourRunning() {
    return activeTour !== null
}

export function byTourId(id: string, root: ParentNode = document) {
    return root.querySelector(`[data-tour-id='${id}']`)
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function isVisible(element: Element | null | undefined) {
    return !!element && element.getClientRects().length > 0
}

function resolveElement(step: DriveStep) {
    const element = step.element
    if (typeof element === 'function') return element()
    if (typeof element === 'string') return document.querySelector(element)
    return element
}

// Starts a tour with the shared look. Steps without a visible element are dropped, so a tour never points at an empty spot.
export async function runTour({ t, steps, onDestroyed }: IRunTourOptions): Promise<Driver | null> {
    if (activeTour) return null
    const visibleSteps = steps.filter((step) => step.before || isVisible(resolveElement(step)))
    if (visibleSteps.length === 0) return null

    // Kept for onDestroyed: driver clears its own state before it calls that hook.
    let currentIndex = 0
    let moving = false
    // Leaves the current step, prepares the target step, then moves; a second click while it runs is ignored.
    const move = async (direction: 1 | -1) => {
        if (moving || !activeTour) return
        moving = true
        try {
            // driver sets the index at once, while a highlight hook can still be waiting for the transition
            const index = activeTour.getActiveIndex() ?? currentIndex
            await visibleSteps[index].after?.()
            await visibleSteps[index + direction]?.before?.()
            if (direction === 1) activeTour?.moveNext()
            else activeTour?.movePrevious()
        } finally {
            moving = false
        }
    }

    const tour = driver({
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 10,
        showProgress: true,
        // vue-i18n would read driver's {{current}} placeholders as its own, so they go in as values
        progressText: t('common.tour.progress', { current: '{{current}}', total: '{{total}}' }),
        nextBtnText: t('common.next'),
        prevBtnText: t('common.previous'),
        doneBtnText: t('common.close'),
        popoverClass: 'kn-tour-popover',
        steps: visibleSteps,
        onNextClick: () => move(1),
        onPrevClick: () => move(-1),
        onHighlightStarted: (_element, _step, { state }) => (currentIndex = state.activeIndex ?? currentIndex),
        onDestroyed: () => {
            activeTour = null
            visibleSteps[currentIndex]?.after?.()
            onDestroyed?.()
        }
    })
    activeTour = tour
    await visibleSteps[0].before?.()
    tour.drive()
    return tour
}
