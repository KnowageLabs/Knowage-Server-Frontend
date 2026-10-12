import { onBeforeUnmount, onMounted } from 'vue'
import { isTourRunning } from '@/helpers/commons/tourHelper'

// The guided tour button in the main menu starts the tour of the view on top: an editor opened over the dashboard
// pushes its tour over the dashboard tour, and removes it when it closes.
interface IPageTourEntry {
    start: () => void
    // A view that is mounted but hidden (a document browser tab) or has nothing to show (a dashboard in view mode) is skipped.
    isActive?: () => boolean
}

const entries: IPageTourEntry[] = []

// For Options API components: call it in mounted, and call the returned function in beforeUnmount.
export function registerPageTour(start: () => void, options?: { isActive?: () => boolean }) {
    const entry: IPageTourEntry = { start, isActive: options?.isActive }
    entries.push(entry)
    return () => {
        const index = entries.indexOf(entry)
        if (index !== -1) entries.splice(index, 1)
    }
}

export function usePageTour(start: () => void, options?: { isActive?: () => boolean }) {
    let unregister: (() => void) | null = null
    onMounted(() => (unregister = registerPageTour(start, options)))
    onBeforeUnmount(() => unregister?.())
}

// Starts the top active page tour, else the fallback (the main menu tour).
export function startGuidedTour(fallback: () => void) {
    if (isTourRunning()) return
    for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i]
        if (!entry.isActive || entry.isActive()) return entry.start()
    }
    fallback()
}
