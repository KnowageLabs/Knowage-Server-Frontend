let isResolved = false
let resolveAuthReady: () => void = () => {}

function getNormalizedPathname(): string {
    if (typeof window === 'undefined') return ''
    return window.location.pathname.replace(/\/+$/, '')
}

export function isLoginRouteByLocation(): boolean {
    return getNormalizedPathname().endsWith('/login')
}

export function isAuthCallbackInProgress(): boolean {
    if (!isLoginRouteByLocation() || typeof window === 'undefined') return false

    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '')

    return (
        searchParams.has('authToken') ||
        searchParams.has('code') ||
        searchParams.has('state') ||
        searchParams.has('error') ||
        hashParams.has('id_token') ||
        hashParams.has('access_token')
    )
}

export const authReady: Promise<void> = new Promise<void>((resolve) => {
    resolveAuthReady = () => {
        if (!isResolved) {
            isResolved = true
            resolve()
        }
    }
})

export function markAuthReady(): void {
    resolveAuthReady()
}
