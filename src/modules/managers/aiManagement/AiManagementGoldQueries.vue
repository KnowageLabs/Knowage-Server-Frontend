<template>
    <div class="gq column no-wrap">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-btn flat round dense :icon="drawerVisible ? 'menu_open' : 'menu'" @click="$emit('toggleDrawer')">
                <q-tooltip :delay="500">{{ $t('common.toggle') }}</q-tooltip>
            </q-btn>
            <q-toolbar-title>{{ businessModel.name }}</q-toolbar-title>
            <q-btn flat round dense icon="save" :disable="!dirty || saving" @click="save">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="cancel" @click="$emit('close')">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
            </q-btn>
        </q-toolbar>
        <q-linear-progress v-if="saving" indeterminate color="primary" />

        <div class="gq__body row no-wrap col">
            <AiManagementSchemaBrowser v-show="schemaVisible" class="gq__schema" :structure="structure" :loading="loadingStructure" />

            <div class="col column no-wrap gq__main">
                <div class="gq__bar row items-center no-wrap">
                    <q-btn flat round dense size="sm" :icon="schemaVisible ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'" @click="schemaVisible = !schemaVisible">
                        <q-tooltip :delay="500">{{ $t('managers.ai.goldQueries.tablesColumns') }}</q-tooltip>
                    </q-btn>
                    <span class="ai-section-label q-ml-sm">{{ $t('managers.ai.goldQueries.queriesCount', queries.length) }}</span>
                </div>

                <q-scroll-area class="col">
                    <div class="gq__container">
                        <q-card v-if="queries.length > 0">
                            <q-list separator>
                                <div
                                    v-for="(query, idx) in queries"
                                    :key="query.uid"
                                    :class="{ 'gq__item--drop': dragOverIndex === idx }"
                                    @dragover.prevent="onDragOver(idx, $event)"
                                    @dragleave="onDragLeave(idx, $event)"
                                    @drop.prevent="onDrop(idx, $event)"
                                >
                                    <q-expansion-item :model-value="openIndex === idx" hide-expand-icon header-class="gq__item-header" @update:model-value="(open) => (openIndex = open ? idx : null)">
                                        <template #header>
                                            <q-item-section avatar class="gq__index">
                                                <span>{{ idx + 1 }}</span>
                                            </q-item-section>
                                            <q-item-section>
                                                <span class="ellipsis" :class="{ 'gq__untitled': !query.NL }">{{ query.NL || $t('managers.ai.goldQueries.newQuery') }}</span>
                                            </q-item-section>
                                            <q-item-section side>
                                                <div class="row no-wrap items-center gq__counts">
                                                    <span v-if="query.tables.length" class="gq__count"><q-icon name="table_chart" size="14px" />{{ query.tables.length }}</span>
                                                    <span v-if="query.columns.length" class="gq__count"><q-icon name="view_column" size="14px" />{{ query.columns.length }}</span>
                                                    <q-btn flat round dense size="sm" icon="delete" @click.stop="removeQuery(idx)">
                                                        <q-tooltip :delay="500">{{ $t('managers.ai.goldQueries.deleteQuery') }}</q-tooltip>
                                                    </q-btn>
                                                    <q-icon :name="openIndex === idx ? 'expand_less' : 'expand_more'" size="20px" color="grey-7" />
                                                </div>
                                            </q-item-section>
                                        </template>

                                        <div v-if="openIndex === idx" class="gq__item-body">
                                            <q-input v-model="query.NL" outlined dense autogrow hide-bottom-space :label="$t('managers.ai.goldQueries.naturalLanguage')" :placeholder="$t('managers.ai.goldQueries.naturalLanguagePlaceholder')" />

                                            <div>
                                                <div class="gq__field-label">SQL</div>
                                                <div class="gq__sql">
                                                    <knMonaco v-model="query.SQL" language="sql" :options="monacoOptions" style="height: 100%" @editor-setup="onEditorSetup" />
                                                </div>
                                            </div>

                                            <q-select
                                                v-model="query.tables"
                                                :options="tableOptions"
                                                :label="$t('managers.ai.goldQueries.tables')"
                                                multiple
                                                use-chips
                                                use-input
                                                input-debounce="0"
                                                outlined
                                                dense
                                                hide-bottom-space
                                                @filter="(val, update) => filterOptions(val, update, 'tables')"
                                                @update:model-value="onTablesChange(query)"
                                            />
                                            <q-select
                                                v-model="query.columns"
                                                :options="columnOptions"
                                                :label="$t('managers.ai.goldQueries.columns')"
                                                multiple
                                                use-chips
                                                use-input
                                                input-debounce="0"
                                                outlined
                                                dense
                                                hide-bottom-space
                                                @filter="(val, update) => filterOptions(val, update, 'columns', query)"
                                            />
                                        </div>
                                    </q-expansion-item>
                                </div>
                            </q-list>
                        </q-card>
                        <div v-else class="gq__empty column items-center">
                            <q-icon name="inbox" size="2.5rem" color="grey-5" class="q-mb-sm" />
                            <span>{{ $t('managers.ai.goldQueries.noQueries') }}</span>
                        </div>

                        <button type="button" class="gq__add" @click="addQuery">
                            <q-icon name="add_circle_outline" size="18px" />
                            <span>{{ $t('managers.ai.goldQueries.addQuery') }}</span>
                        </button>
                    </div>
                </q-scroll-area>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import AiManagementSchemaBrowser from './AiManagementSchemaBrowser.vue'
