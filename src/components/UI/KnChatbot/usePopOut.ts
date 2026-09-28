import { onUnmounted, ref, shallowRef } from 'vue'

// Document Picture-in-Picture: an always-on-top window that the user can move to another screen.
// Chromium only. The chat is teleported into it, so the component instance and its state stay the same.
export function usePopOut() {
    const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window
    const pipWindow = shallowRef<Window | null>(null)
    const pipBody = shallowRef<HTMLElement | null>(null)
    const poppedOut = ref(false)
    let headObserver: MutationObserver | null = null

    function copyStyleNode(node: Node, target: Document) {
        if (node instanceof HTMLStyleElement || (node instanceof HTMLLinkElement && node.rel === 'stylesheet')) {
            target.head.appendChild(node.cloneNode(true))
        }
    }

    function copyDocumentStyles(target: Document) {
        document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => copyStyleNode(node, target))
        // Theme variables are set inline on <html>, and Quasar puts its platform classes on <body>.
        target.documentElement.setAttribute('style', document.documentElement.getAttribute('style') ?? '')
        target.documentElement.className = document.documentElement.className
        target.body.className = document.body.className

        // Styles added later (lazy chunks, HMR in dev) are mirrored while the window is open.
        headObserver = new MutationObserver((mutations) => mutations.forEach((m) => m.addedNodes.forEach((node) => copyStyleNode(node, target))))
        headObserver.observe(document.head, { childList: true })
    }

    function onPipClosed() {
        headObserver?.disconnect()
        headObserver = null
        pipWindow.value = null
        pipBody.value = null
        poppedOut.value = false
    }

    async function open(width: number, height: number): Promise<boolean> {
        if (!supported || poppedOut.value) return false
        try {
            const pip: Window = await (window as any).documentPictureInPicture.requestWindow({ width: Math.round(width), height: Math.round(height) })
            copyDocumentStyles(pip.document)
            pip.document.title = document.title
            pip.addEventListener('pagehide', onPipClosed, { once: true })
            pipWindow.value = pip
            pipBody.value = pip.document.body
            poppedOut.value = true
            return true
        } catch {
            return false
        }
    }

    function close() {
        // Closing the window fires pagehide, which resets the state.
        pipWindow.value?.close()
    }

    onUnmounted(close)

    return { supported, poppedOut, pipWindow, pipBody, open, close }
}
