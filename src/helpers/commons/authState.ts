/**
 * authState — shared promise that resolves as soon as App.vue has received
 * the first /currentuser response and stored the token in sessionStorage.
 *
 * The router guard uses this to pause the initial navigation in a new tab
 * instead of immediately redirecting to the login page.
 */

let _resolve: () => void

export const authReady: Promise<void> = new Promise<void>((resolve) => {
    _resolve = resolve
})

export function markAuthReady(): void {
    _resolve()
}
