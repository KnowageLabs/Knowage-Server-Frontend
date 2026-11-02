<template>
    <DocsSiteLayout v-if="config" :config="config" :path="pagePath" :load-page="loadPage" :logo-src="logoSrc" :hash="hash" :missing-text="$t('documentation.viewer.pageMissing')" class="docs-viewer" @navigate="onNavigate" @heading="onHeading" @logo-error="onLogoError">
        <template #header-actions>
            <q-btn flat round dense icon="link" @click="copyLink(currentUrl())">
                <q-tooltip :delay="500">{{ $t('documentation.viewer.copyLink') }}</q-tooltip>
            </q-btn>
        </template>
    </DocsSiteLayout>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { filterConfigByRoles, findSubfolder } from './DocumentationHelper'
import { downloadText, findDocsFolder, getFolders } from './docsResourceApi'
import type { IDocsFolder } from './docsResourceApi'
import DocsSiteLayout from './DocsSiteLayout.vue'
import mainStore from '@/App.store'

const HOME_FILE = 'index.md'

const store = mainStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { t } = useI18n()

const docsFolder = ref<IDocsFolder | null>(null)
const config = ref<any | null>(null)
const logoWide = import.meta.env.VITE_PUBLIC_PATH + '/images/commons/knowage-black.svg'
const logoSrc = ref<string | false>(false)
let blobUrl: string | null = null

// /docs opens the start page. /docs/sales/dashboard.md opens sales/dashboard.md.
const pagePath = computed(() => {
    const match = route.params.pathMatch
    const path = (Array.isArray(match) ? match.join('/') : match || '').replace(/^\/+/, '')
    return path || HOME_FILE
})
const hash = computed(() => decodeURIComponent(route.hash.replace(/^#/, '')))

onMounted(async () => {
    store.setLoading(true)
    try {
        docsFolder.value = findDocsFolder(await getFolders())
    } catch {
        docsFolder.value = null
    }

    if (!docsFolder.value) {
        store.setLoading(false)
        push404()
        return
    }

    try {
        const parsed = JSON.parse(await downloadText(docsFolder.value.key, 'config.json'))
        const user = store.user
        const filtered = filterConfigByRoles(parsed, { activeRole: user?.sessionRole || user?.defaultRole, userRoles: user?.roles ?? [] })
        if (!filtered) push404()
        else {
            config.value = filtered
            await loadLogo()
        }
    } catch {
        push404()
    } finally {
        store.setLoading(false)
    }
})

// The folder tree is read once: the search reads every page, and each page must not ask for the tree again.
async function loadPage(path: string): Promise<string | null> {
    const docs = docsFolder.value
    if (!docs) return null
    const segments = path.split('/')
    const name = segments.pop() as string
    const folder = segments.length ? findSubfolder(docs, segments) : docs
    if (!folder) return null
    try {
        return await downloadText(folder.key, name)
    } catch {
        return null
    }
}

// menu: false keeps ?menu=false in the links, so the Knowage menu stays hidden when the docs are embedded.
function linkQuery() {
    return config.value?.menu === false ? { ...route.query, menu: 'false' } : route.query
}

function onNavigate(path: string) {
    const [file, anchor] = path.split('#')
    if (!file.endsWith('.md')) return
    router.push({ path: '/docs/' + file, query: linkQuery(), hash: anchor ? `#${anchor}` : '' })
}

function onHeading(id: string, copy: boolean) {
    router.replace({ path: route.path, query: route.query, hash: id ? `#${id}` : '' })
    if (copy) copyLink(new URL(router.resolve({ path: route.path, query: route.query, hash: `#${id}` }).href, window.location.origin).href)
}

function currentUrl() {
    return window.location.href
}

function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    $q.notify({ position: 'top', type: 'positive', message: t('documentation.viewer.linkCopied') })
}

function push404() {
    config.value = null
    router.push({ name: '404' })
}

async function loadLogo() {
    const logo = config.value?.logo
    if (typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:'))) logoSrc.value = logo
    else if (logo) await fetchTenantLogo()
    else logoSrc.value = false
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

// An external image that fails falls back to the Knowage logo.
function onLogoError() {
    if (logoSrc.value !== logoWide) logoSrc.value = logoWide
}

onUnmounted(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
})
</script>

<style lang="scss" scoped>
.docs-viewer {
    height: 100%;
}
</style>
