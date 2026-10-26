import { byTourId, IKnTourStep, runTour, wait } from '@/helpers/commons/tourHelper'

interface ISchedulerTourDetail {
    hasTriggers: () => boolean
    openFirstTrigger: () => Promise<boolean>
    showTriggerStep: (step: 'timing' | 'outputs' | 'review') => void
    closeTriggerDrawer: () => void
}

interface ISchedulerTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    // Opens the first job when none is open. Resolves when the job detail is shown.
    ensureJob: () => Promise<boolean>
    detail: () => ISchedulerTourDetail | null
}

const element = (id: string) => () => byTourId(id) as Element

// The drawer and the stepper animate; the tour waits for them before it highlights something inside.
const ANIMATION_MS = 350

const text = (t: ISchedulerTourContext['t'], key: string) => ({ title: t(`managers.scheduler.tour.${key}Title`), description: t(`managers.scheduler.tour.${key}Description`) })

export async function startSchedulerTour(context: ISchedulerTourContext) {
    const { t } = context
    if (!(await context.ensureJob())) return
    const detail = context.detail()
    if (!detail) return

    const steps: IKnTourStep[] = [
        { element: element('scheduler-list'), popover: { ...text(t, 'list'), side: 'right' } },
        { element: element('scheduler-documents'), popover: { ...text(t, 'documents'), side: 'bottom' } },
        { element: element('scheduler-triggers'), popover: { ...text(t, 'triggers'), side: 'top' } }
    ]

    // Without a trigger there is no drawer to show: the tour stops after the Triggers card.
    if (detail.hasTriggers()) {
        steps.push(
            {
                element: element('scheduler-trigger-stepper'),
                popover: { ...text(t, 'stepper'), side: 'left' },
                before: async () => {
                    await detail.openFirstTrigger()
                    detail.showTriggerStep('timing')
                    await wait(ANIMATION_MS)
                }
            },
            {
                element: element('scheduler-trigger-outputs'),
                popover: { ...text(t, 'outputs'), side: 'left' },
                before: async () => {
                    detail.showTriggerStep('outputs')
                    await wait(ANIMATION_MS)
                }
            },
            {
                element: element('scheduler-trigger-review'),
                popover: { ...text(t, 'review'), side: 'left' },
                before: async () => {
                    detail.showTriggerStep('review')
                    await wait(ANIMATION_MS)
                }
            }
        )
    }

    await runTour({ t, steps, onDestroyed: () => detail.closeTriggerDrawer() })
}