import { getColumns, readSchemaDragItem } from './aiManagementHelpers'
import type { iBusinessModel } from '@/modules/managers/businessModelCatalogue/BusinessModelCatalogue'
import type { IGoldQuery } from './AiManagement'

// A stable key for v-for; it is removed before saving.
type IEditableGoldQuery = IGoldQuery & { uid: string }

const props = defineProps<{ businessModel: iBusinessModel; goldQueries: IGoldQuery[]; drawerVisible: boolean }>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'saved', queries: IGoldQuery[]): void
    (e: 'dirtyChange', dirty: boolean): void
    (e: 'toggleDrawer'): void
}>()

const store = mainStore()
const { t } = useI18n()

const queries = ref<IEditableGoldQuery[]>(props.goldQueries.map((q) => ({ NL: q.NL ?? '', SQL: q.SQL ?? '', tables: [...(q.tables ?? [])], columns: [...(q.columns ?? [])], uid: crypto.randomUUID() })))
const openIndex = ref<number | null>(queries.value.length > 0 ? 0 : null)
const dirty = ref(false)
const saving = ref(false)
const schemaVisible = ref(true)
const dragOverIndex = ref<number | null>(null)

watch(
    queries,
    () => {
        dirty.value = true
    },
    { deep: true }
)
watch(dirty, (value) => emit('dirtyChange', value))

// ── Datasource structure ──────────────────────────────────

const structure = ref<Record<string, any>>({})
const loadingStructure = ref(false)

