import { ref, onUnmounted } from 'vue'

/**
 * Manages column resizing via drag on the resize handle.
 *
 * Usage:
 *   const { columnWidths, initWidths, startColResize } = useGridColumnResize(columns)
 *   // in template: <th :style="{ width: columnWidths[ci] + 'px' }">
 *   //              <div class="knr-resize-handle" @mousedown="startColResize($event, ci)" />
 */
export function useGridColumnResize(minColWidth = 40) {
    const columnWidths = ref<number[]>([])
    let resizingIndex = -1
    let startX = 0
    let startWidth = 0

    /** Initializes column widths from the column definitions */
    function initWidths(columns: any[]) {
        columnWidths.value = columns.map((col) => col.width ?? col.size ?? 120)
    }

    /** Mousedown on the resize handle */
    function startColResize(event: MouseEvent, colIndex: number) {
        event.preventDefault()
        event.stopPropagation()

        resizingIndex = colIndex
        startX = event.clientX
        startWidth = columnWidths.value[colIndex] ?? 120

        document.body.classList.add('knr-resizing')
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    function onMouseMove(event: MouseEvent) {
        if (resizingIndex < 0) return
        const delta = event.clientX - startX
        const newWidth = Math.max(minColWidth, startWidth + delta)
        columnWidths.value[resizingIndex] = newWidth
    }

    function onMouseUp() {
        resizingIndex = -1
        document.body.classList.remove('knr-resizing')
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
    }

    onUnmounted(() => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        document.body.classList.remove('knr-resizing')
    })

    return {
        columnWidths,
        initWidths,
        startColResize
    }
}
