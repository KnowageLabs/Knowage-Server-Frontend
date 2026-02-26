<template>
    <q-dialog v-model="internalVisibility" allow-focus-outside>
        <q-card ref="cardRef" :style="{ overflow: 'visible', width: '60vw', maxWidth: '1200px', display: 'flex', flexDirection: 'column', height: editorMode === 'blockly' ? '80vh' : 'auto' }">
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ t('knBlockly.title') }}</q-toolbar-title>
                <q-btn-toggle
                    v-if="!isModeFixed"
                    v-model="editorMode"
                    :options="[
                        { label: t('knBlockly.modeVisual'), value: 'blockly', icon: 'widgets' },
                        { label: t('knBlockly.modeText'), value: 'text', icon: 'code' }
                    ]"
                    toggle-color="primary"
                    color="white"
                    text-color="primary"
                    size="sm"
                    @update:model-value="onEditorModeChange"
                />
            </q-toolbar>
            <q-card-section class="q-pt-none flex-grow" style="overflow: visible; display: flex; flex-direction: column">
                <q-input v-model="fieldName" filled square :label="t('knBlockly.fieldName')" :placeholder="t('knBlockly.fieldNamePlaceholder')" class="q-my-sm" :error="!fieldName || !fieldName.trim()" :error-message="t('knBlockly.fieldNameRequired')" />

                <div v-show="editorMode === 'blockly'" ref="blocklyDiv" class="bcf-editor flex-grow"></div>

                <q-input v-show="editorMode === 'text'" v-model="textDsl" type="textarea" filled square :label="t('knBlockly.formulaLabel')" :placeholder="t('knBlockly.formulaPlaceholder')" class="bcf-text-editor" :input-style="{ fontFamily: 'monospace', fontSize: '12px', minHeight: '300px' }" @update:model-value="onTextDslChange" />

                <q-banner class="bg-light-blue-1 text-black q-my-sm" v-if="showOutputs && dsl && editorMode === 'blockly'">
                    <template v-slot:avatar>
                        <q-icon name="check" color="primary" />
                    </template>
                    <pre class="bcf-pre">{{ dsl }}</pre>
                </q-banner>

                <q-banner class="bg-red-1 text-black q-my-sm" v-if="errors.length">
                    <template v-slot:avatar>
                        <q-icon name="error" color="primary" />
                    </template>
                    <div class="bcf-title">{{ t('knBlockly.validationTitle') }}</div>
                    <ul>
                        <li v-for="(e, i) in errors" :key="i">{{ e }}</li>
                    </ul>
                </q-banner>
            </q-card-section>

            <q-card-actions align="right" class="p-p-2">
                <q-btn :label="t('knBlockly.cancel')" color="secondary" @click="onCancel" />
                <q-btn :label="t('knBlockly.save')" color="primary" @click="onSave" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, nextTick } from 'vue'
import * as Blockly from 'blockly'
import 'blockly/blocks'
import { useI18n } from 'vue-i18n'

import toolboxJson from '@/components/UI/KnBlockly/toolbox/toolbox.json'
import { initBlockly } from '@/components/UI/KnBlockly'
import { setFieldOptions } from '@/components/UI/KnBlockly/workspace/fields'
import { setVariableOptions } from '@/components/UI/KnBlockly/workspace/variables'
import { workspaceToState, normalizeStateInput, getInitialMode, extractBlocklyXmlFromState, extractDslFromState } from '@/components/UI/KnBlockly/workspace/state'
import { safeLoadState } from '@/components/UI/KnBlockly/workspace/safeLoad'
import { generateDslFromWorkspace, validateWorkspace } from '@/components/UI/KnBlockly/generator/dslFromWorkspace'

const { t } = useI18n()

type Props = {
    fields: string[]
    variables?: any[]
    initialState?: unknown
    fieldName?: string
    showOutputs?: boolean
    visibility: boolean
}

const props = withDefaults(defineProps<Props>(), {
    initialState: null,
    fieldName: '',
    showOutputs: true,
    variables: () => []
})

const emit = defineEmits<{
    (e: 'save', payload: { name: string; dsl: string; state: any; errors: string[] }): void
    (e: 'cancel'): void
    (e: 'update:visibility', value: boolean): void
    (
        e: 'ready',
        api: {
            getState: () => any
            getStateString: () => string
            getDsl: () => string
            setState: (state: unknown) => void
        }
    ): void
}>()

