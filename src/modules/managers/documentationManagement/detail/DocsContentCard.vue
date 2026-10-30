<template>
    <q-card class="docs-content" :class="{ 'docs-content--focus': focus }" data-tour-id="docs-content">
        <!-- One set of actions for the card. It sits over the right end of the strip, whichever pane that is. -->
        <div class="docs-content__actions row items-center no-wrap">
            <q-btn v-if="view === 'changes'" flat dense size="sm" icon="undo" class="docs-content__action" @click="emit('discard')">
                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.content.discardFile') }}</q-tooltip>
            </q-btn>
            <q-separator v-if="view === 'changes'" vertical inset class="q-mx-xs" />
            <q-btn flat dense size="sm" icon="vertical_split" class="docs-content__action" :class="{ 'docs-content__action--on': split }" :aria-pressed="split" @click="toggleSplit">
                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.content.split') }}</q-tooltip>
            </q-btn>
            <q-btn flat dense size="sm" icon="file_open" class="docs-content__action" @click="fileInput?.click()">
                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.content.replace') }}</q-tooltip>
            </q-btn>
            <q-btn flat dense size="sm" :icon="focus ? 'close_fullscreen' : 'open_in_full'" class="docs-content__action" data-tour-id="docs-focus" @click="emit('toggleFocus')">
                <q-tooltip :delay="500">{{ $t(focus ? 'managers.documentationManagement.content.exitFocus' : 'managers.documentationManagement.content.focus') }}</q-tooltip>
            </q-btn>
            <input ref="fileInput" type="file" accept=".md,.markdown,text/markdown,text/plain" hidden @change="onUpload" />
        </div>

        <q-linear-progress v-if="!loaded" indeterminate color="primary" class="docs-content__progress" />
        <div class="docs-content__body row no-wrap">
            <div class="docs-content__pane col column no-wrap">
                <div class="docs-content__strip row no-wrap" role="tablist">
                    <button type="button" role="tab" class="docs-tab" :class="{ 'docs-tab--active': view === 'file' }" :aria-selected="view === 'file'" @click="view = 'file'">
                        <q-icon name="description" size="16px" class="docs-tab__icon docs-tab__icon--file" />
                        <span class="ellipsis">{{ fileName }}</span>
                        <span v-if="folder" class="docs-tab__folder ellipsis">{{ folder }}</span>
                        <DocsLetter v-if="!canDiff" :letter="letter" />
                    </button>
                    <button v-if="!split" type="button" role="tab" class="docs-tab" :class="{ 'docs-tab--active': view === 'preview' }" :aria-selected="view === 'preview'" @click="view = 'preview'">
                        <q-icon name="visibility" size="16px" class="docs-tab__icon" />
                        <span>{{ $t('managers.documentationManagement.content.preview') }}</span>
                    </button>
                    <button v-if="canDiff" type="button" role="tab" class="docs-tab" :class="{ 'docs-tab--active': view === 'changes' }" :aria-selected="view === 'changes'" @click="view = 'changes'">
                        <q-icon name="difference" size="16px" class="docs-tab__icon" />
                        <span>{{ $t('managers.documentationManagement.content.changes') }}</span>
                        <DocsLetter :letter="letter" />
                    </button>
                </div>

                <div v-show="view === 'file'" class="col column no-wrap">
                    <div class="docs-content__insert row items-center no-wrap">
                        <template v-for="action in insertActions" :key="action.id">
                            <q-separator v-if="action.id === 'table'" vertical inset class="q-mx-xs" />
                            <q-btn flat dense size="sm" :icon="action.icon" class="docs-content__action" :data-test="`insert-${action.id}`" @click="action.run">
                                <q-tooltip :delay="500">{{ $t(`managers.documentationManagement.content.insert.${action.id}`) }}</q-tooltip>
                            </q-btn>
                        </template>
                    </div>
                    <div class="docs-content__editor col">
                        <DocsMonacoEditor v-if="shownPath" ref="editor" :path="shownPath" :model-value="content" @change="(file, value) => wc.setContent(file, value)" @images="onImages" />
                    </div>
                </div>
                <q-scroll-area v-if="!split && view === 'preview'" class="col">
                    <DocsMarkdown :source="previewSource" :page-folder="pageFolder" class="docs-content__markdown" />
                </q-scroll-area>
                <div v-if="view === 'changes'" class="col">
                    <DocsDiffEditor :original="baseContent ?? ''" :modified="content" />
                </div>
            </div>

            <div v-if="split" class="docs-content__pane docs-content__pane--preview col column no-wrap">
                <div class="docs-content__strip row no-wrap" role="tablist">
                    <div role="tab" aria-selected="true" class="docs-tab docs-tab--active">
                        <q-icon name="visibility" size="16px" class="docs-tab__icon" />
                        <span>{{ $t('managers.documentationManagement.content.preview') }}</span>
                    </div>
                </div>
                <q-scroll-area class="col">
                    <DocsMarkdown :source="previewSource" :page-folder="pageFolder" class="docs-content__markdown" />
                </q-scroll-area>
            </div>
        </div>

        <DocsImageDialog :visible="imageDialog" @close="imageDialog = false" @pick="onPickImage" />
    </q-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import DocsMarkdown from '@/components/documentation/DocsMarkdown.vue'
