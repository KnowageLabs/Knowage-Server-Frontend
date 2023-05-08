<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRefs, watch } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'

// Import monaco
// https://github.com/vitejs/vite/discussions/1791
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JSONWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CSSWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HTMLWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const props = defineProps<{
    language: string
    modelValue: string
    options: object
}>()

const emit = defineEmits<{
    (e: 'change', payload: typeof editorValue.value): void
    (e: 'update:modelValue', payload: typeof editorValue.value): void
}>()

self.MonacoEnvironment = {
    getWorker(_: string, label: string) {
        if (label === 'json') return new JSONWorker()

        if (label === 'css' || label === 'scss' || label === 'less') return new CSSWorker()

        if (label === 'html' || label === 'handlebars' || label === 'razor') return new HTMLWorker()

        if (label === 'typescript' || label === 'javascript') return new TSWorker()

        return new EditorWorker()
    }
}

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
    editor.setValue(editorValue.value)
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
