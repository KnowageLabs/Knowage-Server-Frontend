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

import { registerGroovyLanguageForMonaco } from '../../../../../../src/components/UI/KnMonaco/MonacoGroovy'
import { registerCFLanguageForMonaco } from '../../../../../../src/components/UI/KnMonaco/CfLang'
import { registerKpiLanguageForMonaco } from '../../../../../../src/components/UI/KnMonaco/kpiLang'

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
    originalContent?: string
    showDiff?: boolean
}>()

registerGroovyLanguageForMonaco()
registerCFLanguageForMonaco()
registerKpiLanguageForMonaco()

const emit = defineEmits<{
    (e: 'change', payload: string): void
    (e: 'editorSetup', payload: any): void
    (e: 'update:modelValue', payload: string): void
    (e: 'stringInserted'): void
}>()

const container = ref<HTMLDivElement | null>(null)

let editor: monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor
let regularEditor: monaco.editor.IStandaloneCodeEditor | null = null
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null

const { language, modelValue, options } = toRefs(props)

const editorValue = ref(modelValue.value)

onMounted(() => {
    createEditor()
})

watch(
    () => props.textToInsert,
    (cur, prev) => {
        if (cur !== prev && cur && regularEditor) {
            const currentPosition = regularEditor.getPosition()
            if (!currentPosition) return
            regularEditor.executeEdits('insertText', [
                {
                    range: new monaco.Range(currentPosition.lineNumber, currentPosition.column, currentPosition.lineNumber, currentPosition.column),
                    text: props.textToInsert,
                    forceMoveMarkers: true
                }
            ])
            const newCursorPosition = regularEditor.getModel()?.modifyPosition(currentPosition, props.textToInsert.length)
            if (newCursorPosition) {
                regularEditor.setPosition(newCursorPosition)
                regularEditor.focus()
            }
            emit('stringInserted')
        }
    }
)

function createEditor() {
    if (props.showDiff && props.originalContent) {
        createDiffEditor()
    } else {
        createRegularEditor()
    }
}

function createRegularEditor() {
    if (diffEditor) {
        diffEditor.dispose()
        diffEditor = null
    }

    if (!regularEditor) {
        regularEditor = monaco.editor.create(container.value!, {
            theme: 'vs',
            fontSize: 12,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            ...options.value,
            language: language.value
        })

        emit('editorSetup', { editor: regularEditor, monaco: monaco })

        regularEditor.onDidChangeModelContent(
            useDebounceFn(() => {
                if (editorValue.value !== regularEditor!.getValue()) {
                    editorValue.value = regularEditor!.getValue()
                    emit('update:modelValue', editorValue.value)
                    emit('change', editorValue.value)
                }
            }, 500)
        )
    }

    if (editorValue.value) {
        regularEditor.setValue(editorValue.value)
    }
    editor = regularEditor
}

function createDiffEditor() {
    if (regularEditor) {
        regularEditor.dispose()
        regularEditor = null
    }

    if (diffEditor) {
        diffEditor.dispose()
    }

    diffEditor = monaco.editor.createDiffEditor(container.value!, {
        theme: 'vs',
        fontSize: 12,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderSideBySide: false,
        readOnly: options.value?.readOnly ?? false,
        enableSplitViewResizing: false,
        renderOverviewRuler: true,
        renderIndicators: false,
        originalEditable: false,
        diffCodeLens: false,
        renderMarginRevertIcon: false,
        ignoreTrimWhitespace: true,
        glyphMargin: false
    })

    const originalModel = monaco.editor.createModel(props.originalContent || '', language.value)
    const modifiedModel = monaco.editor.createModel(editorValue.value, language.value)

    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    })

    const modifiedEditor = diffEditor.getModifiedEditor()

    diffEditor.getOriginalEditor().updateOptions({
        lineNumbers: 'off',
        glyphMargin: false
    })

    emit('editorSetup', { editor: modifiedEditor, monaco: monaco })

    modifiedEditor.onDidChangeModelContent(
        useDebounceFn(() => {
            const newValue = modifiedEditor.getValue()
            if (editorValue.value !== newValue) {
                editorValue.value = newValue
                emit('update:modelValue', editorValue.value)
                emit('change', editorValue.value)
            }
        }, 500)
    )

    editor = diffEditor
}

watch([() => props.showDiff, () => props.originalContent], () => {
    createEditor()
})

watch(modelValue, (cur, prev) => {
    if (cur !== prev && cur !== editorValue.value) {
        editorValue.value = cur
        if (regularEditor && !diffEditor) {
            regularEditor.setValue(cur)
        } else if (diffEditor) {
            // Update the modified model in diff editor
            const modifiedEditor = diffEditor.getModifiedEditor()
            const currentValue = modifiedEditor.getValue()
            if (currentValue !== cur) {
                modifiedEditor.setValue(cur)
            }
        }
    }
})

watch(
    () => props.options,
    (newOptions: any) => {
        if (regularEditor && newOptions.readOnly !== undefined) {
            regularEditor.updateOptions({ readOnly: newOptions.readOnly })
        } else if (diffEditor && newOptions.readOnly !== undefined) {
            diffEditor.updateOptions({ readOnly: newOptions.readOnly })
        }
    },
    { deep: true }
)

const editorObserver = useResizeObserver(container, () => {
    if (regularEditor) {
        regularEditor.layout()
    }
    if (diffEditor) {
        diffEditor.layout()
    }
})

onUnmounted(() => {
    regularEditor?.dispose()
    diffEditor?.dispose()
    editorObserver.stop()
})
</script>

<template>
    <div ref="container" style="height: 100%; width: 100%" />
</template>

<style scoped>
:deep(.monaco-diff-editor .insert-sign),
:deep(.monaco-diff-editor .delete-sign) {
    opacity: 1;
}
</style>
