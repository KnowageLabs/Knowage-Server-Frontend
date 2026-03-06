import { luxonFormatDate, formatDateWithLocale, getLocale } from '@/helpers/commons/localeHelper'
import { formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import type { SelectionRange } from './useGridSelection'

/**
 * Manages Excel-style copy and paste (TSV format).
 * Compatible with Excel, Google Sheets, and LibreOffice Calc.
 */
export function useGridClipboard() {
    // ── Copy ──────────────────────────────────────────────────────────────

    /**
     * Serializes the selected range as TSV and writes it to the clipboard.
     */
    async function copySelection(rows: any[], columns: any[], range: SelectionRange | null): Promise<void> {
        if (!range || rows.length === 0 || columns.length === 0) return

        const lines: string[] = []
        for (let r = range.rowMin; r <= range.rowMax; r++) {
            if (!rows[r]) continue
            const cells: string[] = []
            for (let c = range.colMin; c <= range.colMax; c++) {
                const col = columns[c]
                if (!col) continue
                cells.push(formatCellValueForClipboard(rows[r][col.field], col))
            }
            lines.push(cells.join('\t'))
        }

        try {
            await navigator.clipboard.writeText(lines.join('\n'))
        } catch {
            // fallback silenzioso (contesti non-HTTPS o permessi negati)
        }
    }

    // ── Paste ─────────────────────────────────────────────────────────────

    /**
     * Reads text from the clipboard, parses it as TSV, and updates
     * cells starting from (anchorRow, anchorCol).
     *
     * For each cell:
     * - checks that the column is editable
     * - validates the type (number, dropdown, date)
     * - calls onEditConfirm if the value is valid
     */
    async function pasteSelection(anchorRow: number, anchorCol: number, rows: any[], columns: any[], isCellEditable: (col: any) => boolean, onEditConfirm: (row: number, col: number, value: any) => void): Promise<void> {
        let text = ''
        try {
            text = await navigator.clipboard.readText()
        } catch {
            return
        }

        if (!text) return

        const lines = text.split('\n').map((l) => l.replace(/\r$/, '').split('\t'))

        for (let dr = 0; dr < lines.length; dr++) {
            const rowIndex = anchorRow + dr
            if (rowIndex >= rows.length) break

            for (let dc = 0; dc < lines[dr].length; dc++) {
                const colIndex = anchorCol + dc
                if (colIndex >= columns.length) break

                const col = columns[colIndex]
                if (!col || !isCellEditable(col)) continue

                const rawValue = lines[dr][dc]
                const parsed = parsePasteValue(rawValue, col)
                if (parsed !== null) {
                    onEditConfirm(rowIndex, colIndex, parsed)
                }
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Formats a cell value for TSV export:
     * - numbers: with locale-aware separators
     * - date/timestamp: human-readable format
     * - others: toString
     */
    function formatCellValueForClipboard(value: any, col: any): string {
        if (value === null || value === undefined) return ''

        const type = col.columnInfo?.type

        if (type === 'date') {
            return formatDateWithLocale(value, { dateStyle: 'short' }) ?? String(value)
        }
        if (type === 'timestamp') {
            return formatDateWithLocale(value, { dateStyle: 'short', timeStyle: 'medium' }, true) ?? String(value)
        }
        if (['int', 'float', 'decimal', 'long'].includes(type)) {
            const config = formatRegistryNumber(col)
            const locale = (getLocale() ?? '').replace('_', '-')
            return Intl.NumberFormat(locale, {
                useGrouping: config?.useGrouping,
                minimumFractionDigits: config?.minFractionDigits,
                maximumFractionDigits: config?.maxFractionDigits
            }).format(value)
        }
        if (type === 'boolean') return value ? 'true' : 'false'

        return String(value)
    }

    /**
     * Attempts to convert a TSV string to the type expected by the column.
     * Returns null if the conversion is invalid (e.g. "abc" in an int column).
     */
    function parsePasteValue(raw: string, col: any): any {
        const type = col.columnInfo?.type

        if (['int', 'long'].includes(type)) {
            const n = parseInt(raw, 10)
            return isNaN(n) ? null : n
        }
        if (['float', 'decimal'].includes(type)) {
            const n = parseFloat(raw.replace(',', '.'))
            return isNaN(n) ? null : n
        }
        if (type === 'boolean') {
            if (raw.toLowerCase() === 'true' || raw === '1') return true
            if (raw.toLowerCase() === 'false' || raw === '0') return false
            return null
        }
        if (type === 'date') {
            const d = luxonFormatDate(raw, 'yyyy-MM-dd')
            return d || null
        }
        if (type === 'timestamp') {
            const d = luxonFormatDate(raw, 'yyyy-MM-dd HH:mm:ss.S')
            return d || null
        }
        // For COMBO: validation will happen in RegistryGrid (options list required)
        // return the raw value and delegate validation upstream
        return raw
    }

    return {
        copySelection,
        pasteSelection,
        formatCellValueForClipboard
    }
}
