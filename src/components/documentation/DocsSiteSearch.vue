<template>
    <q-dialog :model-value="modelValue" position="top" class="docs-search-dialog" @update:model-value="(value) => emit('update:modelValue', value)" @show="onShow">
        <q-card class="docs-search">
            <div class="docs-search__input row items-center no-wrap">
                <q-icon name="search" size="22px" class="docs-search__icon" />
                <input ref="inputEl" v-model="query" class="col" type="search" :placeholder="$t('documentation.search.placeholder')" :aria-label="$t('documentation.search.placeholder')" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="openActive" />
                <q-spinner v-if="indexing" size="18px" color="grey-6" />
            </div>
            <q-scroll-area class="docs-search__results" :content-style="contentStyle" :content-active-style="contentStyle">
                <div v-if="!query.trim()" class="docs-search__note">{{ $t('documentation.search.empty') }}</div>
                <div v-else-if="indexing && !results.length" class="docs-search__note">{{ $t('documentation.search.loading') }}</div>
                <div v-else-if="!results.length" class="docs-search__note">{{ $t('documentation.search.noResults', { query: query.trim() }) }}</div>
                <div v-for="(result, index) in results" :key="result.path" class="docs-search__result" :class="{ 'docs-search__result--active': index === active }" :data-index="index" role="option" :aria-selected="index === active" @mousemove="active = index" @click="open(result.path)">
                    <div v-if="result.trail" class="docs-search__trail ellipsis">{{ result.trail }}</div>
                    <div class="docs-search__label">
                        <template v-for="(part, partIndex) in result.label" :key="partIndex"
                            ><mark v-if="part.match">{{ part.text }}</mark
                            ><template v-else>{{ part.text }}</template></template
                        >
                    </div>
                    <div v-if="result.snippet.length" class="docs-search__snippet">
                        <template v-for="(part, partIndex) in result.snippet" :key="partIndex"
                            ><mark v-if="part.match">{{ part.text }}</mark
                            ><template v-else>{{ part.text }}</template></template
                        >
                    </div>
                </div>
            </q-scroll-area>
            <div class="docs-search__keys row items-center">
                <span><kbd>↑</kbd><kbd>↓</kbd> {{ $t('documentation.search.move') }}</span>
                <span><kbd>Enter</kbd> {{ $t('documentation.search.open') }}</span>
                <span><kbd>Esc</kbd> {{ $t('documentation.search.close') }}</span>
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { IDocsSitePage } from './DocumentationHelper'

// Search (spec 14.6 E3): the index is built in the browser from the pages the reader can see.

interface iIndexedPage {
    path: string
    label: string
    trail: string
    text: string
    // Lower case, without accents: the same length as the source, so a match index is also an index in the source.
    labelKey: string
    textKey: string
}

interface iPart {
    text: string
    match: boolean
}

const props = defineProps<{ modelValue: boolean; pages: IDocsSitePage[]; loadPage: (path: string) => Promise<string | null> }>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'open', path: string): void
}>()

const PARALLEL_DOWNLOADS = 4
const MAX_RESULTS = 30
const SNIPPET_BEFORE = 40
const SNIPPET_LENGTH = 160
const contentStyle = { width: '100%' }

const inputEl = ref<HTMLInputElement | null>(null)
const query = ref('')
const active = ref(0)
const indexing = ref(false)
const index = ref<iIndexedPage[]>([])
let indexRun = 0

// Each character maps to one character, so the indexes of the key and of the source stay aligned.
function searchKey(text: string): string {
    return text
        .split('')
        .map((char) => char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || char)
        .join('')
}

function plainText(markdown: string): string {
    return markdown
        .replace(/```mermaid[\s\S]*?```/g, ' ')
        .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^>\s*\[![a-z]+\]\s*$/gim, ' ')
        .replace(/^\|?[\s:|-]*-{3,}[\s:|-]*$/gm, ' ')
        .replace(/^[\s>#*+-]+|[*_`~|]/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// A new list of pages (another role, another version) needs a new index.
watch(
    () => [props.pages, props.loadPage],
    () => {
        index.value = []
        indexRun++
        if (props.modelValue) buildIndex()
    }
)

async function buildIndex() {
    if (index.value.length || indexing.value) return
    const run = ++indexRun
    indexing.value = true
    const pages: iIndexedPage[] = []
    let next = 0
    const worker = async () => {
        while (next < props.pages.length && run === indexRun) {
            const page = props.pages[next++]
            const markdown = await props.loadPage(page.node.path).catch(() => null)
            const text = plainText(markdown ?? '')
            const trail = page.trail.join(' › ')
            pages.push({ path: page.node.path, label: page.node.label, trail, text, labelKey: searchKey(page.node.label), textKey: searchKey(text) })
        }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL_DOWNLOADS, props.pages.length) }, worker))
    if (run !== indexRun) return
    const order = new Map(props.pages.map((page, position) => [page.node.path, position]))
    index.value = pages.sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0))
    indexing.value = false
}

