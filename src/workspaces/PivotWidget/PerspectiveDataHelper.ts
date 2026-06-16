import type { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

const AGG_MAP: Record<string, string> = {
    SUM: 'sum',
    AVG: 'avg',
    MIN: 'min',
    MAX: 'max',
    COUNT: 'count',
    COUNT_DISTINCT: 'distinct count',
    NONE: 'count'
}

export function mapAggregation(agg: string): string {
    return AGG_MAP[agg?.toUpperCase()] ?? 'sum'
}

/**
 * Remap flat column_N rows to alias-keyed objects using metaData.fields.
 * metaData.fields[0] is 'recNo' (skip), rest are { header: alias, name: 'column_N' }.
 */
export function remapRows(dataToShow: any): Record<string, any>[] {
    if (!dataToShow?.rows?.length) return []

    const metaFields: any[] = dataToShow.metaData?.fields ?? []
    // build column_N → alias map (skip index 0 which is recNo)
    const colMap: Record<string, string> = {}
    for (let i = 1; i < metaFields.length; i++) {
        const f = metaFields[i]
        if (f && typeof f === 'object' && f.name && f.header) {
            colMap[f.name] = f.header
        }
    }

    return dataToShow.rows.map((row: Record<string, any>) => {
        const mapped: Record<string, any> = {}
        for (const key of Object.keys(row)) {
            const alias = colMap[key]
            if (alias) mapped[alias] = row[key]
        }
        return mapped
    })
}

/**
 * Build a Perspective ViewerConfig from the widget model.
 * group_by  ← fields.rows
 * split_by  ← fields.columns
 * columns   ← fields.data (aliases)
 * aggregates ← fields.data (alias → aggregation)
 * settings  ← show sidebar in editorMode, hide in view mode
 */
export function buildViewerConfig(propWidget: IWidget, editorMode: boolean): Record<string, any> {
    const fields = (propWidget as any).fields ?? {}

    const group_by: string[] = (fields.rows ?? []).map((f: any) => f.alias)
    const split_by: string[] = (fields.columns ?? []).map((f: any) => f.alias)
    const dataFields: any[] = fields.data ?? []

    const columns: string[] = dataFields.map((f: any) => f.alias)
    const aggregates: Record<string, string> = {}
    dataFields.forEach((f: any) => {
        aggregates[f.alias] = mapAggregation(f.aggregation)
    })

    return {
        group_by,
        split_by,
        columns,
        aggregates,
        settings: editorMode,
        theme: 'Pro Light',
        plugin: 'Datagrid'
    }
}
