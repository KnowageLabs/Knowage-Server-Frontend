import { computed, onUnmounted, ref } from 'vue'

const MOBILE_BP = 600
const GEOMETRY_KEY = 'kn_chatbot_geometry_v2'
const MIN_WIDTH = 400
const MIN_HEIGHT = 320

interface IPanelGeometry {
    x: number
    y: number
    width: number
    height: number
}

function defaultGeometry(): IPanelGeometry {
    const width = Math.min(Math.max(MIN_WIDTH, Math.round(window.innerWidth * 0.45)), 900)
    const height = Math.min(Math.max(MIN_HEIGHT, Math.round(window.innerHeight * 0.7)), 800)
    return { x: window.innerWidth - width - 24, y: window.innerHeight - height - 24, width, height }
}

// Keeps the panel inside the viewport, e.g. after the window got smaller since the last visit.
function clampGeometry(g: IPanelGeometry): IPanelGeometry {
    const width = Math.min(Math.max(MIN_WIDTH, g.width), Math.round(window.innerWidth * 0.95))
    const height = Math.min(Math.max(MIN_HEIGHT, g.height), Math.round(window.innerHeight * 0.95))
    const x = Math.min(Math.max(0, g.x), window.innerWidth - width)
    const y = Math.min(Math.max(0, g.y), window.innerHeight - height)
    return { x, y, width, height }
}

function loadGeometry(): IPanelGeometry {
    try {
        const saved = JSON.parse(localStorage.getItem(GEOMETRY_KEY) ?? 'null')
        if (saved && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(saved[k]))) return clampGeometry(saved)
    } catch {
        // Storage can be unavailable (private mode, blocked site data). The default geometry is fine.
    }
    return defaultGeometry()
}

function saveGeometry(g: IPanelGeometry) {
    try {
        localStorage.setItem(GEOMETRY_KEY, JSON.stringify(g))
    } catch {
        // See loadGeometry.
    }
}

export function useChatbotPanel() {
    const showAlert = ref(false)
    const minimizedToCard = ref(false)
    const geometry = ref<IPanelGeometry>(loadGeometry())
    const isMobile = ref(window.innerWidth <= MOBILE_BP)

    function onWindowResize() {
        isMobile.value = window.innerWidth <= MOBILE_BP
        geometry.value = clampGeometry(geometry.value)
    }
    window.addEventListener('resize', onWindowResize)

    const panelStyle = computed((): Record<string, string> => {
        if (isMobile.value) return { left: '0', top: '0', width: '100%', height: '100%', borderRadius: '0' }
        const g = geometry.value
        return { left: g.x + 'px', top: g.y + 'px', width: g.width + 'px', height: g.height + 'px' }
    })

    // ── Drag and resize ───────────────────────────────────────

    let startX = 0
    let startY = 0
    let start: IPanelGeometry = geometry.value

    function beginPointerAction(e: MouseEvent, onMove: (e: MouseEvent) => void) {
        startX = e.clientX
        startY = e.clientY
        start = { ...geometry.value }
        document.body.style.userSelect = 'none'
        const onUp = () => {
            document.body.style.userSelect = ''
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            saveGeometry(geometry.value)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    function startDrag(e: MouseEvent) {
        if (isMobile.value) return
        beginPointerAction(e, (ev) => {
            geometry.value = clampGeometry({ ...start, x: start.x + ev.clientX - startX, y: start.y + ev.clientY - startY })
        })
    }

    function startResize(e: MouseEvent) {
        e.stopPropagation()
        beginPointerAction(e, (ev) => {
            geometry.value = clampGeometry({ ...start, width: start.width + ev.clientX - startX, height: start.height + ev.clientY - startY })
        })
    }

    // ── Open / close ──────────────────────────────────────────

    function minimizeToCard() {
        minimizedToCard.value = true
    }

    function restoreFromCard() {
        minimizedToCard.value = false
        showAlert.value = true
    }

    function closePanel() {
        showAlert.value = false
        minimizedToCard.value = false
    }

    function toggleChatbot() {
        if (minimizedToCard.value) restoreFromCard()
        else showAlert.value = !showAlert.value
    }

    onUnmounted(() => window.removeEventListener('resize', onWindowResize))

    return { showAlert, minimizedToCard, isMobile, geometry, panelStyle, startDrag, startResize, closePanel, toggleChatbot, minimizeToCard, restoreFromCard }
}
