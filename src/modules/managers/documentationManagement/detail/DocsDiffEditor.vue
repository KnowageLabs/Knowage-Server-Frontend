<template>
    <div ref="container" class="docs-diff" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { monaco } from '../docsMonaco'

const props = withDefaults(defineProps<{ original: string; modified: string; language?: string }>(), { language: 'markdown' })

const container = ref<HTMLElement | null>(null)
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null
let originalModel: monaco.editor.ITextModel | null = null
let modifiedModel: monaco.editor.ITextModel | null = null

onMounted(() => {
    diffEditor = monaco.editor.createDiffEditor(container.value!, {
        theme: 'vs',
        fontSize: 13,
        automaticLayout: true,
        renderSideBySide: false,
        readOnly: true,
        originalEditable: false,
        enableSplitViewResizing: false,
        renderOverviewRuler: false,
        ignoreTrimWhitespace: false,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        minimap: { enabled: false },
        scrollbar: { horizontal: 'hidden', verticalScrollbarSize: 10 }
    })
    originalModel = monaco.editor.createModel(props.original, props.language)
    modifiedModel = monaco.editor.createModel(props.modified, props.language)
    diffEditor.setModel({ original: originalModel, modified: modifiedModel })
})

watch(
    () => props.original,
    (value) => originalModel?.setValue(value)
)
watch(
    () => props.modified,
    (value) => modifiedModel?.setValue(value)
)

useResizeObserver(container, () => diffEditor?.layout())

onBeforeUnmount(() => {
    diffEditor?.dispose()
    originalModel?.dispose()
    modifiedModel?.dispose()
})
</script>

<style scoped>
.docs-diff {
    width: 100%;
    height: 100%;
}
</style>
