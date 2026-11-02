<template>
    <div class="docs-site column no-wrap">
        <!-- The top bar (spec 14.11): always on narrow screens, otherwise not with the "sidebar" search position. -->
        <header v-if="showBar" class="docs-site__header">
            <div class="row items-center no-wrap docs-site__header-start">
                <q-btn v-if="narrow" flat round dense icon="menu" class="docs-site__menu-button" :aria-label="$t('documentation.viewer.menu')" @click="drawerOpen = !drawerOpen" />
                <img v-if="logoSrc" :src="logoSrc" class="docs-site__logo" alt="" @error="emit('logo-error')" />
                <span v-if="config.title" class="docs-site__title ellipsis">{{ config.title }}</span>
            </div>
            <button v-if="searchOn && position === 'header' && !narrow" type="button" class="docs-site__search docs-site__search--header row items-center no-wrap" @click="searchOpen = true">
                <q-icon name="search" size="18px" />
                <span class="col ellipsis">{{ $t('documentation.search.box') }}</span>
                <kbd>{{ shortcutLabel }}</kbd>
            </button>
            <div class="row items-center justify-end no-wrap docs-site__header-end">
                <q-btn v-if="searchOn && narrow" flat round dense icon="search" :aria-label="$t('documentation.search.box')" @click="searchOpen = true" />
                <slot name="header-actions" />
            </div>
        </header>

        <div class="docs-site__body col row no-wrap relative-position">
            <aside v-show="!narrow || drawerOpen" class="docs-site__sidebar" :class="{ 'docs-site__sidebar--overlay': narrow }">
                <q-scroll-area class="fit" :content-style="fullWidth" :content-active-style="fullWidth">
                    <div v-if="!narrow && position !== 'header'" class="docs-site__side-top">
                        <template v-if="position === 'sidebar'">
                            <img v-if="logoSrc" :src="logoSrc" class="docs-site__side-logo" alt="" @error="emit('logo-error')" />
                            <div v-if="config.title" class="docs-site__side-title">{{ config.title }}</div>
                        </template>
                        <button v-if="searchOn" type="button" class="docs-site__search row items-center no-wrap" @click="searchOpen = true">
                            <q-icon name="search" size="18px" />
                            <span class="col ellipsis">{{ $t('documentation.search.box') }}</span>
                            <kbd>{{ shortcutLabel }}</kbd>
                        </button>
                    </div>
                    <nav class="docs-site__nav">
                        <DocsSiteTree :nodes="tree" :active-path="path" :collapsed="collapsed" :dense="config.dense === true" @select="onSelect" @toggle="toggle" />
                    </nav>
                </q-scroll-area>
            </aside>
            <div v-if="narrow && drawerOpen" class="docs-site__backdrop" @click="drawerOpen = false" />

            <q-scroll-area ref="scrollArea" class="col docs-site__main" :content-style="fullWidth" :content-active-style="fullWidth" @scroll="updateActiveHeading">
                <q-linear-progress v-if="loading" indeterminate color="primary" class="absolute-top" />
                <article ref="articleEl" class="docs-site__content">
                    <div v-if="missing" class="docs-site__missing">{{ missingText }}</div>
                    <DocsMarkdown v-else ref="markdown" :source="pageText" :page-folder="pageFolder" intercept-links @navigate="(target) => emit('navigate', target)" @headings="onHeadings" @anchor="(id) => emit('heading', id, true)" />

                    <nav v-if="prevNextOn && !missing && (previous || next)" class="docs-site__pager row no-wrap">
                        <a v-if="previous" href="#" class="docs-site__pager-link" @click.prevent="onSelect(previous.node.path)">
                            <small>{{ $t('documentation.viewer.previous') }}</small>
                            <span>‹ {{ previous.node.label }}</span>
                        </a>
                        <a v-if="next" href="#" class="docs-site__pager-link docs-site__pager-link--next" @click.prevent="onSelect(next.node.path)">
                            <small>{{ $t('documentation.viewer.next') }}</small>
                            <span>{{ next.node.label }} ›</span>
                        </a>
                    </nav>
                </article>
            </q-scroll-area>

            <!-- Without a top bar, the actions (copy link) float at the top right of the page. -->
            <div v-if="!showBar && $slots['header-actions']" class="docs-site__float row no-wrap">
                <slot name="header-actions" />
            </div>

            <aside v-if="showToc" class="docs-site__toc" :class="{ 'docs-site__toc--below-actions': !showBar && $slots['header-actions'] }">
                <div class="docs-site__toc-title">{{ $t('documentation.viewer.onThisPage') }}</div>
                <a v-for="heading in headings" :key="heading.id" :href="`#${heading.id}`" class="docs-site__toc-link" :class="{ 'docs-site__toc-link--sub': heading.level === 3, 'docs-site__toc-link--active': heading.id === activeHeading }" @click.prevent="goToHeading(heading.id)">
                    {{ heading.text }}
                </a>
                <a href="#" class="docs-site__toc-top" @click.prevent="backToTop">↑ {{ $t('documentation.viewer.backToTop') }}</a>
            </aside>
        </div>

        <DocsSiteSearch v-if="searchOn" v-model="searchOpen" :pages="pages" :load-page="loadPage" @open="onSelect" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import DocsMarkdown from './DocsMarkdown.vue'
