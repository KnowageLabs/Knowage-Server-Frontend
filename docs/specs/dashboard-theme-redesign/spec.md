# Dashboard Theme Manager Redesign

Status: implemented (first version), 2026-10-06. Section 15 lists where the build differs from the draft.
Date: 2026-10-06
Scope: `src/modules/managers/dashboardThemeManagement/`

## 1. Problem

The current manager has three columns: the theme list, a `q-tree` with 30 style editors, and a preview.

- The tree is hard to scan. The user must find the widget type, then the style section, then the form.
- The preview is a long vertical list, not a dashboard. The user cannot judge whether the widgets look uniform.
- Nine widget types show a static PNG inside a themed frame: text, image, chart, html, map, customChart, python, r and pivot. Chart colors from the theme never show.
- Each shared section (title, borders, padding, shadows, background) exists once per widget type. To change the border of all widgets, the user edits every type.
- The page uses PrimeVue `Toolbar`, `KnListBox` and the old grid classes. It does not match the redesigned pages.

## 2. Goals

1. The preview looks like a real Knowage dashboard, with one live widget per theme type.
2. A click on a widget opens the style forms for that widget type.
3. The page uses the standard Quasar shell of the redesigned managers.
4. The user edits the shared style once, with "Edit all".
5. A widget type can opt out of the shared style for one section, for example "the table has no border".
6. The page reuses the existing style form components. It creates no parallel set of forms.
7. The page adds a new pattern to the design system: the canvas editor.

## 3. Non-goals

- **Dashboard general settings** (background, custom header) in the theme. A change to them would disconnect the dashboard from the theme, like widget style changes do today. This needs its own design.
- **Widget-to-theme inheritance inside the dashboard.** Today a dashboard copies the theme into each widget. A per-property override model (base theme, then custom theme, then widget overrides, as in Power BI) is a separate topic.
- **Hover highlighting of type-specific parts** (table headers, rows, chart legend). This is phase 2.
- **A zen or full-screen mode.** Collapsing the theme list gives the same space.
- **A responsive canvas.** The canvas layout is static. The user pans and zooms it.
- **Reordering or resizing widgets** on the canvas by the user. Developers change the layout in a descriptor.
- **A minimap.** Twelve widgets do not need one. Add it later if needed.
- **Knowage themes manager.** It follows later with the same layout.
- **Mobile layouts.**

## 4. Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | The canvas pans and zooms. The style panel floats over the canvas (overlay). When the user selects a widget, the canvas pans it into the free area. | With pan and zoom, a widget behind the panel is never lost. An overlay keeps the canvas size and scale stable when the panel opens. ABI metadata works this way. |
| D2 | No modal dialog for widget editing. | A dialog hides the dashboard. The uniformity check is the reason for the preview. |
| D3 | One widget instance per theme type. | The theme stores its config per type. Two charts would suggest that the user can style them separately. |
| D4 | A click on a widget edits that widget type only. "Edit all" opens only from the "Edit all widgets" control. | One entry point per scope. There is no doubt about what a change affects. |
| D5 | The panel title is the widget type, for example "Table widget". | The user edits a type, not a widget instance. |
| D6 | The forms sit in a `q-expansion-item` accordion. Only one section is open at a time. | This saves space. The widget editor already uses this structure. |
| D7 | Shared sections have an explicit "Inherit shared style" toggle. | An explicit toggle prevents an accidental detach. It also removes the "mixed values" state in Edit all. |
| D8 | The theme saves fully resolved per-type values, plus the shared layer and the inherit flags. | The dashboard keeps reading per-type values. The dashboard needs no change (see section 10). |
| D9 | Hover highlighting phase 1 covers widget-level parts only: title and frame. | Low risk. Type-specific selectors depend on AG Grid and Highcharts markup. |
| D10 | All widgets are live. There are no pictures. | The preview must look like a real Knowage dashboard. |
| D11 | The editor drops `spacer`, `r` and the pivot `crossTabHeaders` section. | `ThemesHelper` never applies the spacer style. The widget picker cannot create an R widget, and `WidgetRenderer` has no R renderer. `crossTabHeaders` has no default value. |
| D12 | The canvas holds individual `WidgetRenderer` instances at fixed pixel positions and sizes. It does not use the dashboard (`DashboardRenderer`, `GridLayout`). | The layout is static, so the dashboard grid adds cost and nothing else. |
| D13 | Pan and zoom use `@panzoom/panzoom`. | About 3.7 KB (min + gzip), no dependencies, MIT, maintained. It handles wheel, trackpad, pinch and zoom toward the cursor. Vue Flow is about 51 KB and is built for graphs. |
| D14 | The widget sizes are generic starting values. | Real widget sizes depend on the data, and every dashboard is different. A theme is a starting point, so the preview only needs sizes that show every style section. |

