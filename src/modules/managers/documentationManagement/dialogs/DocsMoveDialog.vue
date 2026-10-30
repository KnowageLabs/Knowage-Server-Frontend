<template>
    <q-dialog :model-value="visible" @update:model-value="(value) => !value && emit('close')">
        <q-card class="docs-move-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.documentationManagement.move.title') }}<span v-if="node" class="docs-move-dialog__node"> · {{ node.label }}</span></q-toolbar-title>
                <q-btn flat round dense icon="close" @click="emit('close')" />
            </q-toolbar>
            <q-scroll-area class="col">
                <q-list dense>
                    <q-item clickable :disable="currentParentId === null" @click="moveTo(null)">
                        <q-item-section avatar><q-icon name="vertical_align_top" size="18px" /></q-item-section>
                        <q-item-section>{{ $t('managers.documentationManagement.move.topLevel') }}</q-item-section>
                    </q-item>
                    <q-item v-for="option in options" :key="option.node.id" clickable :disable="option.disabled" :style="{ paddingLeft: `${16 + option.depth * 16}px` }" @click="moveTo(option.node.id)">
                        <q-item-section avatar><q-icon :name="option.node.file ? 'description' : 'folder_open'" size="18px" /></q-item-section>
                        <q-item-section>{{ option.node.label }}</q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
            <q-card-section class="docs-move-dialog__hint">{{ $t('managers.documentationManagement.move.hint') }}</q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDocs } from '../useDocsWorkingCopy'
import { depthOf, subtreeIds } from '../documentationManagementHelpers'

const props = defineProps<{ visible: boolean; nodeId: string | null }>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'moved', id: string): void
}>()

const wc = useDocs()

const node = computed(() => wc.nodeById(props.nodeId))
const currentParentId = computed(() => node.value?.parentId ?? null)

// The moved subtree and the current parent are disabled (spec 7.2, item 6).
const options = computed(() => {
    const blocked = props.nodeId ? subtreeIds(wc.nodes.value, props.nodeId) : []
    return wc.nodes.value
        .filter((n) => !n.deleted)
        .map((n) => ({ node: n, depth: depthOf(wc.nodes.value, n.id), disabled: blocked.includes(n.id) || n.id === currentParentId.value }))
})

function moveTo(targetId: string | null) {
    if (!props.nodeId) return
    if (wc.moveTo(props.nodeId, targetId, targetId ? 'inside' : 'end')) emit('moved', props.nodeId)
    emit('close')
}
</script>

<style lang="scss" scoped>
.docs-move-dialog {
    width: min(460px, 92vw);
    height: min(520px, 80vh);
}

.docs-move-dialog__hint {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
    border-top: 1px solid var(--kn-color-borders);
}
</style>
