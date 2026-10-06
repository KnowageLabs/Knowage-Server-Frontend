# Knowage Design System: Brainstorm

Status: brainstorm, not approved. Development comes later.
Date: 2026-10-06

## 1. Why

- We redesign Knowage pages one by one, mostly with AI agents.
- Each redesign starts from the code next to it. Much of that code is legacy PrimeVue, so agents copy the old look.
- We want every future redesign and new page to look and behave the same.
- This is our first design system. The main reader is an AI agent. The second reader is a developer on the team.

## 2. What exists today

**Pages already redesigned (the reference set):**

| Page | File | Pattern |
|---|---|---|
| AI Management | `src/modules/managers/aiManagement/AiManagement.vue` | List and detail, left drawer, centered cards |
| Internationalization | `src/modules/managers/internationalizationManagement/InternationalizationManagement.vue` | List and detail, card with search inside |
| Users | `src/modules/managers/usersManagement/UsersManagement.vue` | List and detail |
| Cross Navigation | `src/modules/managers/crossNavigationManagement/CrossNavigationManagement.vue` | List and detail |
| KPI Definition | `src/modules/kpi/kpiDefinition/KpiDefinition.vue` | List and detail, right drawer in the detail |
| Document Browser | `src/modules/documentBrowser/documentBrowserHome/DocumentBrowserHome.vue` | Left drawer and right overlay drawer |
| Main menu | see `docs/specs/main-menu-redesign` | Overlay menu that expands on hover |

**Shared conventions in these pages:**

- The shell is `q-layout view="hHh lpR fFf" container` with a left `q-drawer`.
- The cards have an uppercase grey header: about 0.8 rem, `letter-spacing: 0.05em`.
- The detail content is centered with a maximum width, on a light grey ground (`#f3f3f3`).
- Confirmations use `$q.dialog`, not the PrimeVue `$confirm`.
- New code uses `<script setup>`.

**Inconsistencies to fix:**

- The left drawer width is 300 px on some pages and 400 px on others.
- Some drawers have `bordered`, some do not.

**Tokens:**

- The `--kn-*` CSS variables in `src/assets/scss/utils/_variables.scss`.
- The Knowage themes manager edits these variables (`src/helpers/themeHelper/themeHelperDescriptor.json`).

**Components already reworked:** `KnHint` (corner accent, icon from the theme) and the new icon picker.

## 3. Proposed structure

Three layers, as in Material, Polaris and Atlassian:

1. **Tokens.** Colors, spacing, radius, typography and elevation. They are the `--kn-*` variables. Rule: no raw hex values in new code.
2. **Components.** The Kn components, and the Quasar components with our default props, for example `q-input outlined dense`. Each entry gives:
   - the file;
   - when to use it;
   - when not to use it;
   - a minimal example;
   - one reference usage in the code.
3. **Patterns.** Page templates and recurring structures. Each pattern has one "golden" reference file and a skeleton. The first candidates:
   - Manager list and detail (AI Management, Internationalization).
   - Form card (document details).
   - Canvas editor (the dashboard theme manager, in progress).
   - Style accordion card (the dashboard theme manager, in progress).
   - Confirm dialog, empty state, hint card.

## 4. What agents need

Agents copy the nearest code they find. The design system must therefore say what to copy and what never to copy.

### 4.1 Docs

- Put the docs in `docs/design-system/`:
  - `README.md`: the index and the 10 to 15 hard rules.
  - `tokens.md`.
  - `components/*.md`, one file per component.
  - `patterns/*.md`, one file per pattern.
- Golden reference files are better than prose. Each pattern points to one real file.

### 4.2 Manifest

Yes, we need a manifest. It is a small YAML or JSON file with one entry per component and pattern:

```yaml
- name: KnListBox
  kind: component
  status: deprecated
  replacement: q-list in a q-drawer (pattern manager-list-detail)
  doNotCopyFrom: [src/modules/managers/dashboardThemeManagement/DashboardThemeManagement.vue]
- name: manager-list-detail
  kind: pattern
  status: stable
  reference: src/modules/managers/aiManagement/AiManagement.vue
  doc: docs/design-system/patterns/manager-list-detail.md
```

- **The main value is the deprecation map.** It maps each PrimeVue part to its Quasar replacement. Examples: `Toolbar`, `KnListBox`, `Button`, `InputText`, `Message`, the `p-*` grid classes, `$confirm`.
- Tools can also read the manifest later, for example a lint rule or a check before review.

### 4.3 Entry point for agents

- Add an `AGENTS.md` at the repo root. It has one short rule: "For UI work, read `docs/design-system/README.md` first." `AGENTS.md` works for any agent tool, not only Claude Code.
- Optional: a project skill that loads the design-system docs only for UI tasks. This keeps the docs out of the context for other tasks.
- The docs and `AGENTS.md` go into the repo, so the whole team gets them.

### 4.4 Live gallery

- A dev-only route renders every component and pattern with the current theme.
- Agents and developers check new work against it.
- Later, the gallery can be the preview of the Knowage themes manager. We build it once and use it twice.

## 5. Process

1. **Start small.** Extract from the reference pages first: the tokens, the list-and-detail pattern and the deprecation map.
2. **Grow with each redesign.** The dashboard theme manager adds the canvas editor and the style accordion card.
3. **Definition of done.** A redesign PR updates the design-system docs and the manifest.
4. **Fix inconsistencies when you document them.** For example, choose one drawer width.

## 6. Future: Knowage themes after the Quasar port

- After the port from PrimeVue to Quasar, a Knowage theme can edit much more of the UI.
- A theme becomes a token set with three levels, as in the theme systems of Quasar, Vuetify and MUI:
  1. **Brand:** primary, secondary, accent, the fonts.
  2. **Semantic:** surface, border, text, success, warning, error.
  3. **Component:** toolbar, card, list item, input, button, hint.
- The Knowage themes manager then edits these levels. It uses the same canvas editor pattern as the dashboard theme manager, with the gallery as its canvas.
- Plan this after the dashboard theme spec. See `docs/specs/dashboard-theme-redesign/spec.md`.

## 7. Open questions

1. YAML or JSON for the manifest?
2. A project skill in addition to `AGENTS.md`, or `AGENTS.md` only?
3. Who approves a new pattern or component?
4. Which drawer width is the standard: 300 px or 400 px?
5. Does the gallery route ship in production builds behind a permission, or only in development?