Research that supports D1 and D6: Power BI (Theme pane and per-visual format pane), Tableau (Format Workbook pane), Looker Studio (Theme and layout panel), Databricks AI/BI and Metabase (full-page theme editor with a live preview). All of them edit next to a visible canvas, not in a modal dialog.

## 5. Layout

The page uses the shell of AI Management and Internationalization Management:

```
q-layout view="hHh lpR fFf" container
├── q-drawer (left, 300 px, bordered, push)      theme list
├── q-drawer (right, 420 px, overlay)            style panel, closed by default
└── q-page-container
    └── q-page                                   canvas viewport, full bleed
        ├── background layer (dots and grain)
        ├── panzoom stage (the widgets)
        ├── hover overlay (not scaled)
        ├── name chip (top left)
        ├── action bar (top right of the free area)
        └── control bar (bottom left)
```

### 5.1 Theme list (left drawer)

- The list has the same features as today: new theme, import from JSON or ZIP, select, delete, default badge.
- The list uses the list style of the redesigned managers, not `KnListBox`.
- The user can collapse the drawer with a toggle.
- The drawer pushes the canvas viewport. The viewport gets narrower, but the canvas scale does not change.

### 5.2 Canvas background

Copy the ground of the ABI metadata page (`fe/src/assets/css/textures.css` and `MetadataView.vue` in ABI):

- **Dots:** a radial-gradient dot field: a 24 px gap and a light 1.5 px dot. The dot spacing doubles or halves with the zoom, so the screen spacing stays between 18 and 36 px. Without this, the dots get dense when zoomed out.
- **Grain:** a fractal-noise SVG (`feTurbulence`) as a 256 px tile at 6% opacity. Above about 8%, it reads as noise.
- **Difference from ABI:** the ABI ground does not move. Here, the dot layer follows the pan and zoom: set `background-position` from the pan offset and `background-size` from gap × scale. This shows the user that the canvas moves. The grain stays fixed.
- Map the ABI `--ui-*` colors to Knowage `--kn-*` tokens. Add tokens if none fit, for example `--kn-canvas-background` and `--kn-canvas-dot-color`.
- Put the texture CSS in a shared stylesheet, not in the page. The future Knowage themes canvas uses it too.

### 5.3 Pan and zoom

- `@panzoom/panzoom` controls one stage element that holds all the widgets (D13).
- **Drag** on the background pans the canvas. Drag on a widget interacts with the widget. **Space + drag** pans over widgets too.
- **Click:** a pointer-up with less than about 4 px of movement is a click. It selects the widget.
- **Wheel** zooms toward the cursor, in steps of about 10%. Over widget content that can still scroll (a selector list, a grid), the wheel scrolls that content. The zoom buttons also change the zoom by 10%.
- The zoom range is 25% to 200%.
- **Initial view:** fit to the width of the free area, with a maximum of 100%, top aligned.
- **Free area:** the canvas viewport minus the style panel when the panel is open. Fit and auto-pan use the free area only.
- We write two helpers. `@panzoom/panzoom` does not provide them:
  - `fitToFreeArea()`: compute the scale and offset that show the whole canvas in the free area.
  - `centerOnWidget(id)`: pan the widget into the free area. If the widget is larger than the free area, align its top-left corner. Do not change the zoom.
- Widgets are interactive: the user can check a selector option or scroll a list to see those styles. Selections stay in the preview dashboard; nothing listens to them. Leaflet and Highcharts tooltips can be off by the zoom factor, because a CSS transform changes their mouse coordinates.
- The hover overlay reads `getBoundingClientRect()`. These values already include the transform. Draw the overlay in a layer that is not transformed.

### 5.4 Floating controls

All floating groups use the ABI control style: a bordered, elevated bar with a small radius and 36 px square buttons, divided by 1 px borders. The muted icon color changes to the strong text color on hover.

