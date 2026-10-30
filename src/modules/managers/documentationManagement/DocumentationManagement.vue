<template>
    <!-- Positioned, so the reader preview covers the drawer and the detail. -->
    <div class="docs-manager relative-position">
        <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
            <q-page-container>
                <q-page class="row" style="position: unset">
                    <q-drawer v-model="drawerVisible" side="left" :width="drawerWidth" :breakpoint="0" show-if-above bordered class="docs-drawer column no-wrap">
                        <q-toolbar class="kn-toolbar kn-toolbar--primary">
                            <q-toolbar-title>{{ $t('managers.documentationManagement.title') }}</q-toolbar-title>
                            <q-btn flat round dense icon="drive_folder_upload" :disable="!ready" data-tour-id="docs-import" @click="importOpen = true">
                                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.import.button') }}</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense icon="add" :disable="!ready" data-tour-id="docs-add" @click="addTopLevel">
                                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.tree.addTopLevel') }}</q-tooltip>
                            </q-btn>
                        </q-toolbar>
                        <q-linear-progress v-if="wc.status.value === 'loading'" indeterminate color="primary" />
                        <template v-if="ready">
                            <DocsSiteBlock :selected="selection.kind === 'site'" @select="selection = { kind: 'site' }" />
                            <DocsTree :selected-id="selection.kind === 'node' ? selection.id : null" @select="(id) => (selection = { kind: 'node', id })" @move="openMove" />
                            <DocsNotInMenu :selected-path="selection.kind === 'orphan' ? selection.path : null" @select="(path) => (selection = { kind: 'orphan', path })" @add-to-menu="addOrphanToMenu" />
                        </template>
                        <div class="docs-drawer__resize" role="separator" aria-orientation="vertical" @mousedown.prevent="startResize" />
                    </q-drawer>

                    <!-- Absolute, so the content gets the height of the page instead of growing it: the lists inside can then scroll. -->
                    <div class="col relative-position">
                        <div class="absolute-full column no-wrap">
                            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                                <q-btn flat round dense :icon="drawerVisible ? 'menu_open' : 'menu'" @click="drawerVisible = !drawerVisible">
                                    <q-tooltip :delay="500">{{ $t('managers.documentationManagement.toggleDrawer') }}</q-tooltip>
                                </q-btn>
                                <q-toolbar-title class="docs-toolbar__title">
                                    <span>{{ detailTitle }}</span>
                                    <span v-if="ready" class="docs-toolbar__status">
                                        · {{ wc.hasChanges.value ? $t('managers.documentationManagement.toolbar.unsaved', wc.changes.value.length) : $t('managers.documentationManagement.toolbar.saved') }}
                                        <q-tooltip v-if="wc.hasChanges.value" :delay="500">{{ $t('managers.documentationManagement.toolbar.unsavedHint') }}</q-tooltip>
                                    </span>
                                </q-toolbar-title>
                                <template v-if="ready">
                                    <q-btn flat round dense icon="undo" :disable="!wc.hasChanges.value" @click="confirmDiscardAll">
                                        <q-tooltip :delay="500">{{ $t('managers.documentationManagement.discardAll') }}</q-tooltip>
                                    </q-btn>
                                    <q-btn flat round dense icon="visibility" data-tour-id="docs-preview-button" @click="previewOpen = true">
                                        <q-tooltip :delay="500">{{ $t('managers.documentationManagement.preview.button') }}</q-tooltip>
                                    </q-btn>
                                    <q-btn flat round dense icon="save" :disable="!wc.hasChanges.value" data-tour-id="docs-save-button" data-test="save-button" @click="saveOpen = true">
                                        <q-badge v-if="wc.hasChanges.value" floating rounded class="docs-toolbar__badge">{{ wc.changes.value.length }}</q-badge>
                                        <q-tooltip :delay="500">{{ $t('managers.documentationManagement.save.button', { n: wc.changes.value.length }) }}</q-tooltip>
                                    </q-btn>
                                </template>
                            </q-toolbar>
                            <q-linear-progress v-if="wc.status.value === 'loading'" indeterminate color="primary" />

                            <div v-if="wc.status.value === 'noSite'" class="docs-nosite col column items-center justify-center kn-background">
                                <KnHint title="managers.documentationManagement.noSite.title" hint="managers.documentationManagement.noSite.hint" style="flex: none; height: auto" />
                                <q-btn unelevated no-caps color="primary" icon="auto_awesome" class="q-mt-md" :label="$t('managers.documentationManagement.noSite.create')" :loading="creating" @click="createSite" />
                            </div>

                            <div v-else-if="wc.status.value === 'error'" class="docs-nosite col column items-center justify-center kn-background">
                                <q-icon name="error_outline" size="2.5rem" color="negative" class="q-mb-sm" />
                                <span class="q-mb-md">{{ $t('managers.documentationManagement.loadError') }}</span>
                                <q-btn unelevated no-caps color="primary" icon="refresh" :label="$t('common.retry')" @click="wc.load()" />
                            </div>

                            <q-scroll-area v-else-if="wc.status.value === 'brokenConfig'" class="col kn-background">
                                <div class="docs-detail__column">
                                    <q-banner rounded class="bg-negative text-white">
                                        <template #avatar><q-icon name="error" /></template>
                                        {{ $t('managers.documentationManagement.brokenConfig.message') }}
                                        <div class="docs-broken__error">{{ wc.configError.value }}</div>
                                        <template #action>
                                            <q-btn flat no-caps icon="edit_note" :label="$t('managers.documentationManagement.brokenConfig.open')" @click="openRawConfig" />
                                        </template>
                                    </q-banner>
                                    <q-card v-if="rawOpen">
                                        <q-card-section class="docs-card__header row items-center no-wrap">
                                            <div class="kn-editor-card-label col">config.json</div>
                                            <q-btn unelevated no-caps dense color="primary" icon="save" class="q-px-sm" :label="$t('managers.documentationManagement.brokenConfig.save')" :loading="savingRaw" @click="saveRawConfig" />
                                        </q-card-section>
                                        <q-separator />
                                        <div class="docs-broken__editor">
                                            <DocsMonacoEditor path="config.json" language="json" :model-value="rawText" @change="(_path, value) => (rawText = value)" />
                                        </div>
                                    </q-card>
                                </div>
                            </q-scroll-area>

                            <q-scroll-area v-else-if="ready" class="col kn-background" :content-style="scrollContentStyle" :content-active-style="scrollContentStyle">
                                <div class="docs-detail__column" :class="{ 'docs-detail__column--focus': focusMode }">
                                    <template v-if="!focusMode">
                                        <DocsSiteCard v-if="selection.kind === 'site'" />
                                        <DocsNodeCard v-else-if="selection.kind === 'node'" :id="selection.id" />
                                        <DocsOrphanCard v-else-if="selection.kind === 'orphan'" :path="selection.path" @select-node="(id) => (selection = { kind: 'node', id })" @closed="selection = { kind: 'site' }" />
                                    </template>

                                    <DocsContentCard v-if="pagePath" key="content" ref="contentCard" :path="pagePath" :letter="pageLetter" :focus="focusMode" @toggle-focus="focusMode = !focusMode" @discard="wc.discardFile(pagePath)" />
                                    <div v-else-if="emptyPage && !focusMode" class="docs-empty column items-center">
                                        <q-icon name="description" size="2.5rem" color="grey-5" class="q-mb-sm" />
                                        <span class="q-mb-md">{{ $t(`managers.documentationManagement.${emptyPage}.noPage`) }}</span>
                                        <q-btn unelevated no-caps color="primary" icon="note_add" :label="$t(`managers.documentationManagement.${emptyPage}.createPage`)" @click="createPage" />
                                    </div>
                                </div>
                            </q-scroll-area>
                        </div>
                    </div>
                </q-page>
            </q-page-container>
        </q-layout>

        <DocsReaderPreview v-if="previewOpen" @close="previewOpen = false" />
        <DocsSaveDialog :visible="saveOpen" @close="saveOpen = false" />
        <DocsImportDialog :visible="importOpen" @close="importOpen = false" />
        <DocsMoveDialog :visible="moveOpen" :node-id="moveNodeId" @close="moveOpen = false" @moved="(id) => (selection = { kind: 'node', id })" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import KnHint from '@/components/UI/KnHint.vue'
