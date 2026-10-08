<template>
    <div class="kn-drawer-list">
        <slot name="header"></slot>
        <q-input v-if="searchable" :model-value="search" :placeholder="searchPlaceholder ?? $t('common.search')" dense borderless clearable class="kn-drawer-list__search q-px-sm" @update:model-value="onSearchInput">
            <template #prepend>
                <q-icon name="search" size="16px" />
            </template>
            <template v-if="$slots['search-append']" #append>
                <slot name="search-append"></slot>
            </template>
        </q-input>
        <q-list class="kn-drawer-list__items" role="listbox">
            <q-item
                v-for="(item, index) in items"
                :key="getKey(item, index)"
                class="kn-drawer-list__item"
                :class="{ 'kn-drawer-list__item--active': isActive(item, index), 'kn-drawer-list__item--draggable': draggable }"
                clickable
                manual-focus
                :disable="!!item.disabled"
                role="option"
                :aria-selected="isActive(item, index)"
                :draggable="draggable"
                data-test="list-item"
                @click="emit('itemClick', item, index)"
                @dragstart="emit('itemDragstart', $event, item, index)"
                @dragend="emit('itemDragend', $event, item, index)"
                @drop="onDrop($event, item, index)"
                @dragover="onDragOver"
                @dragenter="onDragOver"
            >
                <div v-if="$slots.leading" class="kn-drawer-list__leading">
                    <slot name="leading" :item="item" :index="index"></slot>
                </div>
                <div class="kn-drawer-list__label">
                    <slot name="label" :item="item" :index="index"></slot>
                </div>
                <slot name="trailing" :item="item" :index="index"></slot>
            </q-item>
            <div v-if="items.length === 0" class="kn-drawer-list__empty">
                <slot name="empty">{{ $t('common.info.noDataFound') }}</slot>
            </div>
        </q-list>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        items: any[]
        itemKey?: string
        activeKey?: string | number | null
        searchable?: boolean
        search?: string
        searchPlaceholder?: string
        draggable?: boolean
    }>(),
    { itemKey: undefined, activeKey: null, searchable: true, search: '', searchPlaceholder: undefined, draggable: false }
)

const emit = defineEmits<{
    (e: 'itemClick', item: any, index: number): void
    (e: 'itemDragstart', event: DragEvent, item: any, index: number): void
    (e: 'itemDragend', event: DragEvent, item: any, index: number): void
    (e: 'itemDrop', event: DragEvent, item: any, index: number): void
    (e: 'update:search', value: string): void
}>()

function getKey(item: any, index: number): string | number {
    return props.itemKey ? item[props.itemKey] : index
}

function isActive(item: any, index: number): boolean {
    return props.activeKey !== null && props.activeKey !== undefined && getKey(item, index) === props.activeKey
}

// Rows accept drops only when the list is draggable (the map layers list reorders by drop).
function onDragOver(event: DragEvent) {
    if (props.draggable) event.preventDefault()
}

function onDrop(event: DragEvent, item: any, index: number) {
    if (!props.draggable) return
    // Firefox inserts dropped text into inputs unless the default action is cancelled
    event.preventDefault()
    event.stopPropagation()
    emit('itemDrop', event, item, index)
}

function onSearchInput(value: string | number | null) {
    emit('update:search', (value ?? '') as string)
}
</script>

<style lang="scss" scoped>
.kn-drawer-list {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    color: rgba(0, 0, 0, 0.87);
}

.kn-drawer-list__search {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.kn-drawer-list__item {
    box-sizing: border-box;
    height: 30px;
    min-height: 30px;
    padding: 0 0.75rem;
    border-bottom: 1px solid var(--kn-list-border-color);
    font-size: 1rem;
    line-height: 1.5rem;
    align-items: center;
    cursor: pointer;
    user-select: none;

    &:hover {
        background-color: var(--kn-editor-list-hover-background);
    }

    &--active,
    &--active:hover {
        background-color: var(--kn-editor-list-selected-background);
    }

    &--draggable {
        cursor: grab;
    }

    &.disabled:hover {
        background-color: transparent;
    }
}

.kn-drawer-list__leading {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
}

.kn-drawer-list__label {
    flex: 1;
    min-width: 0;
    margin-left: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.kn-drawer-list__empty {
    padding: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
}
</style>
