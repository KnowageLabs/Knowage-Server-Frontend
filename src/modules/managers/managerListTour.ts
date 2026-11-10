import { byTourId, IKnTourStep, runTour } from '@/helpers/commons/tourHelper'

// The tour of the Configuration and Domains pages (spec config-domains-redesign 12): the group button, Filters,
// a row, New, the "All tenants" tag. Started from the ? button only. runTour drops a step without its element
// (no New for a read-only user, no row when the list is empty).
const element = (id: string) => () => byTourId(id) as Element
// the first real row: not a domain band, not the spacer row of the virtual scroll
const firstRow = () => byTourId('mgr-list')?.querySelector('tbody tr.cursor-pointer') as Element

export function startManagerTour(t: (key: string) => string, prefix: string) {
    const text = (key: string) => ({ title: t(`${prefix}.tour.${key}Title`), description: t(`${prefix}.tour.${key}Text`) })
    const steps: IKnTourStep[] = [
        { element: element('mgr-group'), popover: { ...text('group'), side: 'bottom' } },
        { element: element('mgr-filters'), popover: { ...text('filters'), side: 'bottom' } },
        { element: firstRow, popover: { ...text('row'), side: 'bottom' } },
        { element: element('mgr-new'), popover: { ...text('new'), side: 'left' } },
        { element: element('mgr-tenant'), popover: { ...text('tenant'), side: 'bottom' } }
    ]
    return runTour({ t, steps })
}
