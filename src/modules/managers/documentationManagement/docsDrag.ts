// The data type of the tree drag. The payload is kept here, because a browser hides it from dragover.
export const DOCS_NODE_DRAG_TYPE = 'application/x-kn-docs-node'

export type iDocsDragPayload = { kind: 'node'; id: string } | { kind: 'file'; path: string }

export const docsDrag: { payload: iDocsDragPayload | null } = { payload: null }

export function startDocsDrag(event: DragEvent, payload: iDocsDragPayload, image?: HTMLElement | null) {
    docsDrag.payload = payload
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    // Firefox starts no drag without data.
    event.dataTransfer.setData(DOCS_NODE_DRAG_TYPE, JSON.stringify(payload))
    if (image) event.dataTransfer.setDragImage(image, 12, 12)
}

export function endDocsDrag() {
    docsDrag.payload = null
}