async function loadStructure() {
    if (!props.businessModel?.dataSourceId) return
    loadingStructure.value = true
    const params: Record<string, string> = {}
    if (props.businessModel.tablePrefixLike) params.tablePrefixLike = props.businessModel.tablePrefixLike
    if (props.businessModel.tablePrefixNotLike) params.tablePrefixNotLike = props.businessModel.tablePrefixNotLike
    try {
        const response = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasources/structure/${props.businessModel.dataSourceId}`, { params })
        structure.value = response.data || {}
    } catch {
        structure.value = {}
    } finally {
        loadingStructure.value = false
    }
}

const allTables = computed(() => Object.keys(structure.value))

function columnsOf(tables: string[]): string[] {
    return tables.flatMap((table) => getColumns(structure.value[table]).map((column) => `${table}.${column}`))
}

// ── Queries ───────────────────────────────────────────────

function addQuery() {
    queries.value.push({ NL: '', SQL: '', tables: [], columns: [], uid: crypto.randomUUID() })
    openIndex.value = queries.value.length - 1
}

function removeQuery(idx: number) {
    queries.value.splice(idx, 1)
    if (openIndex.value === null) return
    if (openIndex.value === idx) openIndex.value = null
    else if (openIndex.value > idx) openIndex.value--
}

// Columns of tables that are no longer selected are removed.
function onTablesChange(query: IEditableGoldQuery) {
    if (query.tables.length) query.columns = query.columns.filter((column) => query.tables.some((table) => column.startsWith(table + '.')))
}

const tableOptions = ref<string[]>([])
const columnOptions = ref<string[]>([])

// Without selected tables, the columns of all tables are offered.
function filterOptions(value: string, update: (fn: () => void) => void, kind: 'tables' | 'columns', query?: IEditableGoldQuery) {
    update(() => {
        const term = value.toLowerCase()
        const source = kind === 'tables' ? allTables.value : columnsOf(query?.tables.length ? query.tables : allTables.value)
        const filtered = term ? source.filter((option) => option.toLowerCase().includes(term)) : source
        if (kind === 'tables') tableOptions.value = filtered
        else columnOptions.value = filtered
    })
}

// ── Drag and drop from the schema browser ─────────────────

function onDragOver(idx: number, event: DragEvent) {
    dragOverIndex.value = idx
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onDragLeave(idx: number, event: DragEvent) {
    const current = event.currentTarget as HTMLElement | null
    const related = event.relatedTarget as Node | null
    if (current && related && current.contains(related)) return
    if (dragOverIndex.value === idx) dragOverIndex.value = null
}

function onDrop(idx: number, event: DragEvent) {
    dragOverIndex.value = null
    const item = readSchemaDragItem(event)
    if (!item) return
    const query = queries.value[idx]
    openIndex.value = idx
    if (!query.tables.includes(item.table)) query.tables.push(item.table)
    if (item.type === 'column' && !query.columns.includes(item.value)) query.columns.push(item.value)
}

// ── SQL editor completion ─────────────────────────────────

const monacoOptions = { minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: 'on' as const }
let completionProvider: { dispose: () => void } | null = null

// One provider for the whole view: Monaco providers are global per language.
function onEditorSetup({ monaco }: { editor: any; monaco: any }) {
    if (completionProvider) return
    completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '.', ','],
        provideCompletionItems: (model: any, position: any) => buildSqlCompletions(monaco, model, position)
    })
}

// Selected tables and columns of the open query come first (★), then everything else in the datasource.
function buildSqlCompletions(monaco: any, model: any, position: any) {
    const word = model.getWordUntilPosition(position)
    const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn }
    const textBefore = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column })
    const dotMatch = textBefore.match(/(\w+)\.\s*$/)
    const active = openIndex.value !== null ? queries.value[openIndex.value] : null
    const selectedTables = active?.tables ?? []
    const selectedColumns = active?.columns ?? []
    const { Class, Field } = monaco.languages.CompletionItemKind
    const suggestions: any[] = []

    if (dotMatch) {
        const table = dotMatch[1]
        getColumns(structure.value[table]).forEach((column) => {
            const selected = selectedColumns.includes(`${table}.${column}`)
            suggestions.push({ label: column, kind: Field, insertText: column, range, sortText: `${selected ? 0 : 1}${column}`, detail: table + (selected ? ' ★' : '') })
        })
        return { suggestions }
    }

    selectedTables.forEach((table) => suggestions.push({ label: table, kind: Class, insertText: table, range, sortText: `0${table}`, detail: '★ table' }))
    selectedColumns.forEach((column) => {
        const [table, name] = column.split('.')
        suggestions.push({ label: column, kind: Field, insertText: name ?? column, range, sortText: `1${column}`, detail: `★ ${table}` })
    })
    allTables.value.forEach((table) => {
        if (!selectedTables.includes(table)) suggestions.push({ label: table, kind: Class, insertText: table, range, sortText: `2${table}`, detail: 'table' })
        getColumns(structure.value[table]).forEach((column) => {
            if (!selectedColumns.includes(`${table}.${column}`)) suggestions.push({ label: `${table}.${column}`, kind: Field, insertText: column, range, sortText: `3${table}.${column}`, detail: table })
        })
    })
    return { suggestions }
}

// ── Save ──────────────────────────────────────────────────

async function save() {
    saving.value = true
    const cleaned: IGoldQuery[] = queries.value.map(({ NL, SQL, tables, columns }) => ({ NL, SQL, tables, columns }))
    const modelId = String(props.businessModel.id)
    try {
        await axios.put(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/eng-gpt-data/${modelId}`, { modelId, jsonContent: JSON.stringify({ sql_gold: cleaned }) })
        dirty.value = false
        store.setInfo({ title: t('common.toast.updateTitle'), msg: t('common.toast.updateSuccess') })
        emit('saved', cleaned)
    } catch (e: any) {
        store.setError({ title: t('common.error.generic'), msg: e?.message || t('common.error.generic') })
    } finally {
        saving.value = false
    }
}

onMounted(loadStructure)

onBeforeUnmount(() => completionProvider?.dispose())
</script>

<style scoped lang="scss">
.gq {
    height: 100%;
    min-height: 0;
}

.gq__body {
    min-height: 0;
}

.gq__schema {
    width: 260px;
    flex-shrink: 0;
    border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.gq__main {
    min-width: 0;
    background-color: #f3f3f3;
}

.gq__bar {
    min-height: 40px;
    padding: 0 8px;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.ai-section-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.gq__container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

:deep(.gq__item-header) {
    min-height: 48px;
}

.gq__item--drop {
    box-shadow: inset 0 0 0 2px var(--q-primary);
}

.gq__index {
    min-width: 36px;

    span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--kn-toolbar-primary-background-color);
        color: var(--kn-toolbar-primary-color);
        font-size: 0.75rem;
        font-weight: 600;
    }
}

.gq__untitled {
    font-style: italic;
    color: rgba(0, 0, 0, 0.45);
}

.gq__counts {
    gap: 4px;
}

.gq__count {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.06);
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);
}

.gq__item-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 16px 16px;
}

.gq__field-label {
    margin-bottom: 4px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);
}

.gq__sql {
    height: 180px;
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 4px;
    overflow: hidden;
}

.gq__empty {
    padding: 32px 16px;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.54);
}

.gq__add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    background: transparent;
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.85rem;
    cursor: pointer;

    &:hover {
        border-color: var(--q-primary);
        color: var(--q-primary);
    }
}

@media (max-width: 768px) {
    .gq__schema {
        display: none;
    }
}
</style>
