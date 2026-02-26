import { AgGridVue } from 'ag-grid-vue3'
import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community'

// ES modules are singletons: this runs exactly once regardless of how many
// components import this file, preventing duplicate module registrations.
ModuleRegistry.registerModules([ClientSideRowModelModule])

export { AgGridVue }
