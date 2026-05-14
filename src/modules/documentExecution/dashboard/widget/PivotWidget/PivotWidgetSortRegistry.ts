/**
 * Module-level registry that holds the current devextreme PivotGridDataSource field state
 * for each mounted static-pivot-table widget, keyed by widget ID.
 *
 * This is used to inject live sort configuration (including cross-column sort via
 * sortBySummaryField/sortBySummaryPath) into the export payload at export time, without
 * mutating the Pinia store.
 */

export interface IPivotSortRegistryEntry {
    /** Current field descriptors from dataSource.fields() */
    dxFields: any[]
    /** True once the user has interacted with sorting (devextreme handles sort natively from this point) */
    userHasSorted: boolean
}

const registry = new Map<string, IPivotSortRegistryEntry>()

export const updatePivotSortRegistry = (widgetId: string, dxFields: any[], userHasSorted: boolean): void => {
    registry.set(widgetId, { dxFields, userHasSorted })
}

export const removePivotSortEntry = (widgetId: string): void => {
    registry.delete(widgetId)
}

export const getPivotSortEntry = (widgetId: string): IPivotSortRegistryEntry | undefined => {
    return registry.get(widgetId)
}
