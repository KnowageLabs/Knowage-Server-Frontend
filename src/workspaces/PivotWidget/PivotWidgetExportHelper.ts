import deepcopy from 'deepcopy'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getPivotSortEntry } from './PivotWidgetSortRegistry'

/**
 * For a static-pivot-table widget, reads the live devextreme sort state from the registry
 * and injects it into a deep-copied widget's fields before it is sent to the export endpoint.
 *
 * If the user has never sorted (userHasSorted === false), the model's own field.sort values
 * are already correct (they come from the original BE-provided sort), so no override is needed.
 *
 * Mapping from devextreme field → IWidgetColumn:
 *   dxField.sortOrder ('asc'/'desc'/undefined)  → field.sort ('ASC'/'DESC'/'')
 *   dxField.sortBySummaryField (measure caption)  → field.sortBySummaryField
 *   dxField.sortBySummaryPath  (axis value path)  → field.sortBySummaryPath
 */
export const enrichPivotWidgetWithSortState = (widget: IWidget): IWidget => {
    if (widget.type !== 'static-pivot-table' || !widget.id || !widget.fields) return widget

    const entry = getPivotSortEntry(widget.id)
    if (!entry || !entry.userHasSorted) return widget

    const enriched = deepcopy(widget) as IWidget

    for (const area of ['columns', 'rows', 'data', 'filters'] as const) {
        const modelFields = enriched.fields?.[area]
        if (!modelFields) continue

        modelFields.forEach((modelField) => {
            const dxField = entry.dxFields.find((f) => f.id === modelField.id)
            if (!dxField) return

            modelField.sort = dxField.sortOrder ? (dxField.sortOrder as string).toUpperCase() : ''
            modelField.orderColumn = dxField.sortBySummaryField ?? modelField.columnName
        })
    }

    return enriched
}

/**
 * Iterates over all widgets in a dashboard body and enriches any static-pivot-table
 * widget with the live devextreme sort state from the registry.
 * The body must already be a deep copy (e.g. returned from createDashboardSpreadsheetExportBody).
 */
export const enrichDashboardBodyWithPivotSortState = (body: any): void => {
    const widgets: IWidget[] = body?.widgets
    if (!Array.isArray(widgets)) return

    widgets.forEach((widget, index) => {
        if (widget.type !== 'static-pivot-table' || !widget.id || !widget.fields) return

        const entry = getPivotSortEntry(widget.id)
        if (!entry || !entry.userHasSorted) return

        for (const area of ['columns', 'rows', 'data', 'filters'] as const) {
            const modelFields = widget.fields[area]
            if (!modelFields) continue

            modelFields.forEach((modelField) => {
                const dxField = entry.dxFields.find((f) => f.id === modelField.id)
                if (!dxField) return

                modelField.sort = dxField.sortOrder ? (dxField.sortOrder as string).toUpperCase() : ''
                modelField.orderColumn = dxField.sortBySummaryField ?? modelField.columnName
            })
        }
    })
}
