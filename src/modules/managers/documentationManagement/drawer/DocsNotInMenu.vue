<template>
    <div class="docs-orphans column no-wrap" :class="{ 'docs-orphans--open': open }" data-tour-id="docs-orphans">
        <button type="button" class="docs-orphans__header row items-center no-wrap" :aria-expanded="open" @click="open = !open">
            <q-icon :name="open ? 'expand_more' : 'chevron_right'" size="18px" />
            <span class="docs-orphans__title">{{ $t('managers.documentationManagement.orphans.title') }}</span>
            <span v-if="!open && hasChanges" class="docs-orphans__dot" />
            <q-space />
            <span class="docs-orphans__count">{{ wc.orphans.value.length }}</span>
        </button>
        <!-- A scroll area has no height of its own: it gets the height of its rows, and the panel caps it at 38 % of the drawer. -->
        <q-scroll-area v-if="open" class="docs-orphans__body" :style="{ height: `${bodyHeight}px` }">
            <div v-if="!wc.orphans.value.length" class="docs-orphans__empty">{{ $t('managers.documentationManagement.orphans.empty') }}</div>
            <div v-for="path in wc.orphans.value" :key="path" class="docs-orphan-row" :class="{ 'docs-orphan-row--selected': path === selectedPath }" @click="emit('select', path)">
                <span class="docs-orphan-row__handle" draggable="true" @dragstart="onDragStart($event, path)" @dragend="endDocsDrag" @click.stop>
                    <q-icon name="drag_indicator" size="16px" />
                </span>
                <q-icon name="description" size="14px" class="docs-orphan-row__icon" />
                <span class="docs-orphan-row__name ellipsis" :class="{ 'docs-orphan-row__name--deleted': isDeleted(path) }">
                    {{ path }}
                    <q-tooltip :delay="700">{{ path }}</q-tooltip>
                </span>
                <q-btn v-if="!isDeleted(path)" flat round dense size="sm" icon="playlist_add" class="docs-orphan-row__add" @click.stop="emit('addToMenu', path)">
                    <q-tooltip :delay="500">{{ $t('managers.documentationManagement.orphan.addToMenu') }}</q-tooltip>
                </q-btn>
                <DocsLetter :letter="wc.letterOfFile(path)" />
            </div>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocs } from '../useDocsWorkingCopy'
import { endDocsDrag, startDocsDrag } from '../docsDrag'
import DocsLetter from './DocsLetter.vue'

defineProps<{ selectedPath: string | null }>()
const emit = defineEmits<{
    (e: 'select', path: string): void
    (e: 'addToMenu', path: string): void
}>()

const wc = useDocs()
const open = ref(true)

const isDeleted = (path: string) => wc.deletedPaths.value.includes(path)
const hasChanges = computed(() => wc.orphans.value.some((path) => wc.letterOfFile(path)))
const ROW_HEIGHT = 28
const bodyHeight = computed(() => (wc.orphans.value.length ? wc.orphans.value.length * ROW_HEIGHT + 4 : 36))

function onDragStart(event: DragEvent, path: string) {
    startDocsDrag(event, { kind: 'file', path }, (event.currentTarget as HTMLElement).closest('.docs-orphan-row') as HTMLElement)
}
</script>

<style lang="scss" scoped>
.docs-orphans {
    flex: 0 1 auto;
    min-height: 0;
    border-top: 1px solid var(--kn-color-borders);
}

.docs-orphans--open {
    max-height: 38%;
}

.docs-orphans__header {
    flex: none;
    height: 30px;
    padding: 0 8px;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
}

.docs-orphans__title {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.docs-orphans__dot {
    width: 6px;
    height: 6px;
    margin-left: 6px;
    border-radius: 50%;
    background: var(--kn-docs-change-modified);
}

.docs-orphans__count {
    min-width: 18px;
    padding: 0 6px;
    border-radius: 9px;
    background: rgba(0, 0, 0, 0.1);
    font-size: 0.6875rem;
    font-weight: 600;
    text-align: center;
}

.docs-orphans__body {
    flex: 0 1 auto;
    min-height: 36px;
}

.docs-orphans__empty {
    padding: 6px 16px 10px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
}

.docs-orphan-row {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 8px;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.04);

        .docs-orphan-row__handle,
        .docs-orphan-row__add {
            visibility: visible;
        }
    }
}

.docs-orphan-row--selected,
.docs-orphan-row--selected:hover {
    background: var(--kn-tree-selected-background-color);
}

.docs-orphan-row__handle {
    display: inline-flex;
    cursor: grab;
    color: var(--kn-color-default);
    visibility: hidden;
}

.docs-orphan-row__add {
    visibility: hidden;
}

.docs-orphan-row__icon {
    flex: none;
    color: rgba(0, 0, 0, 0.45);
}

.docs-orphan-row__name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.8rem;
}

.docs-orphan-row__name--deleted {
    color: var(--kn-docs-change-deleted);
    text-decoration: line-through;
}
</style>