import { usePageTour } from '@/composables/usePageTour'
import mainStore from '@/App.store'
import { docsKey, useDocsWorkingCopy } from './useDocsWorkingCopy'
import { startDocumentationManagementTour } from './DocumentationManagementTour'
import { HOME_FILE } from './documentationManagementHelpers'
import type { iDocsWorkingCopyStorage } from './DocumentationManagement'
import DocsSiteBlock from './drawer/DocsSiteBlock.vue'
import DocsTree from './drawer/DocsTree.vue'
import DocsNotInMenu from './drawer/DocsNotInMenu.vue'
import DocsSiteCard from './detail/DocsSiteCard.vue'
import DocsNodeCard from './detail/DocsNodeCard.vue'
import DocsOrphanCard from './detail/DocsOrphanCard.vue'
import DocsContentCard from './detail/DocsContentCard.vue'
import DocsMonacoEditor from './detail/DocsMonacoEditor.vue'
import DocsSaveDialog from './dialogs/DocsSaveDialog.vue'
import DocsImportDialog from './dialogs/DocsImportDialog.vue'
import DocsMoveDialog from './dialogs/DocsMoveDialog.vue'
import DocsReaderPreview from './DocsReaderPreview.vue'

// The site selection shows the site settings and the start page (index.md, spec D23).
type iSelection = { kind: 'site' } | { kind: 'node'; id: string } | { kind: 'orphan'; path: string }

