let webSocket = null
let pendingMessages = []

function createWebSocket() {
    const url = new URL(window.location.origin)
    url.protocol = url.protocol.replace('http', 'ws')

    const socket = new WebSocket(url + import.meta.env.VITE_WEBSOCKET_URL)
    socket.addEventListener('open', () => {
        pendingMessages.forEach((message) => socket.send(message))
        pendingMessages = []
    })
    return socket
}

export function getWebSocket() {
    if (!webSocket || webSocket.readyState === WebSocket.CLOSED) webSocket = createWebSocket()
    return webSocket
}

export function sendWebSocketMessage(message) {
    const socket = getWebSocket()
    if (socket.readyState === WebSocket.OPEN) socket.send(message)
    else pendingMessages.push(message)
}

export function closeWebSocket() {
    pendingMessages = []
    if (webSocket) webSocket.close()
    webSocket = null
}
