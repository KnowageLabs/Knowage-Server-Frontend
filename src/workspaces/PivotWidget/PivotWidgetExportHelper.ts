import deepcopy from 'deepcopy'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { getPivotSortEntry } from './PivotWidgetSortRegistry'

const PIVOT_AREAS = ['columns', 'rows', 'data', 'filters'] as const

/**
 * devextreme stores sortBySummaryField as the field's caption (= alias in the model).
 * We resolve it to the actual DB columnName by:
 * 1. Finding the dxField whose caption matches — gives us the UUID id.
 * 2. Using that UUID to find the model field across all areas.
 * 3. Returning modelField.columnName.
 * Going via UUID avoids false matches when multiple fields share the same alias.
 */
const resolveOrderColumnName = (sortBySummaryField: string | undefined, allDxFields: any[], widgetFields: IWidget['fields']): string | undefined => {
    if (!sortBySummaryField || !widgetFields) return undefined
    const targetDxField = allDxFields.find((f) => f.caption === sortBySummaryField)
    if (!targetDxField?.id) return undefined
    for (const area of PIVOT_AREAS) {
        const match = widgetFields[area]?.find((f: IWidgetColumn) => f.id === targetDxField.id)
        if (match) return match.columnName
    }
    return undefined
}

/**
 * Applies live devextreme sort state from a registry entry onto an array of model fields (in-place).
 *
 * Mapping:
 *   dxField.sortOrder ('asc'/'desc'/undefined) → field.sort ('ASC'/'DESC'/'')
 *   dxField.sortBySummaryField (caption/alias)  → resolved via UUID → field.orderColumn (columnName)
 *   No sortBySummaryField                       → field.orderColumn falls back to field.columnName
 */
const applyDxSortToFields = (modelFields: IWidgetColumn[], dxFields: any[], widgetFields: IWidget['fields']): void => {
    modelFields.forEach((modelField) => {
        const dxField = dxFields.find((f) => f.id === modelField.id)
        if (!dxField) return

        modelField.sort = dxField.sortOrder ? (dxField.sortOrder as string).toUpperCase() : ''
        modelField.orderColumn = resolveOrderColumnName(dxField.sortBySummaryField, dxFields, widgetFields) ?? modelField.columnName
    })
}

/**
 * For a static-pivot-table widget, reads the live devextreme sort state from the registry
 * and injects it into a deep-copied widget's fields before it is sent to the export endpoint.
 *
 * If the user has never sorted (userHasSorted === false), the model's own field values
 * are already correct (they come from the original BE-provided sort), so no override is applied.
 */
export const enrichPivotWidgetWithSortState = (widget: IWidget): IWidget => {
    if (widget.type !== 'static-pivot-table' || !widget.id || !widget.fields) return widget

    const entry = getPivotSortEntry(widget.id)
    if (!entry || !entry.userHasSorted) return widget

    const enriched = deepcopy(widget) as IWidget

    for (const area of PIVOT_AREAS) {
        const modelFields = enriched.fields?.[area]
        if (!modelFields) continue
        applyDxSortToFields(modelFields, entry.dxFields, enriched.fields)
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

    widgets.forEach((widget) => {
        if (widget.type !== 'static-pivot-table' || !widget.id || !widget.fields) return

        const entry = getPivotSortEntry(widget.id)
        if (!entry || !entry.userHasSorted) return

        for (const area of PIVOT_AREAS) {
            const modelFields = widget.fields[area]
            if (!modelFields) continue
            applyDxSortToFields(modelFields, entry.dxFields, widget.fields)
        }
    })
}
