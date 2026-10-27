<template>
    <div class="scheduler-documents-drawer column no-wrap full-height" data-test="documents-drawer">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>
                {{ $t('managers.scheduler.addDocuments') }}<span class="scheduler-documents-drawer__job"> · {{ jobName }}</span>
            </q-toolbar-title>
            <q-btn flat round dense icon="close" data-test="documents-close-button" @click="emit('close')">
                <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </q-toolbar>
        <q-linear-progress v-if="adding" indeterminate color="primary" />

        <div class="q-pa-md q-pb-sm">
            <q-input v-model="treeFilter" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" data-test="documents-search">
                <template #append><q-icon name="search" /></template>
            </q-input>
        </div>
        <q-scroll-area class="col scheduler-documents-drawer__tree">
            <q-tree :nodes="nodes" node-key="key" :filter="treeFilter ?? ''" default-expand-all dense no-selection-unset no-transition no-nodes-label="" :no-results-label="$t('common.info.noDataFound')">
                <template #default-header="{ node }">
                    <div class="row items-center no-wrap full-width scheduler-documents-drawer__node">
                        <q-icon :name="node.isDocument ? 'description' : 'folder'" class="scheduler-documents-drawer__node-icon q-mr-sm" />
                        <span class="col ellipsis">{{ node.label }}</span>
                        <template v-if="node.isDocument">
                            <q-icon v-if="isAdded(node.data)" name="check" color="positive" size="18px" class="q-mr-sm"><q-tooltip :delay="500">{{ $t('managers.scheduler.added') }}</q-tooltip></q-icon>
                            <q-btn v-else flat dense no-caps size="sm" color="accent" icon="add" :label="$t('common.add')" :disable="adding" class="q-py-none q-px-xs" @click.stop="addDocument(node.data)" />
                        </template>
                    </div>
                </template>
            </q-tree>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { iFile } from '../Scheduler'
import { createJobDocument } from './schedulerDocumentData'

interface iTreeNode {
    key: string
    id: number
    label: string
    data: any
    isDocument?: boolean
    children?: iTreeNode[]
}

const props = defineProps<{ documents: any[]; files: iFile[]; jobName: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const treeFilter = ref<string | null>('')
const adding = ref(false)

const nodes = computed(() => createNodeTree(props.files))

// Folders first, then the visible documents; empty folders are hidden, as in the old selection dialog
function createNodeTree(folders: iFile[]): iTreeNode[] {
    const sorted = [...folders].sort((a: iFile, b: iFile) => a.id - b.id)
    const folderNodes = new Map<number, iTreeNode>()
    sorted.forEach((folder: iFile) => folderNodes.set(folder.id, { key: 'f' + folder.id, id: folder.id, label: folder.name, data: folder, children: [] }))

    const roots = [] as iTreeNode[]
    sorted.forEach((folder: iFile) => {
        const node = folderNodes.get(folder.id) as iTreeNode
        const parent = folder.parentId ? folderNodes.get(folder.parentId) : null
        if (parent) parent.children?.push(node)
        else roots.push(node)
    })
    sorted.forEach((folder: iFile) => {
        const node = folderNodes.get(folder.id) as iTreeNode
        folder.biObjects?.filter((document: any) => document.visible).forEach((document: any) => node.children?.push({ key: 'd' + folder.id + '-' + document.id, id: document.id, label: document.name, data: document, isDocument: true }))
    })

    const prune = (list: iTreeNode[]): iTreeNode[] =>
        list.filter((node: iTreeNode) => {
            if (node.isDocument) return true
            node.children = prune(node.children ?? [])
            return node.children.length > 0
        })
    return prune(roots)
}

function isAdded(document: any) {
    return props.documents.some((jobDocument: any) => jobDocument.name === document.label)
}

// A document can be added only once; its parameters start empty. The drawer stays open to add more.
async function addDocument(document: any) {
    if (adding.value || isAdded(document)) return
    adding.value = true
    try {
        props.documents.push(await createJobDocument(document))
    } finally {
        adding.value = false
    }
}

// Capture phase: an open menu or dialog closes itself on Esc, and the drawer must not close with it
function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (document.querySelector('.q-dialog, .q-menu')) return
    emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<style scoped lang="scss">
.scheduler-documents-drawer {
    background: #ffffff;
}

.scheduler-documents-drawer__job {
    font-weight: 400;
    opacity: 0.7;
}

.scheduler-documents-drawer__tree {
    min-height: 0;
    margin: 0 16px 16px;
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
}

.scheduler-documents-drawer__tree :deep(.q-scrollarea__content) {
    width: 100%;
    padding: 4px 8px;
}

.scheduler-documents-drawer__node {
    min-height: 28px;
}

.scheduler-documents-drawer__node-icon {
    color: var(--kn-editor-list-icon-color);
}
</style>
