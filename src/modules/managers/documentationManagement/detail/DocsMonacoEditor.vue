<template>
    <div ref="container" class="docs-monaco" @paste.capture="onPaste" @drop.capture="onDrop" @dragover.capture="onDragOver" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { monaco } from '../docsMonaco'

const props = withDefaults(defineProps<{ path: string; modelValue: string; language?: string; readOnly?: boolean }>(), { language: 'markdown', readOnly: false })
const emit = defineEmits<{
    (e: 'change', path: string, value: string): void
    (e: 'images', files: File[]): void
}>()

const container = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
// One model per file, so each file keeps its own undo history.
const models = new Map<string, monaco.editor.ITextModel>()
let pending = false
let applying = false
let currentPath = props.path

function modelFor(path: string): monaco.editor.ITextModel {
    let model = models.get(path)
    if (model && !model.isDisposed()) return model
    const uri = monaco.Uri.parse('inmemory://docs/' + encodeURI(path))
    monaco.editor.getModel(uri)?.dispose()
    model = monaco.editor.createModel(props.modelValue, props.language, uri)
    models.set(path, model)
    return model
}

// Reports the text of the file that is open now (or was open until a moment ago).
const pushValue = () => {
    pending = false
    const value = editor?.getModel()?.getValue()
    if (value !== undefined) emit('change', currentPath, value)
}
const pushValueDebounced = useDebounceFn(() => pushValue(), 150)

onMounted(() => {
    editor = monaco.editor.create(container.value!, {
        model: modelFor(props.path),
        theme: 'vs',
        fontSize: 13,
        // Wrapped lines and no minimap: the editor shares the card with the preview, and a horizontal scroll bar cut the card.
        wordWrap: 'on',
        minimap: { enabled: false },
        scrollbar: { horizontal: 'hidden', verticalScrollbarSize: 10 },
        padding: { top: 8 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly: props.readOnly,
        dropIntoEditor: { enabled: false }
    })
    editor.onDidChangeModelContent(() => {
        if (applying) return
        pending = true
        pushValueDebounced()
    })
})

watch(
    () => props.path,
    (path) => {
        if (pending) pushValue()
        currentPath = path
        const model = modelFor(path)
        editor?.setModel(model)
        // The file may have changed while another file was open.
        if (editor && model.getValue() !== props.modelValue) editor.executeEdits('external', [{ range: model.getFullModelRange(), text: props.modelValue }])
    }
)

// The text changed from outside (discard, upload, restore): an edit keeps the undo history.
watch(
    () => props.modelValue,
    (value) => {
        const model = editor?.getModel()
        if (!editor || !model || model.getValue() === value || pending) return
        applying = true
        editor.executeEdits('external', [{ range: model.getFullModelRange(), text: value }])
        applying = false
    }
)

watch(
    () => props.readOnly,
    (readOnly) => editor?.updateOptions({ readOnly })
)

useResizeObserver(container, () => editor?.layout())

onBeforeUnmount(() => {
    if (pending) pushValue()
    editor?.dispose()
    models.forEach((model) => model.dispose())
    models.clear()
})

function imagesOf(event: ClipboardEvent | DragEvent): File[] {
    const files = (event as ClipboardEvent).clipboardData?.files ?? (event as DragEvent).dataTransfer?.files
    return Array.from(files ?? []).filter((file) => file.type.startsWith('image/'))
}

function onPaste(event: ClipboardEvent) {
    const files = imagesOf(event)
    if (!files.length) return
    event.preventDefault()
    event.stopPropagation()
    emit('images', files)
}

function onDragOver(event: DragEvent) {
    if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
}

// Without preventDefault Firefox types the dropped data into the editor.
function onDrop(event: DragEvent) {
    if (!event.dataTransfer?.types.includes('Files')) return
    event.preventDefault()
    event.stopPropagation()
    const files = imagesOf(event)
    if (files.length) emit('images', files)
}

function insertAtCursor(text: string) {
    if (!editor) return
    const selection = editor.getSelection()
    if (!selection) return
    editor.executeEdits('toolbar', [{ range: selection, text, forceMoveMarkers: true }])
    editor.focus()
}

// Wraps the selection, or the placeholder when nothing is selected, and selects the wrapped text.
function wrapSelection(before: string, after: string, placeholder: string) {
    if (!editor) return
    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return
    const selected = model.getValueInRange(selection) || placeholder
    editor.executeEdits('toolbar', [{ range: selection, text: before + selected + after, forceMoveMarkers: true }])
    const start = model.getPositionAt(model.getOffsetAt(selection.getStartPosition()) + before.length)
    const end = model.getPositionAt(model.getOffsetAt(start) + selected.length)
    editor.setSelection(new monaco.Selection(start.lineNumber, start.column, end.lineNumber, end.column))
    editor.focus()
}

function prefixLines(prefix: string, placeholder: string) {
    if (!editor) return
    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return
    if (selection.isEmpty() && !model.getLineContent(selection.startLineNumber).trim()) {
        insertAtCursor(prefix + placeholder)
        return
    }
    const edits = []
    for (let line = selection.startLineNumber; line <= selection.endLineNumber; line++) edits.push({ range: new monaco.Range(line, 1, line, 1), text: prefix })
    editor.executeEdits('toolbar', edits)
    editor.focus()
}

function focus() {
    editor?.focus()
}

function layout() {
    editor?.layout()
}

defineExpose({ insertAtCursor, wrapSelection, prefixLines, focus, layout })
</script>

<style scoped>
.docs-monaco {
    width: 100%;
    height: 100%;
}
</style>