- **Top left: name chip.**
  - It shows the theme name. A click edits the name in place (`q-popup-edit`).
  - It shows a "Default" badge for the default theme.
  - It shows a dot when there are unsaved changes.
- **Top right of the free area: action bar** (horizontal).
  - **Edit all widgets.** This opens the panel in shared mode (section 8.3).
  - **Download.** This downloads the theme as JSON. It shows only for a saved theme.
  - **Save.** It is disabled when there is nothing to save. It has the primary color when there are unsaved changes, and a short success state after a save. This is the same as the ABI save control.
  - When the panel opens, the action bar moves left by the panel width, so the panel never covers it.
- **Bottom left: control bar** (vertical, like the Vue Flow controls).
  - Zoom in.
  - Zoom out.
  - Fit (`fitToFreeArea()`).
  - The current zoom as a percentage. A click resets the zoom to 100%.

### 5.5 Style panel (right drawer, overlay)

- The panel floats over the canvas (D1). It has a shadow on its left edge.
- The header shows the panel title (D5) and a close button.
- The body is a `q-card` with a `q-list` of `q-expansion-item` sections. Make it look like the document details cards.
- The footer has "Discard changes". It reverts the theme to the last saved state.

## 6. Widgets on the canvas

### 6.1 Types and renderers

There is one live widget per theme type. Twelve types are in the editor (D11).

| Theme type | Widget type rendered | Mock content | Risk |
|---|---|---|---|
| text | text | A heading and a paragraph | Low |
| image | image | A built-in SVG picture | Low. The canvas replaces the gallery image with CSS. |
| html | html | A small card with HTML and CSS | Low |
| activeSelections | selection | 3 active selections | Low. `ActiveSelectionsExample.vue` exists. |
| chart | highcharts | A pie or donut with 6 slices, so the palette shows | Low. `HighchartsWidgetMock.json` exists but no code uses it. |
| selector | selector | 5 options. A 2-level tree for the tree variants. | Low. The mock exists. |
| table | table | See 6.3 | Low. The mock exists. |
| discovery | discovery | 2 facets and 5 rows | Low. The mock exists. |
| pivot | ce-pivot-table | Mock `dataToShow.htmlTable` | Medium. `static-pivot-table` only renders the text "Pivot Widget Goes Here". |
| customChart | customchart | A small built-in HTML, CSS and JS bar chart, with no external library | Medium. The widget runs the script in an iframe. |
| python | python | A mock `dataToShow.result`: a small HTML result | Low. `PythonWidgetContainer` renders `dataToShow.result`. |
| map | map | The base map only, no layer | Medium. The tiles load through the Knowage proxy (`cartoLight`). |

- Re-render on change with a debounce of about 150 ms.
- Today the preview already renders 13 live `WidgetRenderer` instances. Twelve widgets is a normal dashboard size, so the render cost is acceptable.

### 6.2 Selector variants

The selector type has 13 variants. The tile shows one variant at a time.

- **From the form:** when the user opens a variant section in the panel (for example Radio or Date range), the tile switches to that variant.
- **On the canvas:** a small variant menu sits above the top-right corner of the tile. It shows on hover and when the tile is selected. The menu is editor chrome: it is outside the widget, so it never changes the widget look.
- The sections Label and Flex apply to all variants. Opening them keeps the current variant.
- The default variant is the radio list. It shows more style than an empty dropdown.

### 6.3 Mock data rule

The data is the minimum that shows every style section of the type. Examples:

- **Table:** 5 columns, one column group, 6 rows and a page size of 5, so the paginator shows. Add one summary row. There must be at least 2 rows, so the alternate row color shows.
- **Pivot:** 2 row fields and 1 column field with 2 values. Subtotals and totals are on.
- **Discovery:** 2 facets, a search box and 5 rows.

### 6.4 Layout

- The layout is a descriptor of `{ type, x, y, width, height }` entries, in pixels at 100% zoom (D12).
- The sizes are generic starting values (D14). The table, discovery and pivot widgets fit 5 or 6 columns of a generic width.
- The gap between widgets is 24 px.

| Row | Widgets (width × height, px) |
|---|---|
| 1 | Text 380 × 200, Image 380 × 200, HTML 380 × 200, Active selections 380 × 200 |
| 2 | Chart 560 × 360, Selector 300 × 360, Custom chart 460 × 360 |
| 3 | Table 860 × 420, Python 480 × 420 |
| 4 | Discovery 860 × 420, Map 480 × 420 |
| 5 | Pivot 860 × 420 |

