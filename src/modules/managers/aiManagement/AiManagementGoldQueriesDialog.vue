<template>
    <Dialog :visible="true" :modal="true" :closable="false" class="p-fluid kn-dialog--toolbar--primary gold-queries-dialog" :header="$t('managers.ai.goldQueries.title', { name: businessModel.name })" :style="{ width: '90vw', maxWidth: '1300px' }">
        <div class="gold-queries-layout">
            <!-- Left sidebar: Tables & Columns browser -->
            <transition name="slide-sidebar">
                <div v-show="sidebarVisible" class="gold-queries-sidebar">
                    <div class="sidebar-header">
                        <span class="sidebar-title">
                            <i class="pi pi-database p-mr-1" />
                            {{ $t('managers.ai.goldQueries.tablesColumns') }}
                        </span>
                        <ProgressSpinner v-if="loadingStructure" style="width: 16px; height: 16px" stroke-width="5" />
                    </div>
                    <span class="p-input-icon-left sidebar-search">
                        <i class="pi pi-search" />
                        <InputText v-model="treeFilter" class="kn-material-input p-inputtext-sm" :placeholder="$t('common.search')" />
                    </span>
                    <div class="sidebar-tree">
                        <div v-for="(tableDef, tableName) in filteredStructure" :key="tableName" class="tree-table-block">
                            <div class="tree-table-row" @click="toggleTable(String(tableName))">
                                <i :class="expandedTables[String(tableName)] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="tree-arrow" />
                                <i class="pi pi-table tree-table-icon" />
                                <span class="tree-label">{{ tableName }}</span>
                            </div>
                            <div v-if="expandedTables[String(tableName)]" class="tree-columns">
                                <div v-for="col in getColumns(tableDef)" :key="col" class="tree-col-row">
                                    <i class="pi pi-minus tree-col-icon" />
                                    <span class="tree-col-label">{{ col }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="!loadingStructure && Object.keys(filteredStructure).length === 0" class="sidebar-empty">
                            {{ $t('common.noDataFound') }}
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Main content: query list -->
            <div class="gold-queries-main">
                <div class="queries-toolbar">
                    <Button
                        :icon="sidebarVisible ? 'pi pi-angle-double-left' : 'pi pi-angle-double-right'"
                        class="p-button-text p-button-sm sidebar-toggle-btn"
                        :title="sidebarVisible ? $t('common.hide') : $t('managers.ai.goldQueries.tablesColumns')"
                        @click="sidebarVisible = !sidebarVisible"
                    />
                    <span class="queries-count">
                        <i class="pi pi-list p-mr-1" />
                        {{ queries.length }} {{ $t('managers.ai.goldQueries.queries') }}
                    </span>
                </div>

                <div class="queries-list">
                    <div v-if="queries.length === 0" class="queries-empty">
                        <i class="pi pi-inbox empty-icon" />
                        <p>{{ $t('managers.ai.goldQueries.noQueries') }}</p>
                    </div>

                    <div v-for="(query, idx) in queries" :key="idx" class="query-item" :class="{ 'query-item--open': openIndex === idx }">
                        <!-- Accordion header -->
                        <div class="query-item-header" @click="toggleAccordion(idx)">
                            <div class="query-header-left">
                                <span class="query-index">{{ idx + 1 }}</span>
                                <i :class="openIndex === idx ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="query-chevron" />
                                <span class="query-nl-preview">{{ query.NL || $t('managers.ai.goldQueries.newQuery') }}</span>
                            </div>
                            <div class="query-header-right">
                                <span v-if="query.tables.length" class="query-chips-preview">
                                    <i class="pi pi-table p-mr-1" />{{ query.tables.length }}
                                </span>
                                <span v-if="query.columns.length" class="query-chips-preview">
                                    <i class="pi pi-bars p-mr-1" />{{ query.columns.length }}
                                </span>
                                <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm query-delete-btn" @click.stop="removeQuery(idx)" />
                            </div>
                        </div>

                        <!-- Accordion body -->
                        <div v-if="openIndex === idx" class="query-item-body">
                            <!-- NL -->
                            <div class="query-field">
                                <label class="query-field-label">
                                    <i class="pi pi-comment p-mr-1" />
                                    {{ $t('managers.ai.goldQueries.naturalLanguage') }}
                                </label>
                                <Textarea v-model="query.NL" :auto-resize="false" rows="2" class="kn-material-input query-nl-input" :placeholder="$t('managers.ai.goldQueries.naturalLanguagePlaceholder')" />
                            </div>

                            <!-- SQL -->
                            <div class="query-field">
                                <label class="query-field-label">
                                    <i class="pi pi-code p-mr-1" />
                                    SQL
                                </label>
                                <div class="query-sql-editor">
                                    <knMonaco v-model="query.SQL" language="sql" :options="monacoOptions" style="height: 100%" @editorSetup="onEditorSetup" />
                                </div>
                            </div>

                            <!-- Tables chips -->
                            <div class="query-field query-field--inline">
                                <label class="query-field-label query-field-label--inline">
                                    <i class="pi pi-table p-mr-1" />
                                    {{ $t('managers.ai.goldQueries.tables') }}
                                </label>
                                <div class="chips-area">
                                    <Chip v-for="t in query.tables" :key="t" :label="t" removable class="query-chip query-chip--table" @remove="removeTable(idx, t)" />
                                    <MultiSelect
                                        v-model="query.tables"
                                        :options="tableOptions"
                                        :placeholder="$t('managers.ai.goldQueries.addTables')"
                                        :filter="true"
                                        display="chip"
                                        class="chips-multiselect"
                                        append-to="body"
                                        panel-class="gold-queries-multiselect-panel"
                                        @change="onTablesChange(idx, $event)"
                                    >
                                        <template #value>
                                            <span class="chips-add-label">
                                                <i class="pi pi-plus-circle p-mr-1" />{{ $t('managers.ai.goldQueries.addTables') }}
                                            </span>
                                        </template>
                                    </MultiSelect>
                                </div>
                            </div>

                            <!-- Columns chips -->
                            <div class="query-field query-field--inline">
                                <label class="query-field-label query-field-label--inline">
                                    <i class="pi pi-bars p-mr-1" />
                                    {{ $t('managers.ai.goldQueries.columns') }}
                                </label>
                                <div class="chips-area">
                                    <Chip v-for="c in query.columns" :key="c" :label="c" removable class="query-chip query-chip--column" @remove="removeColumn(idx, c)" />
                                    <MultiSelect
                                        v-model="query.columns"
                                       :options="getColumnOptionsForQuery(query)"
                                        :placeholder="$t('managers.ai.goldQueries.addColumns')"
                                        :filter="true"
                                        display="chip"
                                        class="chips-multiselect"
                                        append-to="body"
                                        panel-class="gold-queries-multiselect-panel"
                                        @change="onColumnsChange(idx, $event)"
                                    >
                                        <template #value>
                                            <span class="chips-add-label">
                                                <i class="pi pi-plus-circle p-mr-1" />{{ $t('managers.ai.goldQueries.addColumns') }}
                                            </span>
                                        </template>
                                    </MultiSelect>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Add query row (always at bottom) -->
                    <button class="query-add-row" @click="addQuery">
                        <i class="pi pi-plus-circle query-add-row-icon" />
                        <span>{{ $t('managers.ai.goldQueries.addQuery') }}</span>
                    </button>
                </div>
            </div>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--secondary" :label="$t('common.close')" @click="$emit('close')" />
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" :disabled="saving" :loading="saving" @click="handleSave" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Chip from 'primevue/chip'
import MultiSelect from 'primevue/multiselect'
import ProgressSpinner from 'primevue/progressspinner'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import { iBusinessModel } from '@/modules/managers/businessModelCatalogue/BusinessModelCatalogue'
import { IGoldQuery } from './AiManagement'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'ai-management-gold-queries-dialog',
    components: { Dialog, Button, InputText, Textarea, Chip, MultiSelect, ProgressSpinner, knMonaco },
    props: {
        businessModel: { type: Object as PropType<iBusinessModel>, required: true },
        goldQueries: { type: Array as PropType<IGoldQuery[]>, required: true }
    },
    emits: ['close', 'saved'],
    setup() {
        return { store: mainStore() }
    },
    data() {
        return {
            queries: [] as IGoldQuery[],
            datasourceStructure: {} as Record<string, any>,
            expandedTables: {} as Record<string, boolean>,
            treeFilter: '' as string,
            loadingStructure: false,
            saving: false,
            sidebarVisible: true,
            openIndex: 0 as number | null,
            monacoOptions: { minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: 'on' as const },
            completionProviderDisposable: null as any
        }
    },
    computed: {
        filteredStructure(): Record<string, any> {
            if (!this.treeFilter) return this.datasourceStructure
            const f = this.treeFilter.toLowerCase()
            const result: Record<string, any> = {}
            for (const [tableName, tableDef] of Object.entries(this.datasourceStructure)) {
                if (tableName.toLowerCase().includes(f)) {
                    result[tableName] = tableDef
                } else {
                    const hasCols = this.getColumns(tableDef).some((c) => c.toLowerCase().includes(f))
                    if (hasCols) result[tableName] = tableDef
                }
            }
            return result
        },
        tableOptions(): string[] {
            return Object.keys(this.datasourceStructure)
        },
        columnOptions(): string[] {
            const cols: string[] = []
            for (const [tableName, tableDef] of Object.entries(this.datasourceStructure)) {
                this.getColumns(tableDef).forEach((c) => cols.push(`${tableName}.${c}`))
            }
            return cols
        }
    },
    async mounted() {
        const initial: IGoldQuery[] = JSON.parse(JSON.stringify(this.goldQueries))
        // Mutate the reactive array instead of replacing it, to preserve Vue 3 reactivity
        this.queries.splice(0, this.queries.length, ...initial)
        if (this.queries.length > 0) this.openIndex = 0
        await this.loadDatasourceStructure()
    },
    beforeUnmount() {
        if (this.completionProviderDisposable) {
            this.completionProviderDisposable.dispose()
            this.completionProviderDisposable = null
        }
    },
    methods: {
        async loadDatasourceStructure() {
            if (!this.businessModel?.dataSourceId) return
            this.loadingStructure = true
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasources/structure/${this.businessModel.dataSourceId}`
            const params: Record<string, string> = {}
            if (this.businessModel.tablePrefixLike) params.tablePrefixLike = this.businessModel.tablePrefixLike
            if (this.businessModel.tablePrefixNotLike) params.tablePrefixNotLike = this.businessModel.tablePrefixNotLike
            await this.$http
                .get(url, { params })
                .then((r: AxiosResponse<any>) => { this.datasourceStructure = r.data || {} })
                .catch(() => { this.datasourceStructure = {} })
                .finally(() => { this.loadingStructure = false })
        },
        getColumns(tableDef: any): string[] {
            if (!tableDef) return []
            if (Array.isArray(tableDef)) return tableDef.map((c: any) => (typeof c === 'string' ? c : c.name || c.columnName || String(c)))
            if (typeof tableDef === 'object') {
                const key = Object.keys(tableDef).find((k) => ['columns', 'fields', 'attributes', 'cols'].includes(k.toLowerCase()))
                if (key && Array.isArray(tableDef[key])) return tableDef[key].map((c: any) => (typeof c === 'string' ? c : c.name || c.columnName || String(c)))
                return Object.keys(tableDef)
            }
            return []
        },
        toggleTable(name: string) {
            this.expandedTables[name] = !this.expandedTables[name]
        },
        toggleAccordion(idx: number) {
            this.openIndex = this.openIndex === idx ? null : idx
        },
        addQuery() {
            this.queries.push({ NL: '', SQL: '', tables: [], columns: [] })
            this.openIndex = this.queries.length - 1
        },
        removeQuery(idx: number) {
            this.queries.splice(idx, 1)
            if (this.openIndex !== null) {
                if (this.openIndex >= this.queries.length) this.openIndex = this.queries.length - 1
            }
        },
        removeTable(idx: number, table: string) {
            this.queries[idx].tables = this.queries[idx].tables.filter((t) => t !== table)
        },
        removeColumn(idx: number, col: string) {
            this.queries[idx].columns = this.queries[idx].columns.filter((c) => c !== col)
        },
        onTablesChange(idx: number, event: any) {
            this.queries[idx].tables = event.value || []
            // Remove columns that no longer belong to any selected table
            const selectedTables = this.queries[idx].tables
            if (selectedTables.length) {
                this.queries[idx].columns = this.queries[idx].columns.filter((c) => selectedTables.some((t) => c.startsWith(t + '.')))
            }
        },
        onColumnsChange(idx: number, event: any) {
            this.queries[idx].columns = event.value || []
        },
        getColumnOptionsForQuery(query: IGoldQuery): string[] {
            // If tables are selected, show only columns from those tables; else show all
            if (!query.tables.length) return this.columnOptions
            const cols: string[] = []
            for (const tableName of query.tables) {
                const tableDef = this.datasourceStructure[tableName]
                if (tableDef) this.getColumns(tableDef).forEach((c) => cols.push(`${tableName}.${c}`))
            }
            return cols
        },
        onEditorSetup({ monaco }: { editor: any; monaco: any }) {
            // Register a single SQL completion provider for the lifetime of this dialog
            if (this.completionProviderDisposable) return
            this.completionProviderDisposable = monaco.languages.registerCompletionItemProvider('sql', {
                triggerCharacters: [' ', '.', ','],
                provideCompletionItems: (model: any, position: any) => this.buildSqlCompletions(monaco, model, position)
            })
        },
        buildSqlCompletions(monaco: any, model: any, position: any) {
            const word = model.getWordUntilPosition(position)
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            }

            // Detect "tableName." pattern → suggest only that table's columns
            const textBefore = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column })
            const dotMatch = textBefore.match(/(\w+)\.\s*$/)

            const activeQuery = this.openIndex !== null ? this.queries[this.openIndex] : null
            const selectedTables: string[] = activeQuery?.tables ?? []
            const selectedColumns: string[] = activeQuery?.columns ?? []

            const suggestions: any[] = []

            if (dotMatch) {
                // After "tableName." → suggest columns of that table, starred if selected
                const tableName = dotMatch[1]
                const tableDef = this.datasourceStructure[tableName]
                if (tableDef) {
                    this.getColumns(tableDef).forEach((col: string) => {
                        const isSelected = selectedColumns.includes(`${tableName}.${col}`)
                        suggestions.push({
                            label: col,
                            kind: monaco.languages.CompletionItemKind.Field,
                            insertText: col,
                            range,
                            sortText: isSelected ? `0${col}` : `1${col}`,
                            detail: tableName + (isSelected ? ' ★' : '')
                        })
                    })
                }
            } else {
                // Selected tables (highest priority, marked with ★)
                selectedTables.forEach((table: string) => {
                    suggestions.push({
                        label: table,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: table,
                        range,
                        sortText: `0${table}`,
                        detail: '★ selected table'
                    })
                })

                // Selected columns (high priority, marked with ★)
                selectedColumns.forEach((col: string) => {
                    const dotIdx = col.indexOf('.')
                    const colName = dotIdx >= 0 ? col.slice(dotIdx + 1) : col
                    const tablePart = dotIdx >= 0 ? col.slice(0, dotIdx) : ''
                    suggestions.push({
                        label: col,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: colName,
                        range,
                        sortText: `1${col}`,
                        detail: `★ ${tablePart}`
                    })
                })

                // All other tables from datasource structure
                Object.keys(this.datasourceStructure).forEach((tableName: string) => {
                    if (!selectedTables.includes(tableName)) {
                        suggestions.push({
                            label: tableName,
                            kind: monaco.languages.CompletionItemKind.Class,
                            insertText: tableName,
                            range,
                            sortText: `2${tableName}`,
                            detail: 'table'
                        })
                    }
                })

                // All other columns from datasource structure
                for (const [tableName, tableDef] of Object.entries(this.datasourceStructure)) {
                    this.getColumns(tableDef as any).forEach((col: string) => {
                        if (!selectedColumns.includes(`${tableName}.${col}`)) {
                            suggestions.push({
                                label: `${tableName}.${col}`,
                                kind: monaco.languages.CompletionItemKind.Field,
                                insertText: col,
                                range,
                                sortText: `3${tableName}.${col}`,
                                detail: tableName
                            })
                        }
                    })
                }
            }

            return { suggestions }
        },
        async handleSave() {
            this.saving = true
            const payload = {
                modelId: String(this.businessModel.id),
                jsonContent: JSON.stringify({ sql_gold: this.queries })
            }
            await this.$http
                .put(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/eng-gpt-data/${payload.modelId}`, payload)
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.toast.createTitle'), msg: this.$t('common.toast.success') })
                    this.$emit('saved', this.queries)
                })
                .catch((e: any) => {
                    this.store.setError({ title: this.$t('common.error.generic'), msg: e?.message || this.$t('common.error.generic') })
                })
                .finally(() => { this.saving = false })
        }
    }
})
</script>

