<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="descriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('dashboard.widgetEditor.catalogFunction') }}
                </template>
            </Toolbar>
        </template>

        <div class="p-formgrid p-grid p-pt-2">
            <WidgetEditorFunctionsList class="p-lg-3" :prop-functions="functions" @selectedFunction="onSelectedFunction"></WidgetEditorFunctionsList>
            <WidgetEditorFunctionsForm class="p-lg-9" :propFunctionColumn="propFunctionColumn" :prop-function="selectedFunction" :selected-dataset="selectedDataset" :python-environments="[]" :libraries="[]"></WidgetEditorFunctionsForm>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
            <Button class="kn-button kn-button--primary" data-test="save-button" @click="save"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iFunction } from '../../../../../../../managers/functionsCatalog/FunctionsCatalog'
import { loadFunctionsData } from './WidgetEditorFunctionsDialogHelper'
import { IDataset, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import descriptor from './WidgetEditorFunctionsDialogDescriptor.json'
import Dialog from 'primevue/dialog'
import WidgetEditorFunctionsList from './WidgetEditorFunctionsList.vue'
import WidgetEditorFunctionsForm from './WidgetEditorFunctionsForm.vue'

export default defineComponent({
    name: 'widget-editor-functions-dialog',
    components: { Dialog, WidgetEditorFunctionsList, WidgetEditorFunctionsForm },
    props: { propFunctionColumn: { type: Object as PropType<IWidgetFunctionColumn | null>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null>, required: true } },
    emits: ['close'],
    data() {
        return {
            descriptor,
            functions: [] as iFunction[],
            selectedFunction: null as iFunction | null
        }
    },
    computed: {},
    watch: {},
    async created() {
        await this.loadFunctions()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        async loadFunctions() {
            this.setLoading(true)
            this.functions = await loadFunctionsData(this.$http)
            this.setLoading(false)
        },
        onSelectedFunction(tempFunction: iFunction) {
            this.selectedFunction = tempFunction
        },
        closeDialog() {
            this.$emit('close')
        },
        save() {
            console.log('----- SAVE CLICKED! ')
        }
    }
})
</script>
