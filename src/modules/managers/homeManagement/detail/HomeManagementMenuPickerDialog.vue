<template>
    <q-dialog :model-value="visible" persistent @update:model-value="$emit('update:visible', $event)">
        <q-card style="min-width: 480px; max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ $t('managers.homeManagement.menuPicker.title') }}</div>
                <q-space />
                <q-btn icon="close" flat round dense @click="$emit('update:visible', false)" />
            </q-card-section>

            <q-card-section style="flex: 1; overflow-y: auto">
                <q-linear-progress v-if="loading" indeterminate color="primary" class="q-mb-sm" />
                <q-input v-model="filter" :label="$t('common.search')" filled clearable class="q-mb-sm">
                    <template #prepend><q-icon name="search" /></template>
                </q-input>
                <q-tree
                    v-if="!loading && treeNodes.length"
                    :nodes="treeNodes"
                    node-key="key"
                    tick-strategy="leaf"
                    v-model:ticked="tickedKeys"
                    :filter="filter"
                    default-expand-all
                />
                <div v-else-if="!loading" class="text-grey-5 q-pa-md text-center">{{ $t('common.info.noDataFound') }}</div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
                <q-btn flat :label="$t('common.cancel')" @click="$emit('update:visible', false)" />
                <q-btn color="primary" :label="$t('common.confirm')" @click="confirm" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import axios from '@/axios.js'
import { IMenuNode } from '../HomeManagement'

const props = defineProps<{
    visible: boolean
    selectedIds: number[]
    roleId: number | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void
    (e: 'confirm', ids: number[]): void
}>()

const loading = ref(false)
const menuNodes = ref<IMenuNode[]>([])
const tickedKeys = ref<string[]>([])
const filter = ref('')

/** Build a tree from a flat array using parentId references. */
function buildTreeFromFlat(flat: IMenuNode[]): any[] {
    const map = new Map<number, any>()

    // Create all nodes first
    for (const n of flat) {
        map.set(n.menuId, {
            key: String(n.menuId),
            label: n.descr || n.name || String(n.menuId),
            data: n,
            children: []
        })
    }

    const roots: any[] = []
    for (const n of flat) {
        const node = map.get(n.menuId)!
        const parentId = (n as any).parentId ?? null
        if (parentId != null && map.has(parentId)) {
            map.get(parentId)!.children.push(node)
        } else {
            roots.push(node)
        }
    }

    // Remove empty children arrays (so q-tree doesn't show expand arrows on leaves)
    const clean = (nodes: any[]) => {
        for (const n of nodes) {
            if (n.children.length > 0) clean(n.children)
            else delete n.children
        }
    }
    clean(roots)
    return roots
}

const treeNodes = computed(() => buildTreeFromFlat(menuNodes.value))

async function loadMenu() {
    loading.value = true
    menuNodes.value = []
    try {
        const roleSegment = props.roleId ?? 'default'
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/preview/' + roleSegment)
        menuNodes.value = res.data
    } finally {
        loading.value = false
    }
}

function confirm() {
    emit('confirm', tickedKeys.value.map(Number))
    emit('update:visible', false)
}

watch(
    () => props.visible,
    (val) => {
        if (val) {
            tickedKeys.value = props.selectedIds.map(String)
            loadMenu()
        }
    },
    { immediate: true }
)
</script>
