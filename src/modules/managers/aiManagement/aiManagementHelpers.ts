export interface ISchemaDragItem {
    type: 'table' | 'column'
    table: string
    value: string
}

export const SCHEMA_DRAG_MIME = 'application/x-knowage-gold-query-item'

// The datasource structure endpoint returns tables in different shapes: a list of columns, or an object with a columns-like key, or an object keyed by column name.
export function getColumns(tableDef: any): string[] {
    const columnName = (c: any) => (typeof c === 'string' ? c : c.name || c.columnName || String(c))
    if (!tableDef) return []
    if (Array.isArray(tableDef)) return tableDef.map(columnName)
    if (typeof tableDef === 'object') {
        const key = Object.keys(tableDef).find((k) => ['columns', 'fields', 'attributes', 'cols'].includes(k.toLowerCase()))
        if (key && Array.isArray(tableDef[key])) return tableDef[key].map(columnName)
        return Object.keys(tableDef)
    }
    return []
}

export function readSchemaDragItem(event: DragEvent): ISchemaDragItem | null {
    const raw = event.dataTransfer?.getData(SCHEMA_DRAG_MIME)
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (!parsed?.table || !parsed?.value || (parsed.type !== 'table' && parsed.type !== 'column')) return null
        return parsed
    } catch {
        return null
    }
}