- The canvas is about 1600 × 1920 px at 100%.
- The order is not important. Change it in the descriptor at any time.

## 7. Theme name

- The theme name is in the top-left chip (section 5.4). There is no header bar.
- The name is also in the theme list.

## 8. Interaction

### 8.1 Selection

- A click on a widget opens the panel for that widget type.
- There is no selection outline: it distracted from the widget styles. The panel title shows the selected type.
- The canvas pans the widget into the free area (`centerOnWidget()`).
- A click on a different widget switches the panel to that type.
- Close or Esc closes the panel and clears the selection.

### 8.2 Hover highlighting, phase 1

- A hit-test overlay draws one outline box from `getBoundingClientRect()`, with a small label.
- Phase 1 knows two parts per widget:
  - the title bar, which opens the Title section;
  - the frame (the widget container), which opens the Borders section.
- A click on a part selects the widget and opens that section.
- Hide the overlay while the user drags the canvas.
- Keep the selector map in one descriptor per widget type, so phase 2 adds entries and no new logic.

### 8.3 Edit all (shared mode)

- Only the "Edit all widgets" control in the action bar opens it (D4).
- The panel title is "All widgets".
- The panel shows only the shared sections: Title, Borders, Padding, Shadows, Background.
- A change writes to the shared layer. It also writes to every type that inherits that section.
- Each section lists the types that do not inherit it, for example "Not inherited: Table". Its **Apply to all** button makes every type inherit that section again.
- **Apply to all widgets** in the panel footer does the same for every shared section. Both ask for confirmation, because the types lose their own values.

### 8.4 Type mode

- The panel shows all sections of the type: the shared sections first, then the type-specific sections.
- Each shared section has an "Inherit shared style" toggle in its accordion header.
  - **On:** the form shows the shared values and is read-only.
  - **Off:** the form is editable. The values start as a copy of the shared values.
  - **Switching on again:** the shared values replace the type values. Ask for confirmation if the values differ.
- The type-specific sections have no toggle.

### 8.5 Dirty state and leaving

- Any change sets the dirty state. The save control and the name chip show it.
- A theme switch or route leave with unsaved changes asks for confirmation. Use the same pattern as the ABI metadata leave dialog.

## 9. Reuse of the style forms

The forms in `WidgetEditorSettingsTab/**/style/` already accept `widgetModel` or `themeStyle`. The current manager already passes `themeStyle` and `widgetModel: null`. Reuse them as they are.

The sections per type, from `DashboardThemeHelper.ts`:

| Type | Sections |
|---|---|
| All types (shared) | title, borders, padding, shadows, background |
| table | columns, columnGroups, headers, rows, summary, paginator |
| pivot | fieldHeaders, fields, totals, subTotals |
| discovery | columns, headers, rows |
| activeSelections | chips, rows |
| selector | label, flex, radio, checkbox, dropdown, multiDropdown, date, dateRange, slider, range, buttonToggle, tree, multiTree |
| chart | colors |

- Map each section to its form in one descriptor. Do not use the `v-else-if` chain of `DashboardThemeManagementEditor.vue`.
- A form may need a "read-only" prop for the inherit state. Add it to the form. Do not wrap the form in a disabled overlay.
- Restyle a form only if it breaks inside the accordion. A restyle must also work inside the widget editor.

## 10. Data model

### 10.1 Shape

```jsonc
{
  "shared": {
    "style": { "title": {}, "borders": {}, "padding": {}, "shadows": {}, "background": {} }
  },
  "table": {
    "inherit": { "title": true, "borders": false, "padding": true, "shadows": true, "background": true },
    "style": { "title": {}, "borders": {}, "...": {} }   // fully resolved, as today
  },
  "chart": { "inherit": { }, "style": { } }
  // ... the other types
}
```

### 10.2 Rules

1. **Put `inherit` next to `style`, never inside it.** `applyStylesToWidget()` copies every key of `style` into the widget.
2. **Keep the per-type `style` fully resolved.** Before each save, copy the shared values into every type section with `inherit: true`.
3. **`shared` is a root key with a `style` object.** No dashboard code loops over the config keys, so the dashboard never sees it.
4. **Do not add `shared` or `inherit` to `getDefaultDashboardThemeConfig()`.** The dashboard also uses that function for `dashboard.configuration.theme`. Add them with a manager-only helper.
5. **Keep `spacer` and `r` in the saved config. Do not show them, and do not include them in the shared layer.** Existing themes and older versions expect these keys. Leave their values as they are.