<style scoped lang="scss">
.gold-queries-dialog {
    :deep(.p-dialog-content) {
        padding: 0;
        overflow: hidden;
    }
}

.gold-queries-layout {
    display: flex;
    height: 68vh;
    min-height: 480px;
    overflow: hidden;
}

/* ── Sidebar ─────────────────────────────── */
.gold-queries-sidebar {
    width: 220px;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    background: #f8f9fb;
    border-right: 1px solid #e0e4ea;
    overflow: hidden;
    flex-shrink: 0;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 12px 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sidebar-title {
    display: flex;
    align-items: center;
    flex: 1;
}

.sidebar-search {
    width: 100%;
    padding: 4px 8px 8px;
    :deep(.p-inputtext) {
        width: 100%;
        font-size: 0.8rem;
    }
}

.sidebar-tree {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
}

.tree-table-block {
    margin-bottom: 2px;
}

.tree-table-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 4px;
    &:hover {
        background: #e8edf5;
    }
}

.tree-arrow {
    font-size: 0.6rem;
    color: #888;
    width: 10px;
}

.tree-table-icon {
    font-size: 0.75rem;
    color: var(--kn-color-primary, #3b82f6);
}

.tree-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tree-columns {
    padding-left: 22px;
}

.tree-col-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 3px;
    margin: 0 4px;
}

