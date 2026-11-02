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
        <!-- The same layout as /docs (spec 14.3). Links stay inside the overlay: the route does not change (spec 7.4, item 4). -->
        <DocsSiteLayout v-else class="col" :config="filtered" :path="currentPath" :load-page="loadPage" :logo-src="logoSrc" :missing-text="$t('managers.documentationManagement.preview.pageMissing', { path: currentPath })" @navigate="goTo" @logo-error="onError" />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import DocsSiteLayout from '@/components/documentation/DocsSiteLayout.vue'
import { filterConfigByRoles } from '@/components/documentation/DocumentationHelper'
import { useDocs } from './useDocsWorkingCopy'
import { useDocsLogo } from './useDocsLogo'
import { HOME_FILE, nodesToConfig } from './documentationManagementHelpers'

const emit = defineEmits<{ (e: 'close'): void }>()

const wc = useDocs()
const { t } = useI18n()
const store = mainStore()

const version = ref<'working' | 'saved'>('working')
const role = ref<string | null>(null)
const currentPath = ref(HOME_FILE)

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

// One loader per version: a new function tells the layout (and its search index) that the pages changed.
const loadPage = computed(() => (version.value === 'working' ? async (path: string) => wc.contents.value[path] ?? (wc.baseFiles.value[path] ? await wc.ensureContent(path) : null) : async (path: string) => (await wc.readSaved(path)) ?? null))

function goTo(path: string) {
    const file = path.split('#')[0]
    if (file.endsWith('.md')) currentPath.value = file
}

onMounted(() => {
    const own = store.user?.sessionRole || store.user?.defaultRole
    role.value = own && roleOptions.value.includes(own) ? own : (roleOptions.value[0] ?? null)
})

// Esc leaves the preview, unless a dialog (the search) is open: the dialog closes first.
function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && !document.querySelector('.q-dialog')) emit('close')
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

.docs-preview__empty {
    padding: 24px;
    color: rgba(0, 0, 0, 0.54);
}
</style>
