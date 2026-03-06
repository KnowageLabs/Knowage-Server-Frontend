import { ref } from 'vue'

export interface EditPos {
    row: number
    col: number
}

/**
 * Manages the editing state of a cell.
 * Only one cell can be in edit mode at a time.
 *
 * Lifecycle:
 *   startEdit → user edits → confirmEdit | cancelEdit
 */
export function useGridEditing() {
    const editCell = ref<EditPos | null>(null)
    const editValue = ref<any>(null)
    // Value at the time editing started (used to restore on cancel)
    const originalValue = ref<any>(null)
    // If true the initial text is replaced by the first typed character
    const replaceOnType = ref(false)

    function isEditing(r: number, c: number): boolean {
        return editCell.value?.row === r && editCell.value?.col === c
    }

    function isAnyEditing(): boolean {
        return editCell.value !== null
    }

    /**
     * Enters edit mode for cell (r, c).
     * @param r             row index
     * @param c             column index
     * @param currentValue  current cell value
     * @param initialChar   if provided (printable key), replaces the initial value
     */
    function startEdit(r: number, c: number, currentValue: any, initialChar?: string) {
        editCell.value = { row: r, col: c }
        originalValue.value = currentValue
        if (initialChar !== undefined) {
            // User pressed a printable key: start with that character
            editValue.value = initialChar
            replaceOnType.value = false
        } else {
            // F2 or double-click: keep the current value
            editValue.value = currentValue
            replaceOnType.value = false
        }
    }

    /**
     * Confirms the edit.
     * @returns object { row, col, value } with the value to save,
     *          or null if no cell was being edited.
     */
    function confirmEdit(): { row: number; col: number; value: any } | null {
        if (!editCell.value) return null
        const result = { row: editCell.value.row, col: editCell.value.col, value: editValue.value }
        editCell.value = null
        editValue.value = null
        originalValue.value = null
        return result
    }

    /**
     * Cancels the edit, restoring the original value.
     * @returns the position of the cancelled cell, to restore focus.
     */
    function cancelEdit(): EditPos | null {
        if (!editCell.value) return null
        const pos = { ...editCell.value }
        editValue.value = originalValue.value
        editCell.value = null
        originalValue.value = null
        return pos
    }

    /** Updates the value while the user is typing (called by RegistryGridCell) */
    function updateEditValue(v: any) {
        editValue.value = v
    }

    return {
        editCell,
        editValue,
        originalValue,
        replaceOnType,
        isEditing,
        isAnyEditing,
        startEdit,
        confirmEdit,
        cancelEdit,
        updateEditValue
    }
}
