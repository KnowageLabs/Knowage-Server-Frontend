<template>
    <div class="kn-chat-artifacts column no-wrap" :style="isMobile ? {} : { width: width + 'px' }">
        <div class="kn-chat-artifacts__header row items-center no-wrap">
            <span class="kn-chat-section-label col">{{ $t('ai.sidePanel.title') }}</span>
            <q-btn flat round dense size="sm" icon="close" :title="poppedOut ? $t('common.close') : undefined" @click="emit('close')">
                <q-tooltip v-if="!poppedOut" :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </div>

        <div class="kn-chat-artifacts__body col">
            <div v-if="groups.length === 0" class="kn-chat-artifacts__empty column items-center justify-center">
                <q-icon name="inventory_2" size="2.5rem" color="grey-5" class="q-mb-sm" />
                <span>{{ $t('ai.sidePanel.noArtifacts') }}</span>
            </div>

            <section v-for="group in groups" :key="group.id" :ref="(el) => setGroupRef(group.id, el)" class="kn-chat-artifacts__group">
                <div class="kn-chat-artifacts__group-title row no-wrap items-baseline">
                    <span class="kn-chat-section-label col ellipsis" :title="group.question">{{ group.question || $t('common.conversation') }}</span>
                    <span class="kn-chat-artifacts__time">{{ group.time }}</span>
                </div>

                <q-list bordered separator class="kn-chat-artifacts__list">
                    <div v-for="entry in group.entries" :key="entry.key" :class="{ 'kn-chat-artifacts__entry--highlight': highlighted.includes(entry.itemId) }">
                        <q-expansion-item default-opened dense dense-toggle header-class="kn-chat-artifacts__entry-header">
                            <template #header>
                                <q-item-section avatar class="kn-chat-artifacts__entry-icon">
                                    <q-icon :name="entry.icon" size="18px" />
                                </q-item-section>
                                <q-item-section class="ellipsis">{{ entry.title }}</q-item-section>
                                <q-item-section v-if="entry.file" side>
                                    <q-btn flat round dense size="sm" icon="download" tag="a" :href="entry.file.path" target="_blank" :title="poppedOut ? $t('common.download') : undefined" @click.stop>
                                        <q-tooltip v-if="!poppedOut" :delay="500" class="text-capitalize">{{ $t('common.download') }}</q-tooltip>
                                    </q-btn>
                                </q-item-section>
                            </template>

                            <div class="kn-chat-artifacts__entry-body">
                                <p v-if="entry.file?.description" class="kn-chat-artifacts__description">{{ entry.file.description }}</p>
                                <pre v-if="entry.code" class="kn-chat-artifacts__code">{{ entry.code }}</pre>
                                <img v-else-if="entry.kind === 'png'" :src="entry.file?.path" class="kn-chat-artifacts__image" alt="" />
                                <KnCsvPreview v-else-if="entry.kind === 'csv'" :url="entry.file?.path ?? ''" />
                            </div>
                        </q-expansion-item>
                    </div>
                </q-list>
            </section>

            <div ref="latestAnchor"></div>
        </div>

        <div v-if="!isMobile" class="kn-chat-artifacts__resize" @mousedown="emit('start-resize', $event)"></div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import KnCsvPreview from './KnCsvPreview.vue'
import type { IChatArtifactFile, IChatBlock } from './KnChatbot'

const props = withDefaults(
    defineProps<{
        items: IChatBlock[]
        width: number
        isMobile: boolean
        poppedOut?: boolean
        targetItemId?: string
        highlightedItemIds?: string[]
    }>(),
    { poppedOut: false, targetItemId: '', highlightedItemIds: () => [] }
)

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'start-resize', event: MouseEvent): void
}>()

const { t } = useI18n()

interface IArtifactEntry {
    key: string
    itemId: string
    kind: 'sql' | 'python' | 'png' | 'csv'
    icon: string
    title: string
    code?: string
    file?: IChatArtifactFile
}

interface IArtifactGroup {
    id: string
    question: string
    time: string
    entries: IArtifactEntry[]
}

function toEntries(item: IChatBlock): IArtifactEntry[] {
    if (item.type === 'sql_query') return [{ key: item.id, itemId: item.id, kind: 'sql', icon: 'storage', title: t('ai.sidePanel.sql'), code: item.query }]
    if (item.type === 'python_code') return [{ key: item.id, itemId: item.id, kind: 'python', icon: 'code', title: t('ai.sidePanel.python'), code: item.code }]
    return item.files
        .filter((file) => ['png', 'csv'].includes((file.ext ?? '').toLowerCase()))
        .map((file) => {
            const kind = file.ext.toLowerCase() as 'png' | 'csv'
            return { key: `${item.id}-${file.name}-${file.path}`, itemId: item.id, kind, icon: kind === 'png' ? 'image' : 'table_view', title: file.title || file.name, file }
        })
}

