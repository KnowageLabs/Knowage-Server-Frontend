import { AgGridVue } from 'ag-grid-vue3'
import { ClientSideRowModelModule, ClientSideRowModelApiModule, RowSelectionModule, RowApiModule, RenderApiModule, ScrollApiModule, CustomEditorModule, RowStyleModule, TooltipModule, CellStyleModule, ModuleRegistry } from 'ag-grid-community'

// ES modules are singletons: this runs exactly once regardless of how many
// components import this file, preventing duplicate module registrations.
ModuleRegistry.registerModules([
    ClientSideRowModelModule, // row model base
    ClientSideRowModelApiModule, // applyTransaction, forEachNode, etc.
    RowSelectionModule, // getSelectedRows, deselectAll, row click selection
    RowApiModule, // getDisplayedRowCount, getRowNode
    RenderApiModule, // refreshCells, getSizesForCurrentTheme
    ScrollApiModule, // getVerticalPixelRange
    CustomEditorModule, // custom cellEditor components + stopEditing
    RowStyleModule, // getRowStyle callback
    TooltipModule, // tooltipComponent in colDef
    CellStyleModule // cellClassRules in defaultColDef
])

export { AgGridVue }
