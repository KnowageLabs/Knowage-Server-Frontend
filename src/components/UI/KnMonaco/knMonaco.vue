<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRefs, watch } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'

import { loader } from '@guolao/vue-monaco-editor'

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker()
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker()
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker()
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker()
        }
        return new editorWorker()
    }
}

loader.config({ monaco })

const props = defineProps<{
    language: string
    modelValue: string
    options: object
    textToInsert: string
}>()

watch(
    () => props.textToInsert,
    (cur, prev) => {
        if (cur !== prev && cur) {
            const currentPosition = editor.getPosition()
            if (!currentPosition) return
            editor.executeEdits('insertText', [
                {
                    range: new monaco.Range(currentPosition.lineNumber, currentPosition.column, currentPosition.lineNumber, currentPosition.column),
                    text: props.textToInsert,
                    forceMoveMarkers: true
                }
            ])
            const newCursorPosition = editor.getModel()?.modifyPosition(currentPosition, props.textToInsert.length)
            if (newCursorPosition) {
                editor.setPosition(newCursorPosition)
                editor.focus()
            }
            emit('stringInserted')
        }
    }
)

const emit = defineEmits<{
    (e: 'change', payload: typeof editorValue.value): void
    (e: 'update:modelValue', payload: typeof editorValue.value): void
    (e: 'stringInserted'): void
}>()

const container = ref<HTMLDivElement | null>(null)

let editor: monaco.editor.IStandaloneCodeEditor

const { language, modelValue, options } = toRefs(props)

const editorValue = ref(modelValue.value)

onMounted(() => {
    editor = monaco.editor.create(container.value!, {
        theme: 'vs',
        fontSize: 12,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        ...options.value,
        language: language.value
    })

    editor.onDidChangeModelContent(
        useDebounceFn(() => {
            if (editorValue.value !== editor.getValue()!) {
                editorValue.value = editor.getValue()!
                emit('update:modelValue', editorValue.value)
                emit('change', editorValue.value)
            }
        }, 500)
    )
    if (editorValue?.value) editor.setValue(editorValue.value)
})

watch(modelValue, (cur, prev) => {
    if (cur !== prev && cur !== editor.getValue()!) editor.setValue(cur)
})

const editorObserver = useResizeObserver(container, () => {
    editor.layout()
})

onUnmounted(() => {
    editor?.dispose()
    editorObserver.stop()
})
</script>

<template>
    <div ref="container" style="height: 100%; width: 100%" />
</template>
