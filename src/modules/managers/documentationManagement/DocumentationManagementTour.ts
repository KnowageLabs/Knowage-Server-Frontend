import { byTourId, IKnTourStep, runTour } from '@/helpers/commons/tourHelper'

interface IDocsTourContext {
    t: (key: string, values?: Record<string, unknown>) => string
    // Opens a page when none is open, so the content steps have something to point at. Resolves when the editor is shown.
    ensurePage: () => Promise<boolean>
}

const element = (id: string) => () => byTourId(id) as Element

const text = (t: IDocsTourContext['t'], key: string) => ({ title: t(`managers.documentationManagement.tour.${key}Title`), description: t(`managers.documentationManagement.tour.${key}Description`) })

// Order: the tree and drag and drop, the row menu, files outside the menu, the editor, focus mode, the reader preview, then save.
export async function startDocumentationManagementTour(context: IDocsTourContext) {
    const { t } = context

    const steps: IKnTourStep[] = [
        { element: element('docs-tree'), popover: { ...text(t, 'tree'), side: 'right' } },
        { element: element('docs-row-menu'), popover: { ...text(t, 'menu'), side: 'right' } },
        { element: element('docs-orphans'), popover: { ...text(t, 'orphans'), side: 'right' } },
        { element: element('docs-content'), popover: { ...text(t, 'content'), side: 'top' } },
        { element: element('docs-focus'), popover: { ...text(t, 'focus'), side: 'left' } },
        { element: element('docs-preview-button'), popover: { ...text(t, 'preview'), side: 'bottom' } },
        { element: element('docs-save-button'), popover: { ...text(t, 'save'), side: 'bottom' } }
    ]

    if (!(await context.ensurePage())) return

    await runTour({ t, steps })
}