import { useDocs } from '../useDocsWorkingCopy'
import { basename, dirname, relativePath } from '../documentationManagementHelpers'
import type { iDocsLetter } from '../DocumentationManagement'
import DocsLetter from '../drawer/DocsLetter.vue'
import DocsMonacoEditor from './DocsMonacoEditor.vue'
import DocsDiffEditor from './DocsDiffEditor.vue'
import DocsImageDialog from '../dialogs/DocsImageDialog.vue'

const props = defineProps<{ path: string; letter: iDocsLetter | ''; focus: boolean }>()
const emit = defineEmits<{
    (e: 'toggleFocus'): void
    (e: 'discard'): void
}>()

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

const MERMAID_SNIPPET = '\n```mermaid\ngraph LR\n    A[Start] --> B[End]\n```\n'
const TABLE_SNIPPET = '\n| Column | Column |\n|--------|--------|\n| Value  | Value  |\n'

// The tabs are the views (spec D28). With split on, Preview has its own pane and the left pane shows the file or the changes.
const view = ref<'file' | 'preview' | 'changes'>('file')
const split = ref(true)
const imageDialog = ref(false)
const loaded = ref(false)
// The file the editor shows. It follows the path only after the text is known, so the editor keeps its models.
const shownPath = ref('')
const previewSource = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const editor = ref<InstanceType<typeof DocsMonacoEditor> | null>(null)

const baseContent = computed(() => wc.baseFiles.value[shownPath.value]?.content)
// Discard drops the working text of the file, so the saved text shows again.
const content = computed(() => wc.contents.value[shownPath.value] ?? baseContent.value ?? '')
const canDiff = computed(() => baseContent.value !== undefined && baseContent.value !== content.value)
const pageFolder = computed(() => dirname(shownPath.value))
const fileName = computed(() => basename(props.path))
const folder = computed(() => (dirname(props.path) ? dirname(props.path) + '/' : ''))

let previewTimer: ReturnType<typeof setTimeout> | undefined
watch(content, (value) => {
    clearTimeout(previewTimer)
    previewTimer = setTimeout(() => (previewSource.value = value), 300)
})
watch(canDiff, (value) => {
    if (!value && view.value === 'changes') view.value = 'file'
})
// The editor is hidden, not unmounted, so it needs a new layout when it shows again.
watch([view, split], () => nextTick(() => editor.value?.layout()))

watch(
    () => props.path,
    async (path) => {
        loaded.value = false
        if (view.value === 'changes') view.value = 'file'
        try {
            await wc.ensureContent(path)
        } catch (error: any) {
            $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
        }
        if (path !== props.path) return
        shownPath.value = path
        previewSource.value = content.value
        loaded.value = true
    },
    { immediate: true }
)

onBeforeUnmount(() => clearTimeout(previewTimer))

function toggleSplit() {
    split.value = !split.value
    if (split.value && view.value === 'preview') view.value = 'file'
}

async function onUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    await wc.replaceContent(props.path, await file.text())
}

