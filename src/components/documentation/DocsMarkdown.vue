<template>
    <div ref="root" class="docs-markdown" @click="onClick">
        <vue-markdown-it :source="source" :options="{ html: true }" />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'
import mermaid from 'mermaid'
import { findSubfolder, isRelativeUrl, resolveDocsPath } from './DocumentationHelper'
import { downloadBlob, findDocsFolder, getFolders } from './docsResourceApi'

const props = withDefaults(defineProps<{ source: string; pageFolder?: string; interceptLinks?: boolean }>(), { pageFolder: '', interceptLinks: false })
const emit = defineEmits<{ (e: 'navigate', path: string): void }>()

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
    await loadImages(current)
}

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
    if (!props.interceptLinks) return
    const anchor = (event.target as HTMLElement).closest('a')
    const href = anchor?.getAttribute('href') ?? ''
    if (!anchor || !isRelativeUrl(href)) return
    event.preventDefault()
    const path = resolveDocsPath(props.pageFolder, href)
    if (path) emit('navigate', path)
}
</script>

<style lang="scss" scoped>
.docs-markdown {
    background: var(--kn-documentation-content-background);
    color: var(--kn-documentation-content-color);
    font-family: var(--kn-documentation-content-font-family);
    font-size: var(--kn-documentation-content-font-size);
    &:deep(h1),
    &:deep(h2),
    &:deep(h3) {
        color: var(--kn-documentation-content-heading-color);
    }
    &:deep(a) {
        color: var(--kn-documentation-content-link-color);
    }
    &:deep(img) {
        max-width: 100%;
    }
    &:deep(pre) {
        border-radius: var(--kn-documentation-content-code-border-radius);
        border: 1px solid #ccc;
        padding: 4px;
        background-color: var(--kn-documentation-content-code-background);
        color: var(--kn-documentation-content-code-color);
    }
    &:deep(table) {
        border-collapse: collapse;
        td,
        th {
            border: 1px solid #ccc;
            padding: 6px 8px;
        }
    }
    &:deep(h1:first-of-type) {
        padding-top: 10px;
        margin-top: 0;
    }
    &:deep(.mermaid-container) {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
        padding: 10px;
        background-color: var(--kn-documentation-content-background);
        svg {
            max-width: 100%;
            height: auto;
        }
    }
}
</style>
