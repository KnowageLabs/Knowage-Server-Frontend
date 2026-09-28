<template>
    <div class="ai-schema column no-wrap">
        <div class="ai-schema__header row items-center no-wrap">
            <span class="ai-section-label col">{{ $t('managers.ai.goldQueries.tablesColumns') }}</span>
            <q-spinner v-if="loading" size="16px" color="grey-6" />
        </div>
        <div class="ai-schema__search">
            <q-input v-model="filter" outlined dense clearable :placeholder="$t('common.search')">
                <template #append><q-icon name="search" size="18px" /></template>
            </q-input>
        </div>

        <div class="ai-schema__tree col">
            <div v-for="table in filteredTables" :key="table.name">
                <div class="ai-schema__table row items-center no-wrap" draggable="true" @click="toggle(table.name)" @dragstart="onDragStart($event, { type: 'table', table: table.name, value: table.name })">
                    <q-icon :name="expanded[table.name] ? 'expand_more' : 'chevron_right'" size="18px" color="grey-7" />
                    <q-icon name="table_chart" size="16px" class="q-mx-xs ai-schema__table-icon" />
                    <span class="ellipsis" :title="table.name">{{ table.name }}</span>
                </div>
                <div v-if="expanded[table.name]" class="ai-schema__columns">
                    <div
                        v-for="column in table.columns"
                        :key="column"
                        class="ai-schema__column ellipsis"
                        draggable="true"
                        :title="`${table.name}.${column}`"
                        @dragstart="onDragStart($event, { type: 'column', table: table.name, value: `${table.name}.${column}` })"
                    >
                        {{ column }}
                    </div>
                </div>
            </div>
            <div v-if="!loading && filteredTables.length === 0" class="ai-schema__empty">{{ $t('common.info.noDataFound') }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getColumns, SCHEMA_DRAG_MIME, type ISchemaDragItem } from './aiManagementHelpers'

const props = defineProps<{ structure: Record<string, any>; loading: boolean }>()

const filter = ref<string | null>('')
const expanded = ref<Record<string, boolean>>({})

const tables = computed(() => Object.entries(props.structure).map(([name, def]) => ({ name, columns: getColumns(def) })))

// A table matches by its name or by any of its columns.
const filteredTables = computed(() => {
    const term = (filter.value ?? '').trim().toLowerCase()
    if (!term) return tables.value
    return tables.value.filter((table) => table.name.toLowerCase().includes(term) || table.columns.some((c) => c.toLowerCase().includes(term)))
})

function toggle(name: string) {
    expanded.value[name] = !expanded.value[name]
}

function onDragStart(event: DragEvent, item: ISchemaDragItem) {
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(SCHEMA_DRAG_MIME, JSON.stringify(item))
    event.dataTransfer.setData('text/plain', item.value)
}
</script>

<style scoped lang="scss">
.ai-schema {
    height: 100%;
    min-height: 0;
    background: #ffffff;
}

.ai-schema__header {
    min-height: 40px;
    padding: 0 12px;
}

.ai-section-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.ai-schema__search {
    padding: 0 8px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.ai-schema__tree {
    overflow-y: auto;
    padding: 4px 0;
    min-height: 0;
}

.ai-schema__table {
    padding: 4px 8px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: grab;

    &:hover {
        background: var(--kn-list-item-hover-background-color);
    }
}

.ai-schema__table-icon {
    color: rgba(0, 0, 0, 0.54);
}

.ai-schema__columns {
    padding-left: 44px;
}

.ai-schema__column {
    padding: 3px 8px 3px 0;
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
    cursor: grab;

    &:hover {
        color: rgba(0, 0, 0, 0.87);
    }
}

.ai-schema__empty {
    padding: 16px;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.45);
}
</style>
