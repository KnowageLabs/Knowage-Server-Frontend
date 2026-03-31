<template>
    <q-layout v-if="config" view="hHh lpR fFf" class="full-height">
        <q-drawer v-model="drawer" side="left" bordered class="drawer">
            <div class="q-pa-md">
                <div class="full-width flex justify-center">
                    <img v-if="logoSrc" :src="logoSrc" class="logo" @error="onLogoError" />
                </div>
                <h2 v-if="config?.title">{{ config.title }}</h2>
                <q-tree :nodes="treeNodes" :dense="config.dense" node-key="id" no-connectors default-expand-all v-model:selected="selectedKey" no-selection-unset @update:selected="onNodeSelect">
                    <template #header-section="prop">
                        <span :class="['doc-menu-node', 'doc-menu-section', { active: selectedKey === prop.node.id, 'no-path': !prop.node.path }]">
                            {{ prop.node.label }}
                        </span>
                    </template>
                    <template #default-header="prop">
                        <span :class="['doc-menu-node', { active: selectedKey === prop.node.id, 'no-path': !prop.node.path }]">
                            {{ prop.node.label }}
                        </span>
                    </template>
                </q-tree>
            </div>
        </q-drawer>

        <q-page-container v-if="config" class="full-height scroll relative-position">
            <router-view @toggle-drawer="toggleDrawer" />
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { findFoldersWithLabel, mapToQTreeNodes } from './DocumentationHelper'
import mainStore from '@/App.store'
import { useRoute, useRouter } from 'vue-router'

const store = mainStore()
const router = useRouter()
const route = useRoute()

const drawer = ref(true)
const folderKey = ref<string | null>('')
const config = ref<any | null>(null)
const logoWide = import.meta.env.VITE_PUBLIC_PATH + '/images/commons/knowage-black.svg'
const logoSrc = ref<string | false>(false)
let blobUrl: string | null = null

const selectedKey = ref<string | null>(null)
const treeNodes = ref<any[]>([])

watch(
    [() => route.path, treeNodes],
    ([path]) => {
        const docPath = (path as string).replace(/^\/docs/, '') || null
        if (!docPath || !treeNodes.value.length) {
            selectedKey.value = null
            return
        }
        const node = findNodeByPath(treeNodes.value, docPath)
        selectedKey.value = node?.id ?? null
    },
    { immediate: true }
)

function findNodeByKey(nodes: any[], key: string): any | null {
    for (const node of nodes) {
        if (node.id === key) return node
        if (node.children) {
            const found = findNodeByKey(node.children, key)
            if (found) return found
        }
    }
    return null
}

function findNodeByPath(nodes: any[], path: string): any | null {
    for (const node of nodes) {
        if (node.path === path) return node
        if (node.children) {
            const found = findNodeByPath(node.children, path)
            if (found) return found
        }
    }
    return null
}

function onNodeSelect(nodeId: string | null) {
    if (!nodeId) return
    const node = findNodeByKey(treeNodes.value, nodeId)
    if (node?.path) {
        const target = '/docs' + node.path
        const query = config.value?.menu === false ? { ...route.query, menu: 'false' } : route.query
        router.push({ path: target, query })
    } else {
        selectedKey.value = null
    }
}

