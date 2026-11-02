<template>
    <div ref="root" class="docs-markdown" @click="onClick">
        <vue-markdown-it :source="source" :options="MARKDOWN_OPTIONS" :plugins="plugins" />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'
import mermaid from 'mermaid'
import { findSubfolder, isRelativeUrl, resolveDocsPath } from './DocumentationHelper'
import { downloadBlob, findDocsFolder, getFolders } from './docsResourceApi'
import { docsCallouts, docsHeadingAnchors, docsTables } from './docsMarkdownPlugins'
import type { iDocsCalloutType, iDocsHeading } from './docsMarkdownPlugins'

const props = withDefaults(defineProps<{ source: string; pageFolder?: string; interceptLinks?: boolean }>(), { pageFolder: '', interceptLinks: false })
const emit = defineEmits<{
    (e: 'navigate', path: string): void
    // The h2 and h3 headings after each render, for the "On this page" column.
    (e: 'headings', headings: iDocsHeading[]): void
    // A click on a "#" link. The renderer already scrolled to the heading.
    (e: 'anchor', id: string): void
}>()

const { t } = useI18n()
const MARKDOWN_OPTIONS = { html: true }
const plugins: any[] = [[docsCallouts, { title: (type: iDocsCalloutType) => t(`documentation.callout.${type}`) }], docsHeadingAnchors, docsTables]

const IMAGE_TYPES: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' }

let mermaidReady = false
function initMermaid() {
    if (mermaidReady) return
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
    mermaidReady = true
}

const root = ref<HTMLElement | null>(null)
// Mermaid ids must be unique on the page: the Split view and the reader preview can be open together.
const instanceId = 'dm' + crypto.randomUUID().replace(/-/g, '')
const imageUrls = new Map<string, string>()
let renderCount = 0

onMounted(processContent)
watch(
    () => [props.source, props.pageFolder],
    () => processContent()
)
onBeforeUnmount(() => {
    renderCount++
    imageUrls.forEach((url) => URL.revokeObjectURL(url))
    imageUrls.clear()
})

async function processContent() {
    const current = ++renderCount
    await nextTick()
    if (!root.value || current !== renderCount) return
    await renderMermaid(current)
    if (current !== renderCount) return
    emit('headings', readHeadings())
    await loadImages(current)
}

function readHeadings(): iDocsHeading[] {
    return Array.from(root.value?.querySelectorAll<HTMLElement>('h2[id], h3[id]') ?? []).map((heading) => ({
        id: heading.id,
        text: Array.from(heading.childNodes)
            .filter((child) => !(child instanceof HTMLElement && child.classList.contains('docs-anchor')))
            .map((child) => child.textContent)
            .join('')
            .trim(),
        level: heading.tagName === 'H2' ? 2 : 3
    }))
}