const MIN_DRAWER_WIDTH = 300
const MAX_DRAWER_WIDTH = 600
const WIDTH_KEY = 'kn-docs-manager:drawer-width'

const { t } = useI18n()
const $q = useQuasar()
const store = mainStore()
const route = useRoute()

const wc = useDocsWorkingCopy()
provide(docsKey, wc)

const selection = ref<iSelection>({ kind: 'site' })
const drawerVisible = ref(true)
const drawerWidth = ref(readWidth())
const focusMode = ref(false)
const previewOpen = ref(false)
const saveOpen = ref(false)
const importOpen = ref(false)
const moveOpen = ref(false)
const moveNodeId = ref<string | null>(null)
const creating = ref(false)
const rawOpen = ref(false)
const rawText = ref('')
const savingRaw = ref(false)
const contentCard = ref<InstanceType<typeof DocsContentCard> | null>(null)

const ready = computed(() => wc.status.value === 'ready')
const selectedNode = computed(() => (selection.value.kind === 'node' ? wc.nodeById(selection.value.id) : undefined))

// The page that the content card shows: the page of the node, the start page, or a file that is not in the menu.
const pagePath = computed(() => {
    const current = selection.value
    if (current.kind === 'node') return selectedNode.value && !selectedNode.value.deleted ? selectedNode.value.file : ''
    if (current.kind === 'orphan') return wc.deletedPaths.value.includes(current.path) ? '' : current.path
    return wc.baseFiles.value[HOME_FILE] || wc.contents.value[HOME_FILE] !== undefined ? HOME_FILE : ''
})
const pageLetter = computed(() => {
    const current = selection.value
    if (current.kind === 'node') return selectedNode.value ? (wc.letters.value.get(selectedNode.value.id) ?? '') : ''
    return wc.letterOfFile(pagePath.value)
})
// A selection that has no page yet shows an empty state with a button to create it.
const emptyPage = computed(() => {
    if (pagePath.value) return ''
    if (selection.value.kind === 'node' && selectedNode.value && !selectedNode.value.deleted && !selectedNode.value.file) return 'section'
    if (selection.value.kind === 'site') return 'homePage'
    return ''
})

