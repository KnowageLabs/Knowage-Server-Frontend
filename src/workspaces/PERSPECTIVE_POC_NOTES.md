# PivotWidget → Perspective PoC — Session Notes (2026-06-16)

## Why we explored this

DxPivotGrid has two core problems that can't be cleanly fixed:

1. **Aggregation** — if BE sends pre-aggregated or custom formula values, DxPivot re-aggregates them again on the client (wrong results)
2. **Sorting** — preserving BE sort order required a hack: `sortingMethod: () => 0` freezes sort on load; a snapshot + `onDataSourceChanged` listener detects first user interaction; context menu items are intercepted to also trigger the switch. Fragile.

Perspective (`@perspective-dev/*`) solves both: native first-class sort API (no hacks), 27+ built-in aggregate functions including `distinct count`, and a **Virtual Server** pattern that lets BE do the real aggregation.

---

## What was built today

### Files created/modified

| File                                                                | Change                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `vite.config.mjs`                                                   | Added `target: 'esnext'` to `build` object — required for WASM `top-level await`          |
| `src/workspaces/PivotWidget/PerspectiveBootstrap.ts`                | Singleton WASM init, exports `getPerspectiveWorker(): Promise<Client>` — lazy, loads once |
| `src/workspaces/PivotWidget/PerspectiveDataHelper.ts`               | `remapRows()`, `buildViewerConfig()`, `mapAggregation()`                                  |
| `src/workspaces/PivotWidget/PivotWidgetPerspective.vue`             | Vue component — same props as `PivotWidget.vue`                                           |
| `src/modules/documentExecution/dashboard/widget/WidgetRenderer.vue` | Added import + registration + `v-if` for `PivotWidgetPerspective`                         |

### Packages installed

```
@perspective-dev/client  @perspective-dev/viewer  @perspective-dev/viewer-datagrid  @perspective-dev/server
```

### How to activate for testing

Set a pivot widget's `type` to `'static-pivot-table-perspective'` (normal pivot widgets use `'static-pivot-table'` — nothing is broken for existing widgets).

---

## Data mapping

`dataToShow.rows` comes from BE as `[{ column_0: val, column_1: val, ... }]`.  
`dataToShow.metaData.fields` = `[{}, { header: alias, name: 'column_0' }, ...]` (index 0 is 'recNo', skip it).  
`remapRows()` converts these to `[{ [alias]: val, ... }]` so Perspective uses human-readable column names.

### propWidget.fields → Perspective ViewConfig

| Widget field                | Perspective     |
| --------------------------- | --------------- |
| `fields.rows[].alias`       | `group_by`      |
| `fields.columns[].alias`    | `split_by`      |
| `fields.data[].alias`       | `columns`       |
| `fields.data[].aggregation` | `aggregates`    |
| `fields.filters[]`          | skipped for PoC |

### Aggregation map

| Knowage        | Perspective    |
| -------------- | -------------- |
| SUM            | sum            |
| AVG            | avg            |
| MIN            | min            |
| MAX            | max            |
| COUNT          | count          |
| COUNT_DISTINCT | distinct count |
| NONE           | count          |

---

## What can be wired from widget config (not yet done)

### Worth implementing next

1. **Number format/precision** — `visualization.visualizationTypes.types[].precision` → `column_config: { [alias]: { number_format: { minimumFractionDigits, maximumFractionDigits } } }` via `viewer.restore()`
2. **Initial row expansion depth** — `configuration.rows.rowsExpanded` → `view.set_depth(rowsExpanded ? 99 : 0)` post-render (rows only — column collapse is not supported in Perspective)
3. **Cross-navigation** — `interactions.crossNavigation.enabled` in click handler; code already in `PivotWidgetHelpers.ts`, needs adaptation to Perspective's `event.detail` shape
4. **Sort** — `fields.rows/columns/data[].sort` → `sort: [["alias", "asc"]]` in `buildViewerConfig()`

### Cannot wire (Perspective has no equivalent)