import DocsSiteTree from './DocsSiteTree.vue'
import DocsSiteSearch from './DocsSiteSearch.vue'
import { siteAncestorKeys, sitePages, toSiteTree } from './DocumentationHelper'
import type { iDocsHeading } from './docsMarkdownPlugins'

// The reader layout of the docs site (spec 14.3). /docs and the reader preview of the manager both use it.

const props = withDefaults(
    defineProps<{
        // The config after the role filter.
        config: any
        // The open page, relative to docs, without the leading slash.
        path: string
        loadPage: (path: string) => Promise<string | null>
        logoSrc?: string | false
        // A heading id to scroll to after the render.
        hash?: string
        missingText?: string
    }>(),
    { logoSrc: false, hash: '', missingText: '' }
)
const emit = defineEmits<{
    (e: 'navigate', path: string): void
    // A heading was opened: from the "On this page" column, or from its "#" link (copy: true). An empty id is the top of the page.
    (e: 'heading', id: string, copy: boolean): void
    (e: 'logo-error'): void
}>()

const NARROW_WIDTH = 1000
const TOC_WIDTH = 1100
// A heading counts as read when its top is this close to the top of the content.
const HEADING_OFFSET = 80
const fullWidth = { width: '100%' }

const $q = useQuasar()
const scrollArea = ref<any>(null)
const articleEl = ref<HTMLElement | null>(null)
const markdown = ref<InstanceType<typeof DocsMarkdown> | null>(null)
const pageText = ref('')
const missing = ref(false)
const loading = ref(false)
const headings = ref<iDocsHeading[]>([])
const activeHeading = ref('')
const collapsed = ref<Set<string>>(new Set())
const drawerOpen = ref(false)
const searchOpen = ref(false)

const tree = computed(() => toSiteTree(props.config?.content))
const pages = computed(() => sitePages(tree.value))
const pageIndex = computed(() => pages.value.findIndex((page) => page.node.path === props.path))
const previous = computed(() => (pageIndex.value > 0 ? pages.value[pageIndex.value - 1] : null))
const next = computed(() => (pageIndex.value !== -1 && pageIndex.value < pages.value.length - 1 ? pages.value[pageIndex.value + 1] : null))
const pageFolder = computed(() => props.path.split('/').slice(0, -1).join('/'))

// An absent key means on (spec 14.5).
const tocOn = computed(() => props.config?.toc !== false)
const prevNextOn = computed(() => props.config?.prevNext !== false)
const searchOn = computed(() => props.config?.search !== false)

const narrow = computed(() => $q.screen.width < NARROW_WIDTH)
// The search position (spec 14.11). Without a search, the logo and the title sit above the menu, as in "sidebar".
const position = computed<'header' | 'menu' | 'sidebar'>(() => (searchOn.value && ['header', 'menu'].includes(props.config?.searchPosition) ? props.config.searchPosition : 'sidebar'))
const showBar = computed(() => narrow.value || position.value !== 'sidebar')
const showToc = computed(() => tocOn.value && headings.value.length >= 2 && $q.screen.width >= TOC_WIDTH)
const shortcutLabel = /mac/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K'