onMounted(async () => {
    store.setLoading(true)

    try {
        const foldersResponse = await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders`)
        const root = Array.isArray(foldersResponse.data.root) ? foldersResponse.data.root : Array.isArray(foldersResponse.data) ? foldersResponse.data : []
        const folder = findFoldersWithLabel(root, 'docs')[0]
        folderKey.value = folder ? folder.key : null
    } catch {
        folderKey.value = null
    }

    if (!folderKey.value) {
        store.setLoading(false)
        push404()
        return
    }

    try {
        const response = await axios.post(
            import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/files/download`,
            { key: folderKey.value, selectedFilesNames: ['config.json'] },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/zip; charset=utf-8'
                }
            }
        )

        const user = store.user
        const sessionRole: string | undefined = user?.sessionRole
        const defaultRole: string | undefined = user?.defaultRole
        const userRoles: string[] = user?.roles ?? []
        const activeRole = sessionRole || defaultRole

        function filterNode(node: any): any | null {
            if (node == null) return null
            if (Array.isArray(node)) {
                return node.map(filterNode).filter((n) => n !== null)
            }
            if (typeof node !== 'object') return node

            if (Array.isArray(node.roles) && node.roles.length > 0) {
                const canSee = activeRole ? node.roles.includes(activeRole) : userRoles.some((r) => node.roles.includes(r))
                if (!canSee) return null
            }

            const newNode: any = { ...node }
            if (Array.isArray(node.content)) {
                const filteredContent = node.content.map(filterNode).filter((n) => n !== null)
                if (filteredContent.length) {
                    newNode.content = filteredContent
                } else {
                    delete newNode.content
                    // nasconde solo i gruppi che avevano figli ma tutti filtrati per ruolo
                    if (node.content.length > 0) return null
                }
            }
            return newNode
        }

        const filtered = filterNode(response.data)
        if (!filtered) push404()
        else {
            config.value = filtered
            treeNodes.value = mapToQTreeNodes(filtered.content ?? [])
            await loadLogo()
        }
    } catch {
        push404()
    } finally {
        store.setLoading(false)
    }
})

function push404() {
    config.value = null
    router.push({ name: '404' })
}

async function loadLogo() {
    if (!config.value) {
        logoSrc.value = false
        return
    }
    if (config.value.logo && typeof config.value.logo === 'string' && (config.value.logo.startsWith('http') || config.value.logo.startsWith('data:'))) {
        logoSrc.value = config.value.logo
        return
    }
    if (config.value.logo) {
        await fetchTenantLogo()
        return
    }
    logoSrc.value = false
}

async function fetchTenantLogo() {
    if (!store.user?.organization) {
        logoSrc.value = logoWide
        return
    }
    try {
        const url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/multitenant/${store.user.organization}/logo-wide`
        const response = await axios.get(url, { responseType: 'blob' })
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        blobUrl = URL.createObjectURL(response.data)
        logoSrc.value = blobUrl
    } catch {
        logoSrc.value = logoWide
    }
}

// handler per fallback immagine (per URL http esterne che falliscono)
function onLogoError(event: Event) {
    const img = event.target as HTMLImageElement | null
    if (!img) return
    if (img.src !== logoWide) img.src = logoWide
}

onUnmounted(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
})

function toggleDrawer() {
    drawer.value = !drawer.value
}
</script>

<style lang="scss" scoped>
:deep(.q-drawer) {
    background-color: var(--kn-documentation-drawer-color-background);
    color: var(--kn-documentation-drawer-color);
    font-family: var(--kn-documentation-drawer-font-family);
    font-size: var(--kn-documentation-drawer-font-size);
}
.logo {
    max-width: 100%;
    max-height: 60px;
    margin-bottom: 1rem;
    display: block;
    text-align: center;
}
:deep(.q-tree__node-header) {
    padding: 2px 4px;
}
.doc-menu-node {
    cursor: pointer;
    color: var(--kn-documentation-drawer-color);
    font-family: var(--kn-documentation-drawer-font-family);
    font-size: var(--kn-documentation-drawer-font-size);
    font-weight: 400;
    &.no-path {
        cursor: default;
        pointer-events: none;
    }
    &.active {
        color: var(--kn-documentation-drawer-color-active);
        font-weight: 600;
        border-left: 4px solid var(--kn-documentation-drawer-color-active);
        padding-left: 4px;
    }
    &.doc-menu-section {
        color: var(--kn-documentation-drawer-header-color);
        font-family: var(--kn-documentation-drawer-header-font-family);
        font-size: var(--kn-documentation-drawer-header-font-size);
        font-weight: 600;
    }
}
</style>