async function insertText(text: string) {
    view.value = 'file'
    await nextTick()
    editor.value?.insertAtCursor(text)
}

const insertActions = [
    { id: 'bold', icon: 'format_bold', run: () => editor.value?.wrapSelection('**', '**', t('managers.documentationManagement.content.insertPlaceholder.bold')) },
    { id: 'heading', icon: 'title', run: () => editor.value?.prefixLines('## ', t('managers.documentationManagement.content.insertPlaceholder.heading')) },
    { id: 'list', icon: 'format_list_bulleted', run: () => editor.value?.prefixLines('- ', t('managers.documentationManagement.content.insertPlaceholder.item')) },
    { id: 'link', icon: 'link', run: () => editor.value?.wrapSelection('[', '](https://)', t('managers.documentationManagement.content.insertPlaceholder.link')) },
    { id: 'table', icon: 'table_chart', run: () => insertText(TABLE_SNIPPET) },
    { id: 'image', icon: 'image', run: () => (imageDialog.value = true) },
    { id: 'diagram', icon: 'account_tree', run: () => insertText(MERMAID_SNIPPET) }
]

function markdownImage(imagePath: string) {
    const alt = basename(imagePath).replace(/\.[^.]+$/, '')
    return `![${alt}](${relativePath(dirname(props.path), imagePath)})`
}

function onPickImage(imagePath: string) {
    imageDialog.value = false
    insertText(markdownImage(imagePath))
}

// An image goes to the server at once (spec D13), then the link is written at the cursor.
async function onImages(files: File[]) {
    for (const file of files) {
        try {
            const imagePath = await wc.uploadImage(file, file.name || 'image.png')
            await insertText(markdownImage(imagePath) + '\n')
        } catch (error: any) {
            $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
        }
    }
}

defineExpose({ layout: () => editor.value?.layout() })
</script>

<style lang="scss" scoped>
.docs-content {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.docs-content__actions {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    height: 35px;
    padding: 0 6px;
}

.docs-content__action {
    min-width: 26px;
    min-height: 26px;
    padding: 0;
    color: rgba(0, 0, 0, 0.6);
}

.docs-content__action--on {
    background: var(--kn-color-selected);
    color: var(--kn-color-primary);
}

.docs-content__progress {
    position: absolute;
    top: 35px;
    left: 0;
    right: 0;
    z-index: 1;
}

.docs-content__body {
    height: 520px;
    min-height: 0;
}

.docs-content__pane {
    min-width: 0;
}

.docs-content__pane--preview {
    border-left: 1px solid var(--kn-color-borders);
}

// VS Code style tabs. They cannot be closed.
.docs-content__strip {
    flex: none;
    height: 35px;
    padding-right: 140px;
    background: var(--kn-color-background);
    border-bottom: 1px solid var(--kn-color-borders);
}

.docs-content__pane:not(:last-child) .docs-content__strip {
    padding-right: 0;
}

.docs-tab {
    position: relative;
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 0 12px;
    border: 0;
    border-right: 1px solid var(--kn-color-borders);
    background: transparent;
    font: inherit;
    font-size: 0.8125rem;
    color: rgba(0, 0, 0, 0.6);
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.04);
    }
}

.docs-tab--active,
.docs-tab--active:hover {
    margin-bottom: -1px;
    background: #fff;
    color: rgba(0, 0, 0, 0.87);

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--kn-color-primary);
    }
}

div.docs-tab {
    cursor: default;
}

.docs-tab__icon {
    flex: none;
}

.docs-tab--active .docs-tab__icon--file {
    color: var(--kn-docs-change-renamed);
}

.docs-tab__folder {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.45);
}

.docs-content__insert {
    flex: none;
    gap: 2px;
    height: 32px;
    padding: 0 6px;
    border-bottom: 1px solid #eeeeee;
}

.docs-content__editor {
    min-height: 0;
}

.docs-content__markdown {
    padding: 8px 24px 24px;
}

.docs-content--focus {
    flex: 1 1 auto;
    min-height: 0;

    .docs-content__body {
        flex: 1 1 auto;
        height: auto;
    }
}
</style>