### 10.3 Impact on the dashboard: none

| Dashboard code | What it reads | Effect of the new keys |
|---|---|---|
| `applySelectedThemeToWidgets()` | `config[<type>]`, picked by `widget.type` | None. It never reads `shared`. |
| `applyStylesToWidget()` | `config[<type>].style` only | None. `inherit` is outside `style`. |
| `updateWidgetThemeAndApplyStyle()` (dashboard load, widget editor) | Same as above | None |
| `WidgetEditorThemePicker.vue` | `applyStylesToWidget()` | None |

The backend stores the config JSON as it gets it. No backend change is needed.

### 10.4 Backwards compatibility

When the manager loads a theme without `shared`, extend `themeBackwardsCompatibility()` (or add a manager-only step):

1. For each shared section, set `shared` to the most common value across the 12 editor types (deep equality).
2. For each type and section, set `inherit` to true if the value equals `shared`, and false if it does not.

Import of an old JSON file uses the same step.

**Known limit:** a new-format theme imported into an older Knowage version shows `shared` as an extra node in the old tree editor. The dashboard still works. Accept this.

## 11. Files

| File | Change |
|---|---|
| `package.json` | Add `@panzoom/panzoom` |
| `DashboardThemeManagement.vue` | Rewrite: Quasar shell, list drawer, canvas, panel |
| `DashboardThemeManagementEditor.vue` | Replace with the accordion panel |
| `dashboardThemeManagementExamples/DashboardThemeManagementExamples.vue` | Replace with the canvas |
| `dashboardThemeManagementExamples/examples/WidgetPictureExamples*` | Delete. There are no pictures any more. |
| `public/images/dashboard/themeExamples/*.png` | Delete if no other code uses them |
| `dashboardThemeManagementExamples/mocks/*` | Use the chart mocks. Add mocks for pivot, custom chart, python and map. |
| `DashboardThemeHelper.ts` | Add a helper for the shared layer, a resolver and the compatibility step |
| `DashboardThememanagement.d.ts` | Add `shared` and `inherit` types |
| `WidgetEditorSettingsTab/**/style/*.vue` | Add a read-only prop where needed |
| `src/assets/scss/` | Add the canvas texture styles (dots and grain) and the canvas tokens |
| New | Layout descriptor, section descriptor, hover selector descriptor, pan-and-zoom composable (wraps `@panzoom/panzoom`, `fitToFreeArea()`, `centerOnWidget()`), floating control bar component |
| i18n | Edit `en-US` only |

## 12. Acceptance criteria

1. The page uses `q-layout` with a 300 px left drawer, like AI Management.
2. The canvas shows 12 live widgets, one per editor type, in the layout of section 6.4. No widget is a picture.
3. The chart widget shows the theme palette.
4. The canvas background has the dot field and the grain. The dots follow pan and zoom. The grain stays fixed.
5. Drag on the background pans the canvas; Space + drag pans over widgets. The wheel and pinch zoom toward the cursor. A click without movement selects a widget.
6. The control bar works: zoom in, zoom out, Fit, and the percentage that resets to 100%.
7. The style panel floats over the canvas. Opening it does not change the canvas scale.
8. A click on a widget opens the panel titled "<Type> widget", outlines the widget and pans it into the free area.
9. The action bar stays visible when the panel is open.
10. Hovering the title or the frame of a widget shows an outline with a label. A click opens the matching section.
11. Opening a selector variant section switches the selector tile to that variant. The variant menu on the tile also switches it.
12. Only the "Edit all widgets" control opens the shared mode.
13. In shared mode, a change updates every type that inherits that section, and only those types.
14. In type mode, the "Inherit shared style" toggle sets the form to read-only when it is on.
15. A saved theme has fully resolved per-type `style` values. Applying the theme to a dashboard gives the same result as today for the same values.
16. An old theme loads with derived `shared` and `inherit` values. Its per-type values do not change. Its `spacer` and `r` entries stay unchanged.
17. The name chip edits the theme name. Unsaved changes show on the chip and on the save control. Leaving with unsaved changes asks for confirmation.
18. New, import, download, save, delete and the default theme work as today.
19. The page has no PrimeVue components.

