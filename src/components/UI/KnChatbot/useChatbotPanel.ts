import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const MOBILE_BP = 600

export function useChatbotPanel() {
    const { locale } = useI18n()
    const showAlert = ref(false)
    const minimized = ref(false)

    const posX = ref(Math.round(window.innerWidth * 0.2))
    const posY = ref(Math.round(window.innerHeight * 0.2))
    const panelWidth = ref(Math.round(window.innerWidth * 0.6))
    const panelHeight = ref(Math.round(window.innerHeight * 0.6))

    const isMobile = ref(window.innerWidth <= MOBILE_BP)

    const todayDate = computed(() =>
        new Date().toLocaleDateString(locale.value, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    )

    // ── Responsive ────────────────────────────────────────────

    function onWindowResize() {
        isMobile.value = window.innerWidth <= MOBILE_BP
        if (isMobile.value) minimized.value = false
    }
    window.addEventListener('resize', onWindowResize)

    // ── Panel style ───────────────────────────────────────────

    const panelStyle = computed((): Record<string, string> => {
        if (isMobile.value) {
            return { left: '0', top: '0', right: '0', bottom: '0', width: '100%', height: '100%', borderRadius: '0' }
        }
        if (minimized.value) {
            return { left: posX.value + 'px', bottom: '0px', top: 'auto', height: 'auto', minHeight: 'unset', width: panelWidth.value + 'px' }
        }
        return { left: posX.value + 'px', top: posY.value + 'px', width: panelWidth.value + 'px', height: panelHeight.value + 'px' }
    })

    // ── Drag ──────────────────────────────────────────────────

    let dragOffsetX = 0
    let dragOffsetY = 0

    function disableSelect() {
        document.body.style.userSelect = 'none'
    }
    function enableSelect() {
        document.body.style.userSelect = ''
    }

    function startDrag(e: MouseEvent) {
        if (isMobile.value) return
        dragOffsetX = e.clientX - posX.value
        dragOffsetY = e.clientY - posY.value
        disableSelect()
        document.addEventListener('mousemove', onDragMove)
        document.addEventListener('mouseup', onDragEnd)
    }

    function onDragMove(e: MouseEvent) {
        posX.value = e.clientX - dragOffsetX
        posY.value = e.clientY - dragOffsetY
    }

    function onDragEnd() {
        enableSelect()
        document.removeEventListener('mousemove', onDragMove)
        document.removeEventListener('mouseup', onDragEnd)
    }

    // ── Resize ────────────────────────────────────────────────

    let resizeStartX = 0
    let resizeStartY = 0
    let resizeStartW = 0
    let resizeStartH = 0

    function startResize(e: MouseEvent) {
        e.stopPropagation()
        resizeStartX = e.clientX
        resizeStartY = e.clientY
        resizeStartW = panelWidth.value
        resizeStartH = panelHeight.value
        disableSelect()
        document.addEventListener('mousemove', onResizeMove)
        document.addEventListener('mouseup', onResizeEnd)
    }

    function onResizeMove(e: MouseEvent) {
        panelWidth.value = Math.max(400, resizeStartW + (e.clientX - resizeStartX))
        panelHeight.value = Math.max(300, resizeStartH + (e.clientY - resizeStartY))
    }

    function onResizeEnd() {
        enableSelect()
        document.removeEventListener('mousemove', onResizeMove)
        document.removeEventListener('mouseup', onResizeEnd)
    }

    // ── Geometry / open-close ─────────────────────────────────

    function resetPanelGeometry() {
        posX.value = Math.round(window.innerWidth * 0.2)
        posY.value = Math.round(window.innerHeight * 0.2)
        panelWidth.value = Math.round(window.innerWidth * 0.6)
        panelHeight.value = Math.round(window.innerHeight * 0.6)
    }

    function closePanel() {
        showAlert.value = false
        resetPanelGeometry()
    }

    function toggleChatbot() {
        if (showAlert.value) {
            showAlert.value = false
            resetPanelGeometry()
        } else {
            showAlert.value = true
            minimized.value = false
        }
    }

    // ── Cleanup ───────────────────────────────────────────────

    onUnmounted(() => {
        document.removeEventListener('mousemove', onDragMove)
        document.removeEventListener('mouseup', onDragEnd)
        document.removeEventListener('mousemove', onResizeMove)
        document.removeEventListener('mouseup', onResizeEnd)
        window.removeEventListener('resize', onWindowResize)
    })

    return {
        showAlert,
        minimized,
        isMobile,
        todayDate,
        panelStyle,
        startDrag,
        startResize,
        closePanel,
        toggleChatbot
    }
}
