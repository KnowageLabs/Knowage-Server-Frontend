let isResolved = false
let resolveAuthReady: () => void = () => {}

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