const blocklyDiv = ref<HTMLElement | null>(null)
const cardRef = ref<{ $el: HTMLElement } | null>(null)
const workspace = shallowRef<Blockly.WorkspaceSvg | null>(null)
const fieldName = ref(props.fieldName)
const editorMode = ref<'blockly' | 'text'>('blockly')
const textDsl = ref('')

const internalVisibility = computed({
    get: () => props.visibility,
    set: (value: boolean) => emit('update:visibility', value)
})

const dsl = ref('')
const state = ref<any>(null)
const errors = ref<string[]>([])

// Blocca il toggle modalità se il campo è già stato salvato con una modalità specifica
const isModeFixed = computed(() => {
    const saved = normalizeStateInput(props.initialState)
    return saved?.mode === 'text' || saved?.mode === 'blockly'
})

const dynamicToolbox = computed(() => {
    const toolbox = JSON.parse(JSON.stringify(toolboxJson))

    if (!props.variables || props.variables.length === 0) {
        toolbox.contents = toolbox.contents.filter((cat: any) => cat.name !== 'Variables')
    }

    return toolbox
})

function refreshOutputs() {
    if (editorMode.value === 'blockly') {
        const ws = workspace.value
        if (!ws) return

        state.value = workspaceToState(ws)
        dsl.value = generateDslFromWorkspace(ws)
        errors.value = validateWorkspace(ws, props.fields)
        textDsl.value = dsl.value
    } else {
        dsl.value = textDsl.value
        errors.value = []
    }
}

function onEditorModeChange(mode: 'blockly' | 'text') {
    if (mode === 'text') {
        refreshOutputs()
    } else {
        refreshOutputs()
        if (workspace.value) {
            nextTick(() => {
                setTimeout(() => {
                    if (workspace.value) {
                        centerOnRoot(workspace.value)
                    }
                }, 50)
            })
        }
    }
}

function onTextDslChange() {
    if (editorMode.value === 'text') {
        dsl.value = textDsl.value
    }
}

function onSave() {
    if (!fieldName.value || !fieldName.value.trim()) {
        errors.value = [t('knBlockly.fieldNameRequired')]
        return
    }

    refreshOutputs()

    const allErrors = [...errors.value]
    if (!fieldName.value.trim()) {
        allErrors.unshift(t('knBlockly.fieldNameRequired'))
    }

    if (allErrors.length > 0) {
        return
    }

    let savedState: any
    if (editorMode.value === 'text') {
        savedState = {
            mode: 'text',
            dsl: dsl.value
        }
    } else {
        savedState = {
            mode: 'blockly',
            blocklyXml: state.value
        }
    }

    emit('save', { name: fieldName.value.trim(), dsl: dsl.value, state: savedState, errors: allErrors })
    internalVisibility.value = false
}

function onCancel() {
    emit('cancel')
    internalVisibility.value = false
}

let resizeObserver: ResizeObserver | null = null
let changeListener: ((e: Blockly.Events.Abstract) => void) | null = null

function centerOnRoot(ws: Blockly.Workspace) {
    const roots = ws.getTopBlocks(false).filter((b) => b.type === 'calc_root')
    if (roots.length > 0) {
        ws.centerOnBlock(roots[0].id)
    }
}

