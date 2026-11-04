import { byTourId, IKnTourStep, runTour } from '@/helpers/commons/tourHelper'
import { WsTab } from './Workspace'

// Spec 16: tabs, scope, Filters, a row, New. Steps 2 to 4 describe the open tab. runTour drops a step whose
// element is not on the page: no row when the list is empty, no Filters on the Jobs view, no New on Scheduled.
const TAB_SUFFIX: Record<WsTab, string> = { documents: 'Documents', data: 'Data', scheduled: 'Scheduled' }

const element = (id: string) => () => byTourId(id) as Element
// the first real row of the list (not a Today / Earlier band)
const firstRow = () => byTourId('ws-list')?.querySelector('tbody tr:not(.kn-ws-group-row)') as Element

export function startWorkspaceTour(t: (key: string) => string, tab: WsTab) {
    const suffix = TAB_SUFFIX[tab]
    const text = (titleKey: string, textKey: string) => ({ title: t(`workspace.tour.${titleKey}`), description: t(`workspace.tour.${textKey}`) })

    const steps: IKnTourStep[] = [
        { element: element('ws-tabs'), popover: { ...text('tabsTitle', 'tabsText'), side: 'bottom' } },
        { element: element('ws-scope'), popover: { ...text('scopeTitle', 'scope' + suffix), side: 'bottom' } },
        { element: element('ws-filters'), popover: { ...text('filtersTitle', 'filters' + suffix), side: 'bottom' } },
        { element: firstRow, popover: { ...text('rowTitle', 'row' + suffix), side: 'bottom' } }
    ]
    if (tab !== 'scheduled') steps.push({ element: element('ws-new'), popover: { ...text('newTitle', 'new' + suffix), side: 'left' } })

    return runTour({ t, steps })
}
