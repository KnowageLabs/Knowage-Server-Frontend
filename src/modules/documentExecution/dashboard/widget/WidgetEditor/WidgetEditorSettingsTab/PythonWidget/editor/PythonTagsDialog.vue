<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary widget-tags-dialog" :style="descriptor.dialogStyle" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary">
                <template #start>
                    {{ $t(`dashboard.widgetEditor.editorTags.${mode}`) }}
                </template>
            </Toolbar>
        </template>

        <div class="tags-dialog-content p-mx-2">
            <Message severity="info" :closable="false" :style="descriptor.hintStyle">
                {{ $t(`dashboard.widgetEditor.python.tagsDialog.hint.${mode}`) }}
            </Message>

            <PythonEditorColumnData v-if="mode === 'columnsData'" :widget-model="widgetModel" :selected-datasets="selectedDatasets" @insertChanged="onInsertChanged"></PythonEditorColumnData>
            <PythonEditorParameter v-else-if="mode === 'parameters'" :dashboard-id="dashboardId" @insertChanged="onInsertChanged"></PythonEditorParameter>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--secondary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
            <Button class="kn-button kn-button--primary" :disabled="!forInsert" @click="addInsert"> {{ $t('common.add') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import Dialog from 'primevue/dialog'
import descriptor from './PythonWidgetEditorDescriptor.json'
import Message from 'primevue/message'
import PythonEditorColumnData from './options/PythonEditorColumnData.vue'
import PythonEditorParameter from './options/PythonEditorParameter.vue'

export default defineComponent({
    name: 'python-tags-dialog',
    components: { Dialog, Message, PythonEditorColumnData, PythonEditorParameter },
    props: {
        visible: { type: Boolean },
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        mode: { type: String, required: true },
        widgetType: { type: String, required: true },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    emits: ['close', 'insert'],
    data() {
        return {
            descriptor,
            forInsert: '' as string
        }
    },
    created() {},

    methods: {
        onInsertChanged(value: string) {
            console.log('--------- onInsertChanged: ', value)
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

<style lang="scss">
.widget-tags-dialog .p-dialog-content {
    padding: 0;
}
</style>