// One group per question, in the order the questions were asked.
const groups = computed<IArtifactGroup[]>(() => {
    const byInvocation = new Map<string, IArtifactGroup>()
    props.items.forEach((item) => {
        const entries = toEntries(item)
        if (entries.length === 0) return
        const id = item.invocationId ?? item.id
        if (!byInvocation.has(id)) {
            const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt)
            byInvocation.set(id, { id, question: item.question ?? '', time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), entries: [] })
        }
        byInvocation.get(id)?.entries.push(...entries)
    })
    return Array.from(byInvocation.values())
})

// ── Scroll and highlight ──────────────────────────────────

const latestAnchor = ref<HTMLElement | null>(null)
const highlighted = ref<string[]>([])
const groupRefs = new Map<string, HTMLElement>()
let highlightTimeout: ReturnType<typeof setTimeout> | null = null

function setGroupRef(groupId: string, el: Element | ComponentPublicInstance | null) {
    const element = el && 'nodeType' in (el as any) ? (el as HTMLElement) : ((el as ComponentPublicInstance | null)?.$el as HTMLElement | undefined)
    if (element) groupRefs.set(groupId, element)
    else groupRefs.delete(groupId)
}

function highlight(itemIds: string[]) {
    highlighted.value = [...itemIds]
    if (highlightTimeout) clearTimeout(highlightTimeout)
    highlightTimeout = setTimeout(() => {
        highlighted.value = []
        highlightTimeout = null
    }, 1800)
}

function scrollToLatest() {
    nextTick(() => latestAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
}

const entryCount = computed(() => groups.value.reduce((n, g) => n + g.entries.length, 0))

watch(entryCount, (newCount, oldCount) => {
    if (newCount <= oldCount) return
    const lastItem = props.items[props.items.length - 1]
    if (lastItem) highlight([lastItem.id])
    scrollToLatest()
})

watch(
    () => props.highlightedItemIds,
    (ids) => (ids.length ? highlight(ids) : (highlighted.value = []))
)

watch(
    () => props.targetItemId,
    (itemId) => {
        // Scroll to the whole group, so its question stays visible above the artifacts.
        const group = groups.value.find((g) => g.entries.some((entry) => entry.itemId === itemId))
        if (group) nextTick(() => groupRefs.get(group.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
)

onMounted(() => entryCount.value > 0 && scrollToLatest())
onUnmounted(() => highlightTimeout && clearTimeout(highlightTimeout))
</script>

<style scoped lang="scss">
.kn-chat-artifacts {
    position: relative;
    min-width: 260px;
    max-width: 800px;
    height: 100%;
    border-left: 1px solid rgba(0, 0, 0, 0.12);
    background: var(--kn-chatbot-background-color);
    flex-shrink: 0;
}

.kn-chat-artifacts__header {
    min-height: 40px;
    padding: 0 4px 0 12px;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    flex-shrink: 0;
}

.kn-chat-section-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.kn-chat-artifacts__body {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px;
    min-height: 0;
}

.kn-chat-artifacts__empty {
    height: 100%;
    min-height: 140px;
    padding: 24px;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.45);
}

.kn-chat-artifacts__group + .kn-chat-artifacts__group {
    margin-top: 16px;
}

.kn-chat-artifacts__group-title {
    gap: 8px;
    padding: 0 4px 6px;
}

.kn-chat-artifacts__time {
    font-size: 0.7rem;
    color: rgba(0, 0, 0, 0.45);
    flex-shrink: 0;
}

.kn-chat-artifacts__list {
    background: #ffffff;
    border-radius: var(--kn-chatbot-border-radius);
    overflow: hidden;
}

.kn-chat-artifacts__entry--highlight {
    animation: kn-chat-artifact-highlight 1.8s ease;
}

:deep(.kn-chat-artifacts__entry-header) {
    font-size: 0.85rem;
    font-weight: 500;
    min-height: 40px;
}

.kn-chat-artifacts__entry-icon {
    min-width: 28px;
    color: var(--kn-chatbot-accent-color);
}

.kn-chat-artifacts__entry-body {
    padding: 0 12px 12px;
}

.kn-chat-artifacts__description {
    margin: 0 0 8px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);
    overflow-wrap: anywhere;
}

.kn-chat-artifacts__code {
    margin: 0;
    padding: 10px 12px;
    max-height: 220px;
    overflow: auto;
    background: #f5f5f5;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
    font-size: 0.72rem;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.kn-chat-artifacts__image {
    display: block;
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
}

.kn-chat-artifacts__resize {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -3px;
    width: 6px;
    cursor: ew-resize;
    z-index: 2;
}

@keyframes kn-chat-artifact-highlight {
    0% {
        background: rgba(0, 0, 0, 0.08);
    }
    100% {
        background: transparent;
    }
}
</style>
