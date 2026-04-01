# GitHub Copilot Instructions – Knowage Server Frontend

## Project Overview

Knowage Server Frontend is the Vue 3 single-page application for the **Knowage** open-source Business Intelligence suite. It is built with **Vite**, **TypeScript**, **PrimeVue**, **Quasar**, and **Pinia**. The app covers dashboards, document execution, workspace management, KPI editors, query builders, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API + Options API) |
| Build tool | Vite 6 |
| Language | TypeScript 5 (strict mode, `noImplicitAny: false`) |
| State management | Pinia |
| UI components | PrimeVue 3, Quasar 2 |
| Charts | Highcharts 11, Chart.js 3 |
| Tables | AG Grid 33 |
| Maps | Leaflet |
| Code editor | Monaco Editor |
| HTTP client | Axios (configured in `src/axios.js`) |
| i18n | vue-i18n 11 |
| Testing | Vitest + @testing-library/vue |
| CSS utilities | PrimeFlex 2 |
| Icons | Font Awesome 6, PrimeIcons 5, Material Icons |

---

## Project Structure

```
src/
├── App.store.js          # Global Pinia store (user, error, locale, licenses…)
├── App.routes.js         # Top-level router
├── axios.js              # Axios instance with CSRF token + session interceptors
├── main.ts               # App entry point
├── components/UI/        # Shared "Kn*" reusable UI components
├── composables/          # Shared Vue composables (useAgGrid, useInternationalization…)
├── helpers/              # Pure utility functions (locale, theme, auth…)
├── i18n/                 # Translation JSON files per locale (en-US, it-IT, …)
├── modules/
│   ├── commons/          # Cross-module shared components
│   ├── documentBrowser/  # Document browser module
│   ├── documentExecution/
│   │   └── dashboard/    # Dashboard engine (main feature area)
│   ├── importExport/
│   ├── kpi/
│   ├── mainMenu/
│   ├── managers/         # Admin managers (themes, functions catalog, …)
│   ├── qbe/              # Query By Example builder
│   └── workspace/
└── overlay/              # Overlay/popup generic functionality
```

### Dashboard module structure (`src/modules/documentExecution/dashboard/`)

```
Dashboard.d.ts            # All shared TypeScript interfaces (IWidget, IDashboard, …)
Dashboard.store.ts        # Dashboard Pinia store
DashboardController.vue   # Top-level dashboard orchestrator
DashboardRenderer.vue     # Sheet renderer
DashboardHelpers.ts       # Pure helper functions + mitt emitter
widget/
├── ChartWidget/
│   └── classes/highcharts/
│       ├── KnowageHighcharts.ts          # Abstract base class
│       ├── KnowageHighchartsBarChart.ts  # Concrete chart class (pattern to follow)
│       ├── KnowageHighchartsLineChart.ts
│       └── … (one file per chart type)
├── TableWidget/
├── MapWidget/
├── SelectorWidget/
├── PivotWidget/
└── WidgetEditor/
```

---

## Coding Conventions

### General

- **TypeScript** for all new files inside `src/modules/` and `src/components/`. Plain `.js` is still used in some legacy areas (`App.store.js`, `axios.js`, `App.routes.js`).
- Use `@/` path alias for imports from `src/` (e.g., `@/modules/documentExecution/dashboard/Dashboard`).
- Always prefer `deepcopy` from the `deepcopy` package for deep-cloning objects instead of `JSON.parse/stringify` or spread operators on nested objects.
- Use `crypto.randomUUID()` for generating IDs.
- Avoid `console.log` in production code.

### Vue Components

- Use `defineComponent` with the **Options API** style for Vue files inside `modules/` (existing pattern). New standalone utility components may use `<script setup>`.
- Component names must be in **kebab-case** (enforced by ESLint rule `vue/component-definition-name-casing`).
- Props should be typed with TypeScript `PropType<T>`.
- Use `emitter` (mitt instance exported from `DashboardHelpers.ts`) for cross-widget events inside the dashboard.
- Template: use PrimeFlex utility classes (`p-d-flex`, `p-m-2`, `kn-flex`, etc.) for layout. Do not introduce additional CSS frameworks.
- All user-visible strings must go through `$t('key')` / `t('key')` for internationalisation. Add the key to all locale files under `src/i18n/`.

### Pinia Stores