## 13. Open questions

1. Map: can the mock layer model stay small? Check `MapWidgetDataProxy.ts` and the layer settings in planning.
2. Custom chart: which built-in sample script? It must not load external libraries.
3. AG Grid inside a CSS transform: check that the table and discovery widgets measure their columns correctly at zoom levels other than 100%.

## 14. Phase 2 (later)

- Hover highlighting for type-specific parts: table headers, rows, summary, paginator; chart title and legend.
- The disabled "Edit theme" button in dashboard general settings (`DashboardThemes.vue`) opens the same panel on the real dashboard.

## 15. Differences between the draft and the build

- **Pivot:** the canvas renders a `ce-pivot-table` with mock HTML. The `static-pivot-table` widget renders only a placeholder text.
- **Map:** the map has no marker layer. A mock layer model needs a dataset; the base map is enough to show the frame styles.
- **Image:** the canvas shows a built-in SVG instead of a gallery image, so it needs no network and no gallery item.
- **Selector:** the default variant is the radio list.
- **Panel:** 420 px wide. The forms of the widget editor are too narrow at 380 px.
- **Forms mount only when their section is open.** Some forms fill in missing defaults when they mount (for example `paginator.variant`). When the theme is clean before the mount, the page takes a new snapshot after it, so these defaults do not count as user changes.
- **Panzoom start pan:** `@panzoom/panzoom` applies its start pan in a timeout after it starts. The composable exposes a `ready` promise; the first fit waits for it.
- **Feedback after the first build:** the wheel zooms instead of panning, the zoom steps are smaller, the widgets are interactive, the selection outline is gone, the dots adapt to the zoom, and Edit all has Apply to all.
- **Constant props:** the canvas passes constant arrays to `WidgetRenderer`. A new `[]` on each render made every widget re-render on each pointer move.
- **Fix outside the scope:** `HeaderRenderer.vue` read `configuration.headers.enabled` without a guard. Discovery widgets have no `headers` configuration, so their header cells failed in every dashboard since commit `acdadc31f` (2025-11-12). The guard is now `headerConfig?.enabled`.
- **Removed:** the old editor, the examples folder, the PNG pictures in `public/images/dashboard/themeExamples` and the unused `ThemeExamples` import in `DashboardThemes.vue`. The three mocks still in use moved to `canvas/mocks/`.
- **Lockfile:** `package-lock.json` is not updated. The committed lockfile is older than `package.json` (for example highcharts 11.4.3 vs 13.1.1), so `npm install` rewrites much of it. Update it in a separate change.

## 16. Second round of feedback

- **Hover highlighting is removed** (it replaced D9 and section 8.2). A click on a widget opens its panel. The canvas does not pan to the widget.
- **Interactive and static widgets.** Selector, table, discovery, active selections, chart and pivot are interactive: a drag on them does not pan. Text, image, HTML, custom chart, Python and map are static previews: their content ignores the pointer, so a drag pans and the wheel zooms over them. This solves the iframe and Leaflet capture without a scroll-capture overlay.
- **Bigger layout:** the widgets are about 1.4 times larger (table 1100 × 520, chart 760 × 480). The canvas is about 1912 × 2396 px.
- **Panel width:** 520 px. All forms fit at this width.
- **Section header toggles:** sections whose form has an "Enabled" toggle show it in the accordion header, next to "Inherit". The form copy is hidden through the class `kn-theme-enabled-toggle`. The accordions have no chevron.
- **Selector:** slider, range and button toggle show 6 values instead of 24.
- **Enterprise pivot:** when the enterprise addon is installed (`PivotWidget` registers `DxPivotGrid`), the canvas renders a `static-pivot-table` with mock rows. Without the addon, it renders the ce-pivot.
- **Fix outside the scope:** `_devextreme.scss` neutralised the DevExtreme link colour with a selector of specificity (0,2,3). It beat every component link rule, so with the addon the main menu icons turned dark. The `:not()` is now inside `:where()`, which lowers the specificity to (0,1,2).

## 17. Third round of feedback