const detailTitle = computed(() => {
    const current = selection.value
    if (current.kind === 'site') return t('managers.documentationManagement.site.title')
    if (current.kind === 'orphan') return current.path
    return selectedNode.value?.label || t('managers.documentationManagement.tree.untitled')
})

// The scroll content is a flex column, so the content card can fill the height in focus mode.
const scrollContentStyle = { display: 'flex', flexDirection: 'column', minHeight: '100%' }

onMounted(async () => {
    await wc.load()
    if (import.meta.env.DEV && route.query.mock) await applyDevMock(String(route.query.mock))
    if (wc.status.value === 'brokenConfig') rawText.value = wc.rawConfig.value
})

// Dev only, see DocsDevMocks.ts. The dynamic import keeps the mock out of production builds.
async function applyDevMock(mock: string) {
    const { applyDocsDevMock } = await import('./DocsDevMocks')
    const id = await applyDocsDevMock(wc, mock)
    if (id) selection.value = { kind: 'node', id }
}

// ── working copy: restore, leave guard ────────────────────

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string)

watch(
    () => wc.pendingCopy.value,
    (copy) => {
        if (copy) askRestore(copy)
    }
)

function askRestore(copy: iDocsWorkingCopyStorage) {
    const changed = wc.changedOnServer(copy)
    const note = changed.length ? `<br><br>${escapeHtml(t('managers.documentationManagement.restore.serverChanged', { files: changed.join(', ') }))}` : ''
    $q.dialog({
        title: t('managers.documentationManagement.restore.title'),
        message: escapeHtml(t('managers.documentationManagement.restore.message', { date: new Date(copy.savedAt).toLocaleString() })) + note,
        html: true,
        persistent: true,
        ok: { label: t('managers.documentationManagement.restore.restore'), flat: true },
        cancel: { label: t('managers.documentationManagement.discard'), flat: true }
    })
        .onOk(() => wc.restorePendingCopy())
        .onCancel(() => wc.discardPendingCopy())
}

watch(
    () => wc.storageFailed.value,
    (failed) => {
        if (failed) $q.notify({ type: 'warning', message: t('managers.documentationManagement.storageWarning') })
    }
)

onBeforeRouteLeave((_to, _from, next) => {
    if (!wc.hasChanges.value) return next()
    $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true })
        .onOk(() => next())
        .onCancel(() => next(false))
})

function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!wc.hasChanges.value) return
    event.preventDefault()
    event.returnValue = ''
}

// Esc leaves focus mode. The reader preview and the dialogs use Esc for themselves.
function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && focusMode.value && !previewOpen.value && !document.querySelector('.q-dialog')) focusMode.value = false
}

onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    window.removeEventListener('keydown', onKeydown)
    wc.persistNow()
})

// A node or a file that is gone leaves the selection on the site settings.
watch([() => wc.nodes.value, () => wc.orphans.value], () => {
    const current = selection.value
    if (current.kind === 'node' && !wc.nodeById(current.id)) selection.value = { kind: 'site' }
    else if (current.kind === 'orphan' && !wc.orphans.value.includes(current.path)) selection.value = { kind: 'site' }
})

// The editor changes size with the mode and with the drawer.
watch([focusMode, drawerVisible, drawerWidth], () => nextTick(() => contentCard.value?.layout()))

// ── actions ───────────────────────────────────────────────

function addTopLevel() {
    const node = wc.addNode(null, t('managers.documentationManagement.tree.newItem'), false)
    selection.value = { kind: 'node', id: node.id }
}

function addOrphanToMenu(path: string) {
    selection.value = { kind: 'node', id: wc.addOrphanToMenu(path).id }
}

function openMove(id: string) {
    moveNodeId.value = id
    moveOpen.value = true
}

function createPage() {
    if (selection.value.kind === 'node') wc.createPage(selection.value.id)
    else if (selection.value.kind === 'site') wc.setContent(HOME_FILE, `# ${wc.site.value.title || t('managers.documentationManagement.tree.home')}\n\n`)
}