function highlight(text: string, key: string, terms: string[]): iPart[] {
    const marks = new Array(text.length).fill(false)
    for (const term of terms) {
        let at = key.indexOf(term)
        while (at !== -1) {
            for (let i = at; i < at + term.length; i++) marks[i] = true
            at = key.indexOf(term, at + term.length)
        }
    }
    const parts: iPart[] = []
    for (let i = 0; i < text.length; i++) {
        const last = parts[parts.length - 1]
        if (last && last.match === marks[i]) last.text += text[i]
        else parts.push({ text: text[i], match: marks[i] })
    }
    return parts
}

// Every term must be in the label or the text. Label matches rank first.
const results = computed(() => {
    const terms = searchKey(query.value).split(/\s+/).filter(Boolean)
    if (!terms.length) return []
    return index.value
        .filter((page) => terms.every((term) => page.labelKey.includes(term) || page.textKey.includes(term)))
        .map((page) => {
            const labelHits = terms.filter((term) => page.labelKey.includes(term)).length
            const first = Math.min(...terms.map((term) => page.textKey.indexOf(term)).filter((at) => at !== -1))
            let snippet: iPart[] = []
            if (Number.isFinite(first)) {
                const start = Math.max(0, first - SNIPPET_BEFORE)
                const end = Math.min(page.text.length, start + SNIPPET_LENGTH)
                snippet = highlight(page.text.slice(start, end), page.textKey.slice(start, end), terms)
                if (start > 0) snippet.unshift({ text: '… ', match: false })
                if (end < page.text.length) snippet.push({ text: ' …', match: false })
            }
            return { path: page.path, trail: page.trail, label: highlight(page.label, page.labelKey, terms), snippet, labelHits }
        })
        .sort((a, b) => b.labelHits - a.labelHits)
        .slice(0, MAX_RESULTS)
})

watch(results, () => (active.value = 0))

function onShow() {
    inputEl.value?.focus()
    inputEl.value?.select()
    buildIndex()
}

function move(step: number) {
    if (!results.value.length) return
    active.value = (active.value + step + results.value.length) % results.value.length
    nextTick(() => document.querySelector(`.docs-search__result[data-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' }))
}

function openActive() {
    const result = results.value[active.value]
    if (result) open(result.path)
}

function open(path: string) {
    emit('open', path)
    emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.docs-search {
    width: 600px;
    max-width: calc(100vw - 32px);
    margin-top: 48px;
    border-radius: 10px;
    font-family: var(--kn-docs-font-family);
}

.docs-search__input {
    gap: 10px;
    height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid var(--kn-docs-border);

    input {
        height: 100%;
        border: none;
        outline: none;
        background: none;
        color: var(--kn-docs-text);
        font: inherit;
        font-size: 16px;
    }
}

.docs-search__icon {
    color: var(--kn-docs-primary);
}

.docs-search__results {
    height: min(420px, 60vh);
}

.docs-search__note {
    padding: 16px;
    color: var(--kn-docs-text-muted);
    font-size: 14px;
}

.docs-search__result {
    margin: 4px 8px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
}

.docs-search__result--active {
    background: color-mix(in srgb, var(--kn-docs-primary) 10%, transparent);
}

.docs-search__trail {
    color: var(--kn-docs-text-muted);
    font-size: 12px;
}

.docs-search__label {
    color: var(--kn-docs-text);
    font-size: 14px;
    font-weight: 500;
}

.docs-search__snippet {
    color: var(--kn-docs-text-muted);
    font-size: 13px;
    line-height: 1.5;
}

.docs-search mark {
    padding: 0 1px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--kn-docs-primary) 18%, transparent);
    color: inherit;
}

.docs-search__keys {
    gap: 16px;
    padding: 8px 16px;
    border-top: 1px solid var(--kn-docs-border);
    color: var(--kn-docs-text-muted);
    font-size: 12px;

    kbd {
        margin-right: 2px;
        padding: 0 5px;
        border: 1px solid var(--kn-docs-border);
        border-radius: 4px;
        font: inherit;
    }
}
</style>
