import { ref, computed } from 'vue'

export interface CellPos {
    row: number
    col: number
}

export interface SelectionRange {
    rowMin: number
    rowMax: number
    colMin: number
    colMax: number
}

/**
 * Manages Excel-style range selection:
 * - single cell selection
 * - range selection (drag or Shift+click / Shift+Arrow)
 * - entire row selection (click on row index)
 * - entire column selection (click on column header)
 */
export function useGridSelection(getRowCount: () => number, getColCount: () => number) {
    const anchor = ref<CellPos | null>(null) // selection start point
    const focus = ref<CellPos | null>(null) // current end point (opposite corner)
    const isSelectingRows = ref(false) // true = entire row selected
    const isSelectingCols = ref(false) // true = entire column selected

    // Normalized range (always top-left → bottom-right)
    const selectionRange = computed<SelectionRange | null>(() => {
        if (!anchor.value || !focus.value) return null
        return {
            rowMin: Math.min(anchor.value.row, focus.value.row),
            rowMax: Math.max(anchor.value.row, focus.value.row),
            colMin: Math.min(anchor.value.col, focus.value.col),
            colMax: Math.max(anchor.value.col, focus.value.col)
        }
    })

    // ── Queries ─────────────────────────────────────────────────────────────

    function isCellSelected(r: number, c: number): boolean {
        const range = selectionRange.value
        if (!range) return false
        return r >= range.rowMin && r <= range.rowMax && c >= range.colMin && c <= range.colMax
    }

    function isAnchor(r: number, c: number): boolean {
        return anchor.value?.row === r && anchor.value?.col === c
    }

    function isRowHeaderSelected(r: number): boolean {
        if (!isSelectingRows.value || !selectionRange.value) return false
        return r >= selectionRange.value.rowMin && r <= selectionRange.value.rowMax
    }

    function isColHeaderSelected(c: number): boolean {
        if (!isSelectingCols.value || !selectionRange.value) return false
        return c >= selectionRange.value.colMin && c <= selectionRange.value.colMax
    }

    // ── Actions ───────────────────────────────────────────────────────────

    /** Starts a new selection from a single cell */
    function startSelection(r: number, c: number) {
        anchor.value = { row: r, col: c }
        focus.value = { row: r, col: c }
        isSelectingRows.value = false
        isSelectingCols.value = false
    }

    /** Extends the selection toward a cell while keeping the anchor */
    function extendSelection(r: number, c: number) {
        if (!anchor.value) {
            startSelection(r, c)
            return
        }
        focus.value = { row: r, col: c }
    }

    /** Click on row index: selects the entire row */
    function selectEntireRow(r: number, extend = false) {
        isSelectingRows.value = true
        isSelectingCols.value = false
        const colMin = 0
        const colMax = getColCount() - 1
        if (extend && anchor.value) {
            focus.value = { row: r, col: colMax }
            anchor.value = { ...anchor.value, col: colMin }
        } else {
            anchor.value = { row: r, col: colMin }
            focus.value = { row: r, col: colMax }
        }
    }

    /** Click on column header: selects the entire column */
    function selectEntireCol(c: number, extend = false) {
        isSelectingCols.value = true
        isSelectingRows.value = false
        const rowMin = 0
        const rowMax = getRowCount() - 1
        if (extend && anchor.value) {
            focus.value = { col: c, row: rowMax }
            anchor.value = { ...anchor.value, row: rowMin }
        } else {
            anchor.value = { row: rowMin, col: c }
            focus.value = { row: rowMax, col: c }
        }
    }

    /** Ctrl+A: selects all cells */
    function selectAll() {
        anchor.value = { row: 0, col: 0 }
        focus.value = { row: getRowCount() - 1, col: getColCount() - 1 }
        isSelectingRows.value = false
        isSelectingCols.value = false
    }

    /**
     * Moves the focused cell (Arrow keys).
     * If shift=true extends the selection, otherwise restarts from the anchor.
     */
    function moveSelection(dir: 'up' | 'down' | 'left' | 'right', shift = false) {
        const current = shift ? focus.value : anchor.value
        if (!current) return

        const maxRow = getRowCount() - 1
        const maxCol = getColCount() - 1

        let { row, col } = current
        if (dir === 'up') row = Math.max(0, row - 1)
        else if (dir === 'down') row = Math.min(maxRow, row + 1)
        else if (dir === 'left') col = Math.max(0, col - 1)
        else if (dir === 'right') col = Math.min(maxCol, col + 1)

        if (shift) {
            extendSelection(row, col)
        } else {
            startSelection(row, col)
        }
    }

    /** Moves the anchor cell without extending the selection (post-edit navigation) */
    function moveFocusTo(r: number, c: number) {
        const maxRow = getRowCount() - 1
        const maxCol = getColCount() - 1
        startSelection(Math.min(Math.max(r, 0), maxRow), Math.min(Math.max(c, 0), maxCol))
    }

    function clearSelection() {
        anchor.value = null
        focus.value = null
        isSelectingRows.value = false
        isSelectingCols.value = false
    }

    return {
        anchor,
        focus,
        selectionRange,
        isSelectingRows,
        isSelectingCols,
        isCellSelected,
        isAnchor,
        isRowHeaderSelected,
        isColHeaderSelected,
        startSelection,
        extendSelection,
        selectEntireRow,
        selectEntireCol,
        selectAll,
        moveSelection,
        moveFocusTo,
        clearSelection
    }
}
