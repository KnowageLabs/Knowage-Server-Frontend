import type { useGridSelection } from './useGridSelection'
import type { useGridEditing } from './useGridEditing'
import type { useGridClipboard } from './useGridClipboard'

type SelectionApi = ReturnType<typeof useGridSelection>
type EditingApi = ReturnType<typeof useGridEditing>
type ClipboardApi = ReturnType<typeof useGridClipboard>

/**
 * Handles all keydown events on the grid container.
 *
 * Responsibilities:
 * - Arrow key navigation (with/without Shift)
 * - Opening edit mode (F2, printable character, Delete/Backspace)
 * - Confirm/cancel edit (Enter, Tab, Escape)
 * - Ctrl+A, Ctrl+C, Ctrl+V
 */
export function useGridKeyboard(selection: SelectionApi, editing: EditingApi, clipboard: ClipboardApi, getRows: () => any[], getColumns: () => any[], getCellValue: (row: any, col: any) => any, isCellEditable: (col: any) => boolean, onEditConfirm: (row: number, col: number, value: any) => void, onDeleteCell: (row: number, col: number) => void) {
    function onKeyDown(event: KeyboardEvent) {
        const { key, shiftKey, ctrlKey, metaKey } = event
        const ctrl = ctrlKey || metaKey

        // ── Inside an editing cell: let the child component handle it,
        //    except for Escape which we always want to intercept.
        if (editing.isAnyEditing()) {
            if (key === 'Escape') {
                event.preventDefault()
                const pos = editing.cancelEdit()
                if (pos) selection.startSelection(pos.row, pos.col)
            }
            // Enter and Tab are handled inside RegistryGridCell via emit,
            // we don't block them here (the component calls onEditConfirm)
            return
        }

        // ── No cell selected: ignore ───────────────────────────────────────
        if (!selection.anchor.value) return

        const anchor = selection.anchor.value

        // ── Ctrl+A ────────────────────────────────────────────────────────
        if (ctrl && key === 'a') {
            event.preventDefault()
            selection.selectAll()
            return
        }

        // ── Ctrl+C ────────────────────────────────────────────────────────
        if (ctrl && key === 'c') {
            event.preventDefault()
            clipboard.copySelection(getRows(), getColumns(), selection.selectionRange.value)
            return
        }

        // ── Ctrl+V ────────────────────────────────────────────────────────
        if (ctrl && key === 'v') {
            event.preventDefault()
            clipboard.pasteSelection(anchor.row, anchor.col, getRows(), getColumns(), isCellEditable, onEditConfirm)
            return
        }

        // ── Arrow keys ────────────────────────────────────────────────────
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            event.preventDefault()
            const dir = key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right'
            selection.moveSelection(dir, shiftKey)
            return
        }

        // ── F2 → enter edit keeping current value ────────────────────────
        if (key === 'F2') {
            event.preventDefault()
            const col = getColumns()[anchor.col]
            if (col && isCellEditable(col)) {
                const row = getRows()[anchor.row]
                editing.startEdit(anchor.row, anchor.col, getCellValue(row, col))
            }
            return
        }

        // ── Delete / Backspace → clear cell ───────────────────────────────
        if (key === 'Delete' || key === 'Backspace') {
            event.preventDefault()
            const col = getColumns()[anchor.col]
            if (col && isCellEditable(col)) {
                onDeleteCell(anchor.row, anchor.col)
            }
            return
        }

        // ── Enter → move selection down ───────────────────────────────────
        if (key === 'Enter' && !shiftKey) {
            event.preventDefault()
            selection.moveSelection('down', false)
            return
        }

        // ── Tab → move selection right ────────────────────────────────────
        if (key === 'Tab') {
            event.preventDefault()
            selection.moveSelection(shiftKey ? 'left' : 'right', false)
            return
        }

        // ── Printable character → open edit with that character ───────────
        if (isPrintableKey(key, ctrl)) {
            const col = getColumns()[anchor.col]
            if (col && isCellEditable(col)) {
                const row = getRows()[anchor.row]
                editing.startEdit(anchor.row, anchor.col, getCellValue(row, col), key)
            }
        }
    }

    /** Returns true if the key produces visible output */
    function isPrintableKey(key: string, ctrl: boolean): boolean {
        if (ctrl) return false
        return key.length === 1 // single character: letters, numbers, symbols
    }

    return { onKeyDown }
}