- Define stores with `defineStore('storeName', { state, actions, getters })` options syntax (no `setup()` syntax unless the module already uses it).
- The main app store is `src/App.store.js` — import it as `mainStore` and instantiate with `mainStore(pinia)`.
- The dashboard store is `src/modules/documentExecution/dashboard/Dashboard.store.ts`.
- Use `mapActions` / `mapState` from Pinia inside Options API components.

### Highcharts Chart Classes

Every chart type follows this **class pattern**:

```typescript
import { KnowageHighcharts } from './KnowageHighcharts'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'

export class KnowageHighcharts<ChartName>Chart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))        // legacy model migration
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== '<type>') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = '<type>'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
    }

    updateModel(oldModel: any) { /* call the dedicated updater */ }
    setSpecificOptionsDefaultValues() { /* set plotOptions, axes, sonification */ }
    setData(data: any, widgetModel: IWidget, variables: IVariable[]): any { /* populate this.model.series */ }
    updateSeriesLabelSettings(widgetModel: IWidget) { /* delegate to helpers */ }
}
```

- Place the new class file in `src/modules/documentExecution/dashboard/widget/ChartWidget/classes/highcharts/`.
- Add model migration logic in a corresponding `updater/KnowageHighcharts<ChartName>ChartUpdater.ts`.
- `setData` must always reset `this.model.series = []` before populating.
- Reuse helpers from `helpers/setData/HighchartsSetDataHelpers.ts` and `helpers/dataLabels/HighchartsDataLabelsHelpers.ts`.

### TypeScript Interfaces

- All dashboard-related interfaces live in `Dashboard.d.ts`. Highcharts-specific interfaces live in `interfaces/highcharts/DashboardHighchartsWidget.d.ts`.
- Do not use `any` unless strictly necessary (the project has `noImplicitAny: false` but prefer explicit types).
- Use `interface` for object shapes, `type` for unions/aliases.

### API Calls

- All HTTP calls go through the Axios instance (`import axios from 'axios'`).
- Base URL is set from `VITE_BASE_URL` env variable.
- REST services follow the pattern: `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/…`.
- Handle errors by dispatching to the `mainStore` error state (`store.setError({ title, msg })`).

### CSS / Styling

- Scoped styles inside Vue SFCs are preferred.
- Use SCSS (`.scss`). The `src/assets/scss/` folder has global styles.
- PrimeFlex class naming convention: `p-{property}-{value}` (e.g., `p-m-2`, `p-d-flex`).
- Custom `kn-` prefixed classes are project-specific utility classes.

---

## Testing

- Tests live in `__tests__/` subdirectories next to the module being tested.
- Use **Vitest** with `@testing-library/vue` and `@vue/test-utils`.
- Mock Pinia stores using `@pinia/testing`.
- Run tests: `npm run test` (watch) or `npm run test:run` (single pass).
- Coverage: `npm run coverage`.

---

## i18n

- All translation keys are in `src/i18n/<locale>/` JSON files.
- When adding a new user-facing string, add the key to **every** locale file (copy the English text as a placeholder for untranslated locales).
- In templates use `$t('module.section.key')`. In scripts use the `t()` function from `useI18n()` or from the `i18n.global` singleton.

---

## Common Pitfalls

1. **Deep-copy before mutating** Pinia state or chart models — always use `deepcopy()`.
2. **CSRF token** is automatically injected by the Axios interceptor; do not add it manually.
3. **emitter (mitt)** is the dashboard's internal event bus. Events are typed implicitly — check existing usages in `DashboardHelpers.ts` before adding new ones.
4. **AG Grid theme**: use `themeBalham` imported from `ag-grid-community` and the `AgGridVue` component from `@/composables/useAgGrid`.
5. **Highcharts legacy migration**: the `model.CHART` check in chart constructors handles models from the old Knowage (pre-Vue) format — always preserve this branch.
6. **Variable placeholders**: use `replaceVariablesPlaceholdersByVariableName` from `InteractionsParserHelper.ts` to resolve `${variableName}` patterns in widget settings.
7. **`noImplicitAny: false`** is set but `@typescript-eslint/no-explicit-any` is **off** — use explicit types where possible anyway.
8. **Component registration**: chart-specific sub-components (cell renderers, header renderers, etc.) registered inside AG Grid must be suppressed with `// eslint-disable-next-line vue/no-unused-components`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (base path `/knowage-vue`) |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint auto-fix |
| `npm run test` | Vitest watch |
| `npm run test:run` | Vitest single run |
| `npm run coverage` | Vitest coverage report |