// ── page ──────────────────────────────────────────────────

let loadRun = 0
watch(
    () => [props.path, props.loadPage],
    async () => {
        const run = ++loadRun
        loading.value = true
        headings.value = []
        try {
            const text = await props.loadPage(props.path)
            if (run !== loadRun) return
            missing.value = text === null
            pageText.value = text ?? ''
        } catch {
            if (run !== loadRun) return
            missing.value = true
            pageText.value = ''
        } finally {
            if (run === loadRun) loading.value = false
        }
        if (!props.hash) scrollArea.value?.setScrollPosition('vertical', 0)
    },
    { immediate: true }
)

// The branch of the open page is always open, and so is the node of the page itself.
watch(
    () => [props.path, tree.value],
    () => {
        const keys = siteAncestorKeys(tree.value, props.path)
        if (!keys) return
        const own = pages.value.find((page) => page.node.path === props.path)?.node
        const open = own?.children.length ? [...keys, own.key] : keys
        if (!open.some((key) => collapsed.value.has(key))) return
        const next = new Set(collapsed.value)
        open.forEach((key) => next.delete(key))
        collapsed.value = next
    },
    { immediate: true }
)

function toggle(key: string) {
    const next = new Set(collapsed.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsed.value = next
}

function onSelect(path: string) {
    drawerOpen.value = false
    if (path !== props.path) emit('navigate', path)
}

// ── headings ──────────────────────────────────────────────

function onHeadings(list: iDocsHeading[]) {
    headings.value = list
    nextTick(() => {
        if (props.hash) markdown.value?.scrollToHeading(props.hash)
        updateActiveHeading()
    })
}

watch(
    () => props.hash,
    (id) => {
        if (id && headings.value.length) markdown.value?.scrollToHeading(id)
    }
)

// After a click, the clicked entry stays marked while the scroll it caused ends: near the page end, its heading may never reach the top.
let spyPausedUntil = 0

function goToHeading(id: string) {
    markdown.value?.scrollToHeading(id)
    activeHeading.value = id
    spyPausedUntil = Date.now() + 500
    emit('heading', id, false)
}

function backToTop() {
    scrollArea.value?.setScrollPosition('vertical', 0, 200)
    emit('heading', '', false)
}

// Scroll spy: the last heading whose top passed the top of the content. At the end of the page, the last heading on screen.
function updateActiveHeading() {
    if (Date.now() < spyPausedUntil) return
    const container: HTMLElement | undefined = scrollArea.value?.getScrollTarget()
    if (!container || !articleEl.value || !headings.value.length) return
    const box = container.getBoundingClientRect()
    const atEnd = container.scrollTop > 0 && container.scrollTop + container.clientHeight >= container.scrollHeight - 2
    const limit = atEnd ? box.bottom : box.top + HEADING_OFFSET
    let current = headings.value[0].id
    for (const heading of headings.value) {
        const element = articleEl.value.querySelector(`[id="${CSS.escape(heading.id)}"]`)
        if (element && element.getBoundingClientRect().top <= limit) current = heading.id
    }
    activeHeading.value = current
}

// ── search shortcut ───────────────────────────────────────

function onKeydown(event: KeyboardEvent) {
    if (!searchOn.value || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
    event.preventDefault()
    searchOpen.value = true
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
.docs-site {
    height: 100%;
    background: var(--kn-docs-background);
    color: var(--kn-docs-text);
    font-family: var(--kn-docs-font-family);
}

// Three columns, so a search in the middle stays centered whatever the length of the title.
.docs-site__header {
    flex: none;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    height: 56px;
    padding: 0 20px;
    border-bottom: 1px solid var(--kn-docs-border);
    background: var(--kn-docs-background);
}

// Fixed columns: without the centered search the actions must stay on the right.
.docs-site__header-start {
    grid-column: 1;
    gap: 16px;
    min-width: 0;
}

// Two classes: the general search rule below sets width: 100%, which shrinks the box in the auto-sized middle column.
.docs-site__search.docs-site__search--header {
    grid-column: 2;
    width: min(400px, 40vw);
}

.docs-site__header-end {
    grid-column: 3;
    gap: 4px;
}

.docs-site__menu-button {
    margin-left: -8px;
}

.docs-site__logo {
    max-width: 140px;
    max-height: 32px;
}

.docs-site__title {
    min-width: 0;
    font-size: 16px;
    font-weight: 600;
}

.docs-site__search {
    width: 100%;
    gap: 8px;
    min-width: 0;
    height: 36px;
    padding: 0 10px;
    border: 1px solid var(--kn-docs-border);
    border-radius: 8px;
    background: var(--kn-docs-code-background);
    color: var(--kn-docs-text-muted);
    font: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;

    &:hover {
        border-color: var(--kn-docs-text-muted);
    }

    kbd {
        flex: none;
        padding: 1px 6px;
        border: 1px solid var(--kn-docs-border);
        border-radius: 4px;
        background: var(--kn-docs-background);
        font: inherit;
        font-size: 12px;
    }
}

// The brand and the search sit in their own block, separated from the tree by a line.
.docs-site__side-top {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0 12px;
    padding: 16px 0;
    border-bottom: 1px solid var(--kn-docs-border);
}

// The logo takes the width of the menu (spec 14.11).
.docs-site__side-logo {
    display: block;
    width: 100%;
    height: auto;
    max-height: 96px;
    object-fit: contain;
    object-position: left center;
}

.docs-site__side-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
}

.docs-site__float {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 1;
    gap: 4px;
}

.docs-site__body {
    min-height: 0;
}

.docs-site__sidebar {
    flex: none;
    width: 280px;
    border-right: 1px solid var(--kn-docs-border);
    background: var(--kn-docs-sidebar-background);
}

.docs-site__sidebar--overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 3;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.docs-site__backdrop {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: rgba(0, 0, 0, 0.2);
}

.docs-site__nav {
    padding: 16px 12px 24px;
}

.docs-site__content {
    width: 100%;
    max-width: calc(var(--kn-docs-content-width) + 64px);
    margin: 0 auto;
    padding: 32px 32px 48px;
}

.docs-site__missing {
    color: var(--kn-docs-text-muted);
}

.docs-site__pager {
    gap: 16px;
    margin-top: 32px;
}

.docs-site__pager-link {
    display: flex;
    flex: 0 1 50%;
    flex-direction: column;
    padding: 12px 16px;
    border: 1px solid var(--kn-docs-border);
    border-radius: 8px;
    color: var(--kn-docs-text);
    text-decoration: none;

    &:hover {
        border-color: var(--kn-docs-primary);
    }

    small {
        color: var(--kn-docs-text-muted);
        font-size: 12px;
    }

    span {
        color: var(--kn-docs-primary);
        font-size: 15px;
        font-weight: 500;
    }
}

.docs-site__pager-link--next {
    margin-left: auto;
    text-align: right;
}

.docs-site__toc {
    flex: none;
    width: 244px;
    padding: 32px 24px 0 0;
    font-size: 13px;
    overflow-y: auto;
}

.docs-site__toc--below-actions {
    padding-top: 56px;
}

.docs-site__toc-title {
    margin-bottom: 8px;
    color: var(--kn-docs-text);
    font-weight: 600;
}

.docs-site__toc-link {
    display: block;
    padding: 3px 0 3px 12px;
    border-left: 1px solid var(--kn-docs-border);
    color: var(--kn-docs-text-muted);
    line-height: 1.5;
    text-decoration: none;

    &:hover {
        color: var(--kn-docs-text);
    }
}

.docs-site__toc-link--sub {
    padding-left: 24px;
}

.docs-site__toc-link--active,
.docs-site__toc-link--active:hover {
    padding-left: 11px;
    border-left: 2px solid var(--kn-docs-primary);
    color: var(--kn-docs-primary);
    font-weight: 500;

    &.docs-site__toc-link--sub {
        padding-left: 23px;
    }
}

.docs-site__toc-top {
    display: block;
    margin-top: 12px;
    color: var(--kn-docs-text-muted);
    font-size: 12px;
    text-decoration: none;

    &:hover {
        color: var(--kn-docs-text);
    }
}
</style>