.tree-col-icon {
    font-size: 0.55rem;
    color: #aaa;
}

.tree-col-label {
    font-size: 0.75rem;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sidebar-empty {
    padding: 16px 12px;
    font-size: 0.8rem;
    color: #aaa;
    text-align: center;
}

.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
    transition: width 0.2s ease, min-width 0.2s ease, opacity 0.2s ease;
}
.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
    width: 0 !important;
    min-width: 0 !important;
    opacity: 0;
}

/* ── Main queries panel ────────────────── */
.gold-queries-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.queries-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid #e0e4ea;
    background: #fff;
    flex-shrink: 0;
}

.sidebar-toggle-btn {
    :deep(.p-button-icon) {
        font-size: 0.9rem;
    }
}

.queries-count {
    font-size: 0.82rem;
    color: #888;
    display: flex;
    align-items: center;
}

.add-query-btn {
    font-size: 0.82rem;
}

.queries-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.queries-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: #aaa;
    .empty-icon {
        font-size: 2.5rem;
        color: #ddd;
    }
    p {
        font-size: 0.9rem;
        margin: 0;
    }
}

/* ── Query item (accordion) ─────────────── */
.query-item {
    border: 1px solid #e0e4ea;
    border-radius: 8px;
    overflow: auto;
    transition: box-shadow 0.15s ease;
    background: #fff;
    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    }
    &--open {
        border-color: var(--kn-color-primary, #3b82f6);
        box-shadow: 0 2px 12px rgba(59, 130, 246, 0.1);
    }
}