- **Widgets are inactive until clicked** (this replaces the interactive and static split of section 16). An inactive widget ignores the pointer: a drag over it pans and the wheel zooms. A click activates it: it becomes interactive, and a drag on it does not pan.
- **Focus mode:** the active widget sits above a dark scrim that dims the rest of the canvas. A click on the scrim or the background, or Esc, ends the focus and closes the panel. Edit all has no focus mode.
- **Hover effect (as on hex.tech):** an inactive widget under the pointer gets a 2 px outline (constant at every zoom), and a small "Click to edit" label follows the cursor.
- **Map:** a built-in street map picture sits under the Leaflet tiles, so the map never looks empty.
- **Selector variant menu:** hidden while another widget is in focus.
- **Dim toggle:** a button in the bottom-left controls turns the dimming on or off. Dimming is off by default. The canvas remembers the choice in local storage.

## 18. Enterprise pivot removed from this repository

The enterprise pivot (DevExtreme) is not part of this repository. The addon files, the DevExtreme import and the `dx-viewport` class are reverted, and so are the enterprise pivot mock (section 16) and the `_devextreme.scss` change. The canvas always renders the ce-pivot.

Follow-up for the enterprise build: with the addon, `body.dx-theme-generic-typography a:not(.pivot-widget-container a)` in `_devextreme.scss` has specificity (0,2,3) and overrides the link colours of the main menu (dark icons). Wrapping the `:not()` in `:where()` lowers it to (0,1,2) and fixes it.

## 19. Fourth round of feedback (2026-10-07)

- **Tree selectors:** the tree and multi tree mocks passed their data unwrapped. `WidgetRenderer` reads single selector data under the first column name, so the tree got no rows. All selector mocks now use the per-column shape.
- **Discovery:** the discovery widget builds its grid columns from the style once and does not watch the widget. The canvas remounts it on every theme change, like the pivot.
- **Active selections variants:** the tile shows chips or a list (the Rows section). Opening the Chips or Rows section switches the tile, and a variant menu on the tile does the same, as for the selector. The default is the list (Rows), the widget default.
- **Linked border radius:** the linked field wrote the other three corners only on `change` (blur). The preview could apply the first corner alone, and closing the form before the blur lost the others. The linked field now writes all four corners on each input. Corners with different values open unlinked. This is in `WidgetBordersStyle.vue`, so it also applies in the widget editor.
- **Map clipping:** `WidgetRenderer` sets `overflow: visible` on map widgets (for the legend), so the map ignored the border radius. The canvas clips its map tile. Dashboards keep the old behaviour; the same bleed is possible there.
- **Toolbar (trial, reverted):** a standard `kn-toolbar--secondary` header over the canvas was tried and removed. The floating controls stay; the decision waits for user feedback.
- **Variant menus only on the focused widget:** the selector and active selections menus show only while their widget is in focus (this replaces the hover rule of section 6.2 and the "hidden while another widget is in focus" rule of section 17).
- **Menus drifted from their widget:** panzoom sets `overflow: hidden` on the canvas viewport. A focused input inside a widget scrolled the viewport, which moved the widgets away from the pan and zoom and from the menus placed with it. The viewport now uses `overflow: clip !important`, which cannot scroll.
- **No theme opens by itself:** the page opens with the hint. The user picks a theme in the list. A close button (X) at the end of the action bar closes the open theme and asks first when there are unsaved changes. Deleting the open theme also closes it.
- **Chrome trimmed:** the "Mock data." note and the Default badge on the name chip are removed. The theme list still shows the default theme.
- **Hint centred:** with no open theme, the hint sits in the centre of the page.
- **List reopens on close:** the list toggle is on the canvas, so closing a theme opens the list again. Otherwise a collapsed list could not be expanded.
- **Dimming on by default:** the focus scrim is on until the user turns it off (this replaces the default of section 17). A stored choice still wins.

## 20. Guided tour

The guided tour button in the main menu starts a driver.js tour (`DashboardThemeTour.ts`, same popover style as the main tour). It has 8 steps: theme list, add or upload (import JSON), rename, click a widget, Inherit (the tour opens the Table panel and points at the Borders toggle), Edit all widgets, dim toggle, save. When no theme is open, the tour opens the default theme, or the first one. Closing the tour closes the panel. Elements are found by `data-tour-id`.

The page registers the tour with `usePageTour()` (`src/composables/usePageTour.ts`). While a page with a registered tour is mounted, the main menu tour button starts that page's tour. On other pages it starts the main menu tour, as before. Other pages can add their own tour the same way.