// Ids are unique inside one page only: two renderers can be on one screen, so search inside this root.
function scrollToHeading(id: string) {
    root.value?.querySelector(`[id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'start' })
}

defineExpose({ scrollToHeading })

async function renderMermaid(current: number) {
    const blocks = Array.from(root.value?.querySelectorAll('pre code.language-mermaid') ?? [])
    if (!blocks.length) return
    initMermaid()
    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index]
        const id = `${instanceId}-${current}-${index}`
        try {
            const { svg } = await mermaid.render(id, block.textContent || '')
            const pre = block.closest('pre')
            if (current !== renderCount || !pre || !pre.isConnected) return
            const container = document.createElement('div')
            container.className = 'mermaid-container'
            container.innerHTML = svg
            pre.replaceWith(container)
        } catch {
            // A broken diagram stays as code. Mermaid leaves its error element in the body.
            document.getElementById('d' + id)?.remove()
        }
    }
}

async function loadImages(current: number) {
    const images = Array.from(root.value?.querySelectorAll('img') ?? []).filter((img) => isRelativeUrl(img.getAttribute('src') ?? ''))
    const used = new Set<string>()
    let folders: Awaited<ReturnType<typeof getFolders>> | null = null

    await Promise.all(
        images.map(async (img) => {
            const path = resolveDocsPath(props.pageFolder, img.getAttribute('src') ?? '')
            if (!path) return
            used.add(path)
            let url = imageUrls.get(path)
            if (!url) {
                try {
                    folders ??= await getFolders()
                    const segments = path.split('/')
                    const name = segments.pop() as string
                    const docs = findDocsFolder(folders)
                    const folder = segments.length ? findSubfolder(docs, segments) : docs
                    if (!folder) return
                    const blob = await downloadBlob(folder.key, name)
                    const type = IMAGE_TYPES[name.split('.').pop()?.toLowerCase() ?? ''] ?? blob.type
                    if (!imageUrls.has(path)) imageUrls.set(path, URL.createObjectURL(new Blob([blob], { type })))
                    url = imageUrls.get(path)
                } catch {
                    return
                }
            }
            if (url && current === renderCount && img.isConnected) img.src = url
        })
    )

    if (current !== renderCount) return
    imageUrls.forEach((url, path) => {
        if (used.has(path)) return
        URL.revokeObjectURL(url)
        imageUrls.delete(path)
    })
}

function onClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement).closest('a')
    const href = anchor?.getAttribute('href') ?? ''
    if (anchor && href.startsWith('#') && href.length > 1) {
        event.preventDefault()
        const id = decodeURIComponent(href.slice(1))
        scrollToHeading(id)
        emit('anchor', id)
        return
    }
    if (!props.interceptLinks) return
    if (!anchor || !isRelativeUrl(href)) return
    event.preventDefault()
    const path = resolveDocsPath(props.pageFolder, href)
    if (path) emit('navigate', path)
}
</script>

<style lang="scss" scoped>
// Content styles of the docs site (spec 14.3). The same in the viewer, the reader preview and the editor preview.
.docs-markdown {
    color: var(--kn-docs-text);
    font-family: var(--kn-docs-font-family);
    font-size: var(--kn-docs-font-size);
    line-height: 1.7;
    overflow-wrap: break-word;

    &:deep(h1),
    &:deep(h2),
    &:deep(h3),
    &:deep(h4) {
        position: relative;
        color: var(--kn-docs-text);
        font-family: var(--kn-docs-heading-font-family);
        font-weight: 600;
        letter-spacing: -0.02em;
        // A global style capitalizes every word of a heading. The docs keep the case that the writer typed.
        text-transform: none;
        scroll-margin-top: 16px;
    }
    &:deep(h1) {
        margin: 0 0 16px;
        font-size: 32px;
        line-height: 40px;
    }
    &:deep(h2) {
        margin: 32px 0 12px;
        padding-top: 20px;
        border-top: 1px solid var(--kn-docs-border);
        font-size: 24px;
        line-height: 32px;
    }
    &:deep(h1 + h2),
    &:deep(h2:first-child) {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
    }
    &:deep(h3) {
        margin: 24px 0 8px;
        font-size: 20px;
        line-height: 28px;
    }
    &:deep(h4) {
        margin: 20px 0 8px;
        font-size: 18px;
        line-height: 26px;
    }
    &:deep(.docs-anchor) {
        position: absolute;
        left: -0.9em;
        padding-right: 0.25em;
        color: var(--kn-docs-primary);
        font-weight: 500;
        text-decoration: none;
        opacity: 0;
        transition: opacity 0.2s;
    }
    &:deep(h2:hover .docs-anchor),
    &:deep(h3:hover .docs-anchor),
    &:deep(h4:hover .docs-anchor),
    &:deep(.docs-anchor:focus-visible) {
        opacity: 1;
    }
    &:deep(p),
    &:deep(ul),
    &:deep(ol) {
        margin: 0 0 16px;
    }
    &:deep(ul),
    &:deep(ol) {
        padding-left: 1.25em;
    }
    &:deep(li + li) {
        margin-top: 4px;
    }
    &:deep(a) {
        color: var(--kn-docs-primary);
        text-decoration: none;
        &:hover {
            text-decoration: underline;
        }
    }
    &:deep(img) {
        max-width: 100%;
    }
    &:deep(hr) {
        margin: 24px 0;
        border: none;
        border-top: 1px solid var(--kn-docs-border);
    }
    &:deep(code) {
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--kn-docs-code-background);
        color: var(--kn-docs-code-color);
        font-family: var(--kn-docs-mono-font-family);
        font-size: 0.875em;
    }
    &:deep(pre) {
        margin: 0 0 16px;
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--kn-docs-code-background);
        color: var(--kn-docs-code-color);
        overflow-x: auto;
        code {
            padding: 0;
            background: none;
            font-size: 13.5px;
            line-height: 1.7;
        }
    }
    &:deep(blockquote) {
        margin: 0 0 16px;
        padding: 4px 16px;
        border-left: 4px solid var(--kn-docs-border);
        color: var(--kn-docs-text-muted);
        > :last-child {
            margin-bottom: 0;
        }
    }
    &:deep(.docs-table) {
        margin: 0 0 16px;
        overflow-x: auto;
    }
    &:deep(table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        line-height: 1.5;
        th,
        td {
            padding: 8px 14px;
            border: 1px solid var(--kn-docs-border);
            text-align: left;
        }
        th {
            background: var(--kn-docs-code-background);
            font-weight: 600;
        }
        tbody tr:nth-child(even) td {
            background: rgba(0, 0, 0, 0.015);
        }
    }
    &:deep(.mermaid-container) {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
        padding: 10px;
        svg {
            max-width: 100%;
            height: auto;
        }
    }
}

// Callouts (spec 14.7): the type sets three variables, the rest is shared.
.docs-markdown :deep(.docs-callout) {
    --callout-color: var(--kn-docs-callout-note);
    --callout-background: var(--kn-docs-callout-note-background);
    --callout-icon: 'info';
    padding: 12px 16px;
    border-left: 4px solid var(--callout-color);
    border-radius: 6px;
    background: var(--callout-background);
    color: var(--kn-docs-text);
    font-size: 0.9375em;
    line-height: 1.6;

    .docs-callout__title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        font-size: 14px;
        font-weight: 600;
        &::before {
            content: var(--callout-icon);
            color: var(--callout-color);
            font-family: 'Material Icons';
            font-size: 20px;
            font-weight: normal;
            line-height: 1;
            font-feature-settings: 'liga';
        }
    }
}
.docs-markdown :deep(.docs-callout--tip) {
    --callout-color: var(--kn-docs-callout-tip);
    --callout-background: var(--kn-docs-callout-tip-background);
    --callout-icon: 'lightbulb';
}
.docs-markdown :deep(.docs-callout--important) {
    --callout-color: var(--kn-docs-callout-important);
    --callout-background: var(--kn-docs-callout-important-background);
    --callout-icon: 'feedback';
}
.docs-markdown :deep(.docs-callout--warning) {
    --callout-color: var(--kn-docs-callout-warning);
    --callout-background: var(--kn-docs-callout-warning-background);
    --callout-icon: 'warning_amber';
}
.docs-markdown :deep(.docs-callout--caution) {
    --callout-color: var(--kn-docs-callout-caution);
    --callout-background: var(--kn-docs-callout-caution-background);
    --callout-icon: 'report';
}
</style>