.query-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    cursor: pointer;
    background: #fafbfc;
    user-select: none;
    &:hover {
        background: #f0f4ff;
    }
    .query-item--open & {
        background: #eff4ff;
    }
}

.query-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
}

.query-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--kn-color-primary, #3b82f6);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
}

.query-chevron {
    font-size: 0.65rem;
    color: #888;
    flex-shrink: 0;
}

.query-nl-preview {
    font-size: 0.85rem;
    color: #444;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-style: italic;
}

.query-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.query-chips-preview {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #888;
    background: #e8edf5;
    border-radius: 10px;
    padding: 2px 8px;
}

.query-delete-btn {
    width: 1.8rem !important;
    height: 1.8rem !important;
    padding: 0 !important;
    :deep(.p-button-icon) {
        font-size: 0.75rem;
    }
}

.query-item-body {
    padding: 14px 16px;
    border-top: 1px solid #e8edf0;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* ── Query fields ───────────────────────── */
.query-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.query-field--inline {
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
}

.query-field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.query-field-label--inline {
    padding-top: 6px;
    width: 80px;
}

.query-nl-input {
    width: 100%;
    font-size: 0.88rem;
    resize: none;
}

.query-sql-editor {
    height: 160px;
    border: 1px solid #d0d5dd;
    border-radius: 4px;
    overflow: hidden;
}

/* ── Chips area ─────────────────────────── */
.chips-area {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    flex: 1;
}

.query-chip {
    font-size: 0.78rem;
    height: 24px;
    :deep(.p-chip-text) {
        font-size: 0.78rem;
        line-height: 1;
    }
    :deep(.p-chip-remove-icon) {
        font-size: 0.65rem;
    }
}

.query-chip--table {
    background: #dbeafe;
    color: #1d4ed8;
    :deep(.p-chip-remove-icon) {
        color: #1d4ed8;
    }
}

.query-chip--column {
    background: #dcfce7;
    color: #166534;
    :deep(.p-chip-remove-icon) {
        color: #166534;
    }
}

.chips-multiselect {
    border: 1px dashed #c0c8d8;
    border-radius: 14px;
    background: transparent;
    height: 26px;
    display: flex;
    align-items: center;
    cursor: pointer;
    :deep(.p-multiselect-label) {
        padding: 0 8px;
    }
    :deep(.p-multiselect-trigger) {
        display: none;
    }
    &:hover {
        border-color: var(--kn-color-primary, #3b82f6);
        background: #eff4ff;
    }
}

.chips-add-label {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #888;
    white-space: nowrap;
}

/* ── Add query row ──────────────────────── */
.query-add-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px;
    border: 2px dashed #d0d8e8;
    border-radius: 8px;
    background: transparent;
    color: #888;
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    &:hover {
        border-color: var(--kn-color-primary, #3b82f6);
        color: var(--kn-color-primary, #3b82f6);
        background: #eff4ff;
    }
}

.query-add-row-icon {
    font-size: 1rem;
}

/* ── Responsive ─────────────────────────── */
@media (max-width: 768px) {
    // Dialog: content must scroll when layout overflows
    .gold-queries-dialog {
        :deep(.p-dialog-content) {
            overflow-y: auto !important;
        }
    }

    // Layout: stack sidebar above query list
    .gold-queries-layout {
        flex-direction: column;
        height: auto;
        min-height: 0;
        overflow: visible;
        max-height: none;
    }

    // Sidebar: full width, fixed max-height, border at bottom
    .gold-queries-sidebar {
        width: 100%;
        min-width: 0;
        max-height: 200px;
        border-right: none;
        border-bottom: 1px solid #e0e4ea;
    }

    // Sidebar transition: fade-only (no width slide on mobile)
    .slide-sidebar-enter-active,
    .slide-sidebar-leave-active {
        transition: opacity 0.2s ease;
        width: 100% !important;
        min-width: 0 !important;
    }
    .slide-sidebar-enter-from,
    .slide-sidebar-leave-to {
        width: 100% !important;
        min-width: 0 !important;
        opacity: 0;
    }

    // Main panel: natural height, no overflow clipping
    .gold-queries-main {
        overflow: visible;
        height: auto;
    }

    // Queries list: let the dialog scroll instead
    .queries-list {
        overflow-y: visible;
        flex: none;
    }

    // Inline fields (Tables / Columns rows): stack vertically
    .query-field--inline {
        flex-direction: column;
        gap: 6px;
    }

    .query-field-label--inline {
        width: auto;
        padding-top: 0;
    }
}
</style>

