<template>
    <q-dialog :model-value="visible" persistent @hide="$emit('close')">
        <q-card style="min-width: 480px; max-width: 700px; width: 90vw">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t(`dashboard.widgetEditor.editorTags.${mode}`) }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section class="q-pt-md">
                <q-banner rounded class="bg-blue-1 text-blue-10 q-mb-md" dense>
                    <template #avatar><q-icon name="info" color="blue-8" /></template>
                    {{ $t(`dashboard.widgetEditor.editorTags.hint.${mode}`) }}
                </q-banner>
                <WidgetEditorParameters v-if="mode === 'parameters'" :dashboard-id="dashboardId" @insertChanged="onInsertChanged" />
                <WidgetEditorVariables v-else-if="mode === 'variables'" :variables="variables" @insertChanged="onInsertChanged" />
                <WidgetEditorInternationalization v-else-if="mode === 'internationalization'" @insertChanged="onInsertChanged" />
                <WidgetEditorRepeater v-else-if="mode === 'repeater'" :widget-model="widgetModel" @insertChanged="onInsertChanged" />
                <WidgetEditorRepeatIndex v-else-if="mode === 'repeatIndex'" :widget-model="widgetModel" />
                <WidgetEditorCalculator v-else-if="mode === 'calculator'" @insertChanged="onInsertChanged" />
                <WidgetEditorPreview v-else-if="mode === 'preview'" :widget-model="widgetModel" :selected-datasets="selectedDatasets" @insertChanged="onInsertChanged" />
                <WidgetEditorConditionalContainer v-else-if="mode === 'conditional'" @insertChanged="onInsertChanged" />
                <WidgetEditorActiveSelections v-else-if="mode === 'activesel'" :widget-model="widgetModel" @insertChanged="onInsertChanged" />
                <WidgetEditorSelection v-else-if="mode === 'selection'" :widget-model="widgetModel" @insertChanged="onInsertChanged" />
                <WidgetEditorColumnData v-else-if="mode === 'columnsData'" :widget-model="widgetModel" @insertChanged="onInsertChanged" />
                <WidgetEditorCrossNavigation v-else-if="mode === 'crossnav'" :widget-model="widgetModel" @insertChanged="onInsertChanged" />
                <WidgetEditorIframeMessage v-else-if="mode === 'iframe'" :widget-model="widgetModel" @insertChanged="onInsertChanged" />
            </q-card-section>
            <q-separator />
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                <q-btn color="primary" :label="$t('common.add')" :disable="!forInsert" @click="addInsert" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import WidgetEditorParameters from './options/WidgetEditorParameters.vue'
import WidgetEditorActiveSelections from './options/WidgetEditorActiveSelections.vue'
import WidgetEditorVariables from './options/WidgetEditorVariables.vue'
import WidgetEditorRepeater from './options/WidgetEditorRepeater.vue'
import WidgetEditorRepeatIndex from './options/WidgetEditorRepeatIndex.vue'
import WidgetEditorConditionalContainer from './options/WidgetEditorConditionalContainer.vue'
import WidgetEditorCalculator from './options/WidgetEditorCalculator.vue'
import WidgetEditorInternationalization from './options/WidgetEditorInternationalization.vue'
import WidgetEditorPreview from './options/WidgetEditorPreview.vue'
import WidgetEditorSelection from './options/WidgetEditorSelection.vue'
import WidgetEditorColumnData from './options/WidgetEditorColumnData.vue'
import WidgetEditorCrossNavigation from './options/WidgetEditorCrossNavigation.vue'
import WidgetEditorIframeMessage from './options/WidgetEditorIframeMessage.vue'

export default defineComponent({
    name: 'widget-tags-dialog',
    components: {
        WidgetEditorParameters,
        WidgetEditorActiveSelections,
        WidgetEditorVariables,
        WidgetEditorRepeater,
        WidgetEditorRepeatIndex,
        WidgetEditorConditionalContainer,
        WidgetEditorCalculator,
        WidgetEditorInternationalization,
        WidgetEditorPreview,
        WidgetEditorSelection,
        WidgetEditorColumnData,
        WidgetEditorCrossNavigation,
        WidgetEditorIframeMessage
    },
    props: {
        visible: Boolean,
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        mode: { type: String, required: true },
        widgetType: String,
        variables: { type: Array as PropType<IVariable[]>, required: true },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    emits: ['close', 'insert'],
    data() {
        return {
            forInsert: '' as string
        }
    },
    watch: {
        mode() {
            this.setInitialInsertValue()
        }
    },
    created() {
        this.setInitialInsertValue()
    },
    methods: {
        setInitialInsertValue() {
            switch (this.mode) {
                case 'repeatIndex':
                    if (this.widgetModel.dataset) this.forInsert = '[kn-repeat-index]'
                    break
                default:
                    this.forInsert = ''
            }
        },
        onInsertChanged(value: string) {
            this.forInsert = value
        },
        addInsert() {
            this.$emit('insert', this.forInsert, this.mode)
        },
        closeDialog() {
            this.forInsert = ''
            this.$emit('close')
        }
    }
})
</script>