| Widget config                                                         | Why not                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| `configuration.rows/columns.grandTotal` on/off                        | No API to hide grand totals                           |
| `configuration.rows/columns.subTotal` on/off                          | Same                                                  |
| `configuration.rows/columns.grandTotalLabel` / `subTotalLabel`        | No custom label API                                   |
| `configuration.rows/columns.excludedFromSubTotals`                    | No per-field sub-total hide                           |
| `configuration.fieldPanel.fieldDragOverrides` (drag/sort/filter lock) | No API                                                |
| `configuration.menuOverrides.disableExpandAll`                        | No per-field expand control                           |
| `style.fields` font/size/weight/align                                 | Not in `ColumnConfigValues`                           |
| `style.totals` / `style.subTotals`                                    | No totals styling API                                 |
| `visualization` prefix/suffix/icon                                    | No cell HTML injection hook                           |
| `tooltips`                                                            | No tooltip API                                        |
| `conditionalStyles` (operator/formula)                                | No per-cell condition hook                            |
| Column collapse/expand                                                | Perspective only collapses rows, not split_by columns |

---

## Gap analysis summary: DxPivot vs Perspective

| Category                         | DxPivot                               | Perspective                                |
| -------------------------------- | ------------------------------------- | ------------------------------------------ |
| Pivot mechanics                  | ✓ Good                                | ✓ Better                                   |
| Sorting                          | ⚠ Hacky snapshot/interception         | ✓ Native first-class                       |
| Aggregation (client)             | ⚠ 6 types, custom Set for distinct    | ✓ 27+ built-in                             |
| BE pre-aggregated data           | ✗ Re-aggregates incorrectly           | ⚠ Virtual Server (needs BE work)           |
| Column collapse/expand           | ✓ Supported                           | ✗ Not supported                            |
| Row collapse/expand              | ✓ Full                                | ✓ `set_depth` / per-row                    |
| Grand/sub-totals config          | ✓ Rich                                | ✗ Poor                                     |
| Per-cell styling (font/align)    | ✓ Full CSS via `onCellPrepared`       | ✗ Color only                               |
| Prefix/suffix in cells           | ✓ HTML injection via `onCellPrepared` | ✗ Impossible natively                      |
| Conditional styles               | ✓ Full                                | ✗ Needs custom plugin                      |
| Tooltips                         | ✓ Full                                | ✗ None                                     |
| Knowage selection interaction    | ✓ Full                                | ⚠ `perspective-click` event, needs adapter |
| Cross-navigation                 | ✓ Full                                | ⚠ `perspective-click` event, needs adapter |
| Field locking (drag/sort/filter) | ⚠ CSS + capture handler hack          | ✗ None                                     |
| State save/restore               | ✓ `dataSource.state()`                | ✓ `viewer.save()`/`viewer.restore()`       |
| WASM setup                       | None                                  | ⚠ Vite `esnext` target + bootstrap         |
| Bundle size delta                | —                                     | ~5MB WASM                                  |

---

## The Virtual Server opportunity (future, needs BE work)

Instead of client-side re-aggregation, implement a `VirtualServerHandler` in the browser that:

1. Receives Perspective's `ViewConfig` (group_by, split_by, sort, filter, aggregates)
2. Translates to Knowage REST API call
3. Returns columnar results to Perspective

BE does the real aggregation. Perspective renders. This is the architecturally correct solution to the core problem.

**Risk:** BE REST endpoints need to accept structured query params rather than returning flat data. Significant BE work. Outside frontend scope.

---

## Key technical notes

- `perspective-click` event detail: `{ row: { alias: value }, column_names: string[], config: { filter: [...] } }`
- `row` uses alias-keyed values (because we remapped data in `remapRows()`)
- Empty table fallback: `worker.table([{}])` — if no data at mount, gives Perspective a garbage schema. Schema-based init would be cleaner for that edge case.
- `viewer.notifyResize()` called on `widgetResized` emitter event
- `viewer.delete()` + `table.delete()` must be called in `unmounted` to prevent WASM memory leaks
- Perspective's sidebar panel = `settings: true` in `viewer.restore()` — shown in editor mode, hidden in view mode

---

## Perspective docs reference

- Guide: https://perspective-dev.github.io/guide/
- Viewer API: https://perspective-dev.github.io/viewer/modules/perspective-viewer.html
- `ColumnConfigValues`: https://perspective-dev.github.io/viewer/types/src_ts_ts-rs_ColumnConfigValues.ts.ColumnConfigValues.html
- Virtual Server: https://perspective-dev.github.io/guide/explanation/architecture.html
