<template>
    <div class="docs-preview column no-wrap" data-tour-id="docs-preview">
        <q-toolbar class="kn-toolbar kn-toolbar--primary docs-preview__bar">
            <q-toolbar-title>{{ $t('managers.documentationManagement.preview.title') }}</q-toolbar-title>
            <q-btn-toggle v-model="version" dense no-caps unelevated size="sm" class="docs-preview__version" toggle-color="white" toggle-text-color="black" color="transparent" text-color="white" :options="versionOptions" />
            <!-- A button with a plain menu: a dark q-select also turns its option list dark. -->
            <q-btn flat dense no-caps class="docs-preview__role q-ml-sm" icon-right="arrow_drop_down" :disable="!roleOptions.length">
                <span class="docs-preview__role-label">{{ $t('managers.documentationManagement.preview.viewAs') }}</span>
                <span>{{ role }}</span>
                <q-menu auto-close anchor="bottom right" self="top right">
                    <q-list dense style="min-width: 180px">
                        <q-item v-for="option in roleOptions" :key="option" clickable :active="option === role" active-class="docs-preview__role-active" @click="role = option">
                            <q-item-section>{{ option }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
            <q-separator vertical dark inset class="q-mx-sm" />
            <q-btn flat round dense icon="close" @click="emit('close')">
                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.preview.exit') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <div v-if="!filtered" class="docs-preview__empty col column items-center justify-center">
            <q-icon name="visibility_off" size="2.5rem" color="grey-5" class="q-mb-sm" />
            <span>{{ $t('managers.documentationManagement.preview.nothing') }}</span>
        </div>
        <div v-else class="col row no-wrap docs-preview__layout">
            <aside class="docs-preview__menu">
                <q-scroll-area class="fit">
                    <div class="q-pa-md">
                        <div v-if="logoSrc" class="full-width flex justify-center">
                            <img :src="logoSrc" class="docs-preview__logo" alt="" @error="onError" />
                        </div>
                        <h2 v-if="filtered.title" class="docs-preview__site-title">{{ filtered.title }}</h2>
                        <q-tree :nodes="treeNodes" :dense="filtered.dense" node-key="id" no-connectors default-expand-all :selected="selectedKey" no-selection-unset @update:selected="onSelect">
                            <template #header-section="prop">
                                <span :class="['doc-menu-node', 'doc-menu-section', { active: selectedKey === prop.node.id, 'no-path': !prop.node.path }]">{{ prop.node.label }}</span>
                            </template>
                            <template #default-header="prop">
                                <span :class="['doc-menu-node', { active: selectedKey === prop.node.id, 'no-path': !prop.node.path }]">{{ prop.node.label }}</span>
                            </template>
                        </q-tree>
                    </div>
                </q-scroll-area>
            </aside>
            <q-scroll-area class="col">
                <q-linear-progress v-if="loadingPage" indeterminate color="primary" />
                <div v-if="pageMissing" class="docs-preview__missing">{{ $t('managers.documentationManagement.preview.pageMissing', { path: currentPath }) }}</div>
                <DocsMarkdown v-else :source="pageText" :page-folder="pageFolder" intercept-links class="docs-preview__page" @navigate="goTo" />
            </q-scroll-area>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import DocsMarkdown from '@/components/documentation/DocsMarkdown.vue'
import { filterConfigByRoles, mapToQTreeNodes } from '@/components/documentation/DocumentationHelper'
import { useDocs } from './useDocsWorkingCopy'
import { useDocsLogo } from './useDocsLogo'
import { dirname, HOME_FILE, nodesToConfig } from './documentationManagementHelpers'

const emit = defineEmits<{ (e: 'close'): void }>()

const wc = useDocs()
const { t } = useI18n()
const store = mainStore()

const version = ref<'working' | 'saved'>('working')
const role = ref<string | null>(null)
const currentPath = ref(HOME_FILE)
const pageText = ref('')
const pageMissing = ref(false)
const loadingPage = ref(false)

const versionOptions = computed(() => [
    { label: t('managers.documentationManagement.preview.workingCopy'), value: 'working' },
    { label: t('managers.documentationManagement.preview.saved'), value: 'saved' }
])
const roleOptions = computed(() => wc.roles.value)

const config = computed(() => (version.value === 'working' ? nodesToConfig(wc.baseConfig.value, wc.site.value, wc.nodes.value) : wc.baseConfig.value))
const previewSite = computed(() => (version.value === 'working' ? wc.site.value : wc.baseSite.value))
const { logoSrc, onError } = useDocsLogo({
    get value() {
        return previewSite.value
    }
})

// The same filter as the viewer (spec 7.4, item 3).
const filtered = computed(() => (config.value ? filterConfigByRoles(config.value, { activeRole: role.value ?? undefined, userRoles: [] }) : null))
const treeNodes = computed(() => mapToQTreeNodes(filtered.value?.content ?? []))
const pageFolder = computed(() => dirname(currentPath.value))

function findByPath(nodes: any[], path: string): any | null {
    for (const node of nodes) {
        if (node.path === path) return node
        const found = node.children ? findByPath(node.children, path) : null
        if (found) return found
    }
    return null
}

const selectedKey = computed(() => findByPath(treeNodes.value, '/' + currentPath.value)?.id ?? null)

function onSelect(id: string | null) {
    const node = id ? findByKey(treeNodes.value, id) : null
    if (node?.path) currentPath.value = String(node.path).replace(/^\/+/, '')
}

function findByKey(nodes: any[], id: string): any | null {
    for (const node of nodes) {
        if (node.id === id) return node
        const found = node.children ? findByKey(node.children, id) : null
        if (found) return found
    }
    return null
}

// Links between pages stay inside the overlay: the route does not change (spec 7.4, item 4).
function goTo(path: string) {
    if (path.endsWith('.md')) currentPath.value = path
}

async function loadPage() {
    const path = currentPath.value
    loadingPage.value = true
    pageMissing.value = false
    try {
        let text: string | undefined
        if (version.value === 'working') text = wc.contents.value[path] ?? (wc.baseFiles.value[path] ? await wc.ensureContent(path) : undefined)
        else text = await wc.readSaved(path)
        if (path !== currentPath.value) return
        pageMissing.value = text === undefined
        pageText.value = text ?? ''
    } catch {
        pageMissing.value = true
        pageText.value = ''
    } finally {
        loadingPage.value = false
    }
}

watch([currentPath, version], loadPage, { immediate: true })

onMounted(() => {
    const own = store.user?.sessionRole || store.user?.defaultRole
    role.value = own && roleOptions.value.includes(own) ? own : (roleOptions.value[0] ?? null)
})

function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style lang="scss" scoped>
.docs-preview {
    position: absolute;
    inset: 0;
    z-index: 3000;
    background: #fff;
}

// kn-toolbar capitalizes every word, which would also change the role names.
.docs-preview__bar {
    flex: none;
    text-transform: none;
}

.docs-preview__version {
    border: 1px solid rgba(255, 255, 255, 0.4);

    :deep(.q-btn) {
        min-height: 24px;
        padding: 0 10px;
    }
}

// The same 24 px box as the version toggle beside it.
.docs-preview__role {
    min-height: 24px;
    padding: 0 2px 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    font-size: 0.8125rem;
    line-height: 1;

    :deep(.q-btn__content) {
        gap: 6px;
    }

    :deep(.q-icon) {
        margin-left: 2px;
        font-size: 20px;
    }
}

.docs-preview__role-label {
    opacity: 0.7;
}

.docs-preview__role-active {
    background: var(--kn-color-selected);
    color: var(--kn-color-primary);
}

.docs-preview__layout {
    min-height: 0;
}

.docs-preview__menu {
    flex: none;
    width: 280px;
    border-right: 1px solid var(--kn-color-borders);
    background-color: var(--kn-documentation-drawer-color-background);
    color: var(--kn-documentation-drawer-color);
    font-family: var(--kn-documentation-drawer-font-family);
    font-size: var(--kn-documentation-drawer-font-size);
}

.docs-preview__logo {
    max-width: 100%;
    max-height: 60px;
    margin-bottom: 1rem;
}

.docs-preview__site-title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
}

.docs-preview__page {
    padding: 0 10%;
}

.docs-preview__missing,
.docs-preview__empty {
    padding: 24px;
    color: rgba(0, 0, 0, 0.54);
}

:deep(.q-tree__node-header) {
    padding: 2px 4px;
}

.doc-menu-node {
    cursor: pointer;
    color: var(--kn-documentation-drawer-color);
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