function confirmDiscardAll() {
    $q.dialog({ title: t('managers.documentationManagement.discardAllTitle'), message: t('managers.documentationManagement.discardAllMessage'), cancel: true, persistent: true }).onOk(() => {
        wc.discardAll()
        focusMode.value = false
    })
}

async function createSite() {
    creating.value = true
    try {
        await wc.createSite()
        selection.value = { kind: 'site' }
    } catch (error: any) {
        store.setError({ title: t('common.error.generic'), msg: error?.message ?? t('common.error.generic') })
    } finally {
        creating.value = false
    }
}

function openRawConfig() {
    rawText.value = wc.rawConfig.value
    rawOpen.value = true
}

async function saveRawConfig() {
    savingRaw.value = true
    try {
        await wc.saveRawConfig(rawText.value)
        rawOpen.value = false
        $q.notify({ type: 'positive', message: t('managers.documentationManagement.brokenConfig.saved') })
    } catch (error: any) {
        $q.notify({ type: 'negative', message: t('managers.documentationManagement.brokenConfig.stillBroken', { message: error?.message ?? '' }) })
    } finally {
        savingRaw.value = false
    }
}

// ── drawer resize ─────────────────────────────────────────

function readWidth(): number {
    try {
        const width = Number(localStorage.getItem(WIDTH_KEY))
        if (width >= MIN_DRAWER_WIDTH && width <= MAX_DRAWER_WIDTH) return width
    } catch {
        // a blocked storage keeps the default width
    }
    return MIN_DRAWER_WIDTH
}

function startResize(event: MouseEvent) {
    const startX = event.clientX
    const startWidth = drawerWidth.value
    const move = (e: MouseEvent) => (drawerWidth.value = Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, startWidth + e.clientX - startX)))
    const up = () => {
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
        try {
            localStorage.setItem(WIDTH_KEY, String(drawerWidth.value))
        } catch {
            // a blocked storage keeps the width for this visit only
        }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
}

// ── tour ──────────────────────────────────────────────────

usePageTour(startTour)

function startTour() {
    startDocumentationManagementTour({
        t,
        ensurePage: async () => {
            if (!ready.value) return false
            drawerVisible.value = true
            if (!pagePath.value) {
                const withPage = wc.nodes.value.find((node) => node.file && !node.deleted)
                selection.value = withPage ? { kind: 'node', id: withPage.id } : { kind: 'site' }
                await new Promise((resolve) => setTimeout(resolve, 400))
            }
            return true
        }
    })
}
</script>

<style lang="scss" scoped>
.docs-manager {
    height: 100%;
}

.docs-drawer__resize {
    position: absolute;
    top: 0;
    right: -3px;
    bottom: 0;
    z-index: 10;
    width: 6px;
    cursor: col-resize;

    &:hover {
        background: var(--kn-color-secondary);
    }
}

.docs-toolbar__title {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
}

// kn-toolbar capitalizes every word. The status is a sentence.
.docs-toolbar__status {
    font-size: 0.8rem;
    opacity: 0.75;
    white-space: nowrap;
    text-transform: none;
}

.docs-toolbar__badge {
    background: var(--kn-color-fab);
    color: #fff;
}

.docs-detail__column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px;
}

.docs-detail__column--focus {
    flex: 1 0 auto;
    max-width: none;
    padding: 8px;

    :deep(.docs-content) {
        flex: 1 0 auto;
    }
}

.docs-empty {
    padding: 32px 16px;
    border: 2px dashed rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.6);
}

.docs-broken__error {
    margin-top: 4px;
    font-family: monospace;
    font-size: 0.8rem;
}

.docs-broken__editor {
    height: 420px;
}

:deep(.docs-card__header) {
    min-height: 40px;
    padding: 4px 16px;
}

:deep(.docs-card__note) {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
}

:deep(.docs-card__code) {
    font-family: monospace;
}
</style>