function initializeBlockly() {
    if (!blocklyDiv.value) return

    initBlockly()

    if (cardRef.value?.$el) {
        const dialogInner = cardRef.value.$el.closest('.q-dialog__inner') as HTMLElement | null
        const container: HTMLElement = dialogInner ?? document.body

        Blockly.setParentContainer(container)
        ;['.blocklyDropDownDiv', '.blocklyWidgetDiv', '.blocklyTooltipDiv'].forEach((sel) => {
            const el = document.querySelector(sel)
            if (el && el.parentElement !== container) container.appendChild(el)
        })
    }

    const ws = Blockly.inject(blocklyDiv.value, {
        toolbox: dynamicToolbox.value as any,
        scrollbars: true,
        trashcan: true,
        readOnly: false,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1,
            maxScale: 2,
            minScale: 0.5,
            scaleSpeed: 1.1
        },
        renderer: 'zelos'
    })

    workspace.value = ws

    const initial = normalizeStateInput(props.initialState)
    const blocklyXmlState = extractBlocklyXmlFromState(initial)

    if (blocklyXmlState) {
        safeLoadState(ws, blocklyXmlState, () => {
            setFieldOptions(ws, props.fields)
            setVariableOptions(ws, props.variables || [])
        })
    } else {
        const root = ws.newBlock('calc_root')
        root.initSvg()
        root.render()
        root.moveBy(20, 20)
        setFieldOptions(ws, props.fields)
        setVariableOptions(ws, props.variables || [])
    }

    centerOnRoot(ws)

    resizeObserver = new ResizeObserver(() => Blockly.svgResize(ws))
    resizeObserver.observe(blocklyDiv.value)

    let t: number | null = null
    changeListener = (event: Blockly.Events.Abstract) => {
        if (event instanceof Blockly.Events.BlockCreate) {
            const block = ws.getBlockById(event.blockId)
            if (block?.type === 'agg_field') {
                console.log('[KnBlockly] Nuovo blocco agg_field creato, aggiorno opzioni')
                setFieldOptions(ws, props.fields)
            }
            if (block?.type === 'variable') {
                console.log('[KnBlockly] Nuovo blocco variable creato, aggiorno opzioni')
                setVariableOptions(ws, props.variables || [])
            }
        }

        if (t) window.clearTimeout(t)
        t = window.setTimeout(refreshOutputs, 80)
    }
    ws.addChangeListener(changeListener)

    refreshOutputs()

    emit('ready', {
        getState: () => state.value,
        getStateString: () => {
            try {
                return JSON.stringify(state.value)
            } catch {
                return ''
            }
        },
        getDsl: () => dsl.value,
        setState: (s: unknown) => {
            const parsed = normalizeStateInput(s)
            if (!parsed) return

            const blocklyXml = extractBlocklyXmlFromState(parsed)
            if (blocklyXml) {
                safeLoadState(ws, blocklyXml, () => {
                    setFieldOptions(ws, props.fields)
                    setVariableOptions(ws, props.variables || [])
                })
            }

            const savedDsl = extractDslFromState(parsed)
            if (savedDsl) {
                textDsl.value = savedDsl
            }

            refreshOutputs()
        }
    })
}

watch(internalVisibility, async (isVisible) => {
    if (isVisible) {
        fieldName.value = props.fieldName || ''

        if (!workspace.value) {
            await nextTick()
            setTimeout(() => {
                initializeBlockly()
            }, 100)
        }
    }
})

onMounted(async () => {
    editorMode.value = getInitialMode(props.initialState)

    const savedState = normalizeStateInput(props.initialState)
    if (editorMode.value === 'text' && savedState?.dsl) {
        textDsl.value = savedState.dsl
    }

    if (props.visibility) {
        await nextTick()
        setTimeout(() => {
            initializeBlockly()
        }, 100)
    }
})

watch(
    () => props.fieldName,
    (newName) => {
        fieldName.value = newName || ''
    }
)

watch(
    () => props.fields,
    (fields) => {
        const ws = workspace.value
        if (!ws) return
        setFieldOptions(ws, fields)
        refreshOutputs()
    },
    { deep: true }
)

watch(
    () => props.variables,
    (variables) => {
        const ws = workspace.value
        if (!ws) return
        setVariableOptions(ws, variables || [])
        refreshOutputs()
    },
    { deep: true }
)

onBeforeUnmount(() => {
    if (resizeObserver && blocklyDiv.value) resizeObserver.unobserve(blocklyDiv.value)
    resizeObserver = null

    const ws = workspace.value
    if (ws && changeListener) ws.removeChangeListener(changeListener)

    ws?.dispose()
    workspace.value = null
})
</script>

<style>
.blocklyDropDownDiv,
.blocklyWidgetDiv {
    pointer-events: all !important;
}
</style>

<style scoped>
.bcf-editor {
    width: 100%;
    border: 1px solid #ccc;
    overflow: hidden;
}

.bcf-text-editor {
    width: 100%;
}

.bcf-text-editor :deep(textarea) {
    font-family: 'Courier New', Courier, monospace !important;
    font-size: 12px !important;
    line-height: 1.5 !important;
}

.bcf-pre {
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
}

.bcf-output-section ul {
    margin: 0;
    padding-left: 18px;
    font-size: 12px;
}

/* Flex utilities */
.flex-grow {
    flex: 1;
    min-height: 0;
}

/* Riduci padding e spazi dei blocchi Blockly */
:deep(.blocklyBlockCanvas .blocklyBlock) {
    min-height: 22px !important;
}

:deep(.blocklyText) {
    font-size: 12px !important;
    dominant-baseline: central;
}

:deep(.blocklyFieldDropdown) {
    height: 22px !important;
    padding: 0 4px !important;
}

:deep(.blocklyFieldTextInput) {
    height: 20px !important;
    padding: 2px 3px !important;
}

:deep(.blocklyInputRow) {
    margin: 2px 0 !important;
}

:deep(.blocklyFieldLabel) {
    margin: 0 2px !important;
}
</style>
