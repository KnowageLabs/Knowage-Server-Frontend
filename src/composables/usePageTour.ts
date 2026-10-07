import { onBeforeUnmount, onMounted } from 'vue'

// The guided tour button in the main menu starts the tour of the current page, if the page has one.
// Otherwise it starts the main menu tour.
let pageTour: (() => void) | null = null

export function getPageTour() {
    return pageTour
}

// Registers the page's tour while the page is mounted.
export function usePageTour(start: () => void) {
    onMounted(() => (pageTour = start))
    onBeforeUnmount(() => {
        if (pageTour === start) pageTour = null
    })
}
