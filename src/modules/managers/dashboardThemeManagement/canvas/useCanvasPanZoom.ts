import { onBeforeUnmount, onMounted, Ref, ref } from 'vue'
import Panzoom, { PanzoomObject } from '@panzoom/panzoom'

export interface ICanvasRect {
    left: number
    top: number
    width: number
    height: number
}

interface ICanvasPanZoomOptions {
    minScale: number
    maxScale: number
    // The part of the viewport that no floating panel covers, in viewport coordinates.
    getFreeArea: () => ICanvasRect
    onClick?: (event: PointerEvent) => void
}

const CLICK_TOLERANCE = 4
const FIT_PADDING = 32
const BUTTON_ZOOM_STEP = 1.1
const WHEEL_ZOOM_SPEED = 0.0012
// Elements with this class (the widgets) do not start a drag pan, so the user can interact with them.
const EXCLUDE_CLASS = 'panzoom-exclude'

// Pan and zoom for a canvas editor. @panzoom/panzoom handles drag and pinch. Wheel, fit and centering are ours:
// the wheel zooms toward the cursor, except over widget content that can scroll. Space + drag pans over widgets too.
// The transform is `scale(s) translate(x, y)` with origin 0 0, so a canvas point p sits at s * (p + pan) in the viewport.
export function useCanvasPanZoom(viewportRef: Ref<HTMLElement | null>, stageRef: Ref<HTMLElement | null>, options: ICanvasPanZoomOptions) {
    const x = ref(0)
    const y = ref(0)
    const scale = ref(1)
    const isPanning = ref(false)
    const isSpacePressed = ref(false)
    let panzoom: PanzoomObject | null = null
    let pointerStart: { x: number; y: number } | null = null
    // Space pans only while the pointer is over the canvas, so it still presses focused buttons elsewhere.
    let isPointerOverViewport = false
    const onPointerEnter = () => (isPointerOverViewport = true)
    const onPointerLeave = () => (isPointerOverViewport = false)
    let resolveReady: () => void = () => {}
    // Panzoom applies its start pan in a timeout after it starts. Moves made before that are lost.
    const ready = new Promise<void>((resolve) => (resolveReady = resolve))

    onMounted(() => {
        if (!stageRef.value || !viewportRef.value) return
        panzoom = Panzoom(stageRef.value, { canvas: true, origin: '0 0', minScale: options.minScale, maxScale: options.maxScale, cursor: 'inherit', step: 0.2, excludeClass: EXCLUDE_CLASS })
        setTimeout(resolveReady)
        stageRef.value.addEventListener('panzoomchange', onPanzoomChange as EventListener)
        viewportRef.value.addEventListener('wheel', onWheel, { passive: false })
        viewportRef.value.addEventListener('pointerdown', onPointerDown, true)
        viewportRef.value.addEventListener('pointerenter', onPointerEnter)
        viewportRef.value.addEventListener('pointerleave', onPointerLeave)
        window.addEventListener('pointerup', onPointerUp, true)
        window.addEventListener('pointermove', onPointerMove, true)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
    })

    onBeforeUnmount(() => {
        stageRef.value?.removeEventListener('panzoomchange', onPanzoomChange as EventListener)
        viewportRef.value?.removeEventListener('wheel', onWheel)
        viewportRef.value?.removeEventListener('pointerdown', onPointerDown, true)
        viewportRef.value?.removeEventListener('pointerenter', onPointerEnter)
        viewportRef.value?.removeEventListener('pointerleave', onPointerLeave)
        window.removeEventListener('pointerup', onPointerUp, true)
        window.removeEventListener('pointermove', onPointerMove, true)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        panzoom?.destroy()
        panzoom = null
    })

    function onPanzoomChange(event: CustomEvent) {
        x.value = event.detail.x
        y.value = event.detail.y
        scale.value = event.detail.scale
    }

    function onPointerDown(event: PointerEvent) {
        if (event.button !== 0) return
        pointerStart = { x: event.clientX, y: event.clientY }
    }

    function onPointerMove(event: PointerEvent) {
        if (!pointerStart || isPanning.value) return
        if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > CLICK_TOLERANCE) isPanning.value = true
    }

    function onPointerUp(event: PointerEvent) {
        if (!pointerStart) return
        const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y)
        pointerStart = null
        isPanning.value = false
        if (moved <= CLICK_TOLERANCE) options.onClick?.(event)
    }

    function onWheel(event: WheelEvent) {
        if (canScrollInside(event)) return
        event.preventDefault()
        // deltaMode 1 counts lines, not pixels.
        const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY
        zoomAtPoint(scale.value * Math.exp(-delta * WHEEL_ZOOM_SPEED), { clientX: event.clientX, clientY: event.clientY })
    }

    // True when the wheel is over widget content that can still scroll in that direction (a selector list, a grid).
    function canScrollInside(event: WheelEvent) {
        const vertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        for (let element = event.target as HTMLElement | null; element && element !== viewportRef.value; element = element.parentElement) {
            const style = getComputedStyle(element)
            if (vertical && /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1) {
                if ((event.deltaY < 0 && element.scrollTop > 0) || (event.deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1)) return true
            }
            if (!vertical && /(auto|scroll)/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1) {
                if ((event.deltaX < 0 && element.scrollLeft > 0) || (event.deltaX > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth - 1)) return true
            }
        }
        return false
    }

    function isTyping(event: KeyboardEvent) {
        const target = event.target as HTMLElement | null
        return !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.code !== 'Space' || event.repeat || isTyping(event) || !isPointerOverViewport) return
        event.preventDefault()
        isSpacePressed.value = true
        panzoom?.setOptions({ excludeClass: 'kn-canvas-exclude-nothing' })
    }

    function onKeyUp(event: KeyboardEvent) {
        if (event.code !== 'Space' || !isSpacePressed.value) return
        isSpacePressed.value = false
        panzoom?.setOptions({ excludeClass: EXCLUDE_CLASS })
    }

    function clampScale(value: number) {
        return Math.min(options.maxScale, Math.max(options.minScale, value))
    }

    function setTransform(newX: number, newY: number, newScale: number) {
        if (!panzoom) return
        const clampedScale = clampScale(newScale)
        if (clampedScale !== panzoom.getScale()) panzoom.zoom(clampedScale, { animate: false, force: true })
        panzoom.pan(newX, newY, { animate: false, force: true })
    }

    // Keeps the canvas point under the given viewport point fixed while the scale changes.
    function zoomAtPoint(newScale: number, point: { clientX: number; clientY: number }) {
        const viewport = viewportRef.value?.getBoundingClientRect()
        if (!viewport) return
        const clampedScale = clampScale(newScale)
        const pointX = point.clientX - viewport.left
        const pointY = point.clientY - viewport.top
        const canvasX = pointX / scale.value - x.value
        const canvasY = pointY / scale.value - y.value
        setTransform(pointX / clampedScale - canvasX, pointY / clampedScale - canvasY, clampedScale)
    }

    function freeAreaCenter() {
        const area = options.getFreeArea()
        return { clientX: area.left + area.width / 2, clientY: area.top + area.height / 2 }
    }

    function zoomTo(newScale: number) {
        const viewport = viewportRef.value?.getBoundingClientRect()
        if (!viewport) return
        const center = freeAreaCenter()
        zoomAtPoint(newScale, { clientX: center.clientX + viewport.left, clientY: center.clientY + viewport.top })
    }

    function zoomIn() {
        zoomTo(scale.value * BUTTON_ZOOM_STEP)
    }

    function zoomOut() {
        zoomTo(scale.value / BUTTON_ZOOM_STEP)
    }

    // Shows the whole content in the free area, never above 100%.
    function fitToFreeArea(content: { width: number; height: number }) {
        const area = options.getFreeArea()
        const fitScale = clampScale(Math.min((area.width - 2 * FIT_PADDING) / content.width, (area.height - 2 * FIT_PADDING) / content.height, 1))
        const offsetX = area.left + (area.width - content.width * fitScale) / 2
        const offsetY = area.top + (area.height - content.height * fitScale) / 2
        setTransform(offsetX / fitScale, offsetY / fitScale, fitScale)
    }

    // Fits the content width in the free area, never above 100%, top aligned.
    function fitWidth(content: { width: number; height: number }) {
        const area = options.getFreeArea()
        const fitScale = clampScale(Math.min((area.width - 2 * FIT_PADDING) / content.width, 1))
        const offsetX = area.left + (area.width - content.width * fitScale) / 2
        setTransform(offsetX / fitScale, (area.top + FIT_PADDING) / fitScale, fitScale)
    }

    // Converts a canvas rectangle to viewport coordinates.
    function toViewportRect(rect: ICanvasRect): ICanvasRect {
        const s = scale.value
        return { left: s * (rect.left + x.value), top: s * (rect.top + y.value), width: rect.width * s, height: rect.height * s }
    }

    return { ready, x, y, scale, isPanning, isSpacePressed, EXCLUDE_CLASS, zoomIn, zoomOut, zoomTo, fitToFreeArea, fitWidth, toViewportRect }
}
