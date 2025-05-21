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
            <WidgetEditorFunctionsList class="p-lg-3" :prop-functions="functions" :propSelectedFunction="selectedFunction" @selectedFunction="onSelectedFunction"></WidgetEditorFunctionsList>
            <WidgetEditorFunctionsForm class="p-lg-9" :propFunctionColumn="functionColumn" :prop-function="selectedFunction" :selected-dataset="selectedDataset" :python-environments="[]" :libraries="[]"></WidgetEditorFunctionsForm>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
            <Button class="kn-button kn-button--primary" :disabled="functionColumnInvalid" @click="save"> {{ $t('common.save') }}</Button>
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
    props: { propFunctionColumn: { type: Object as PropType<IWidgetFunctionColumn | null>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null>, required: true }, editMode: { type: Boolean } },
    emits: ['close', 'save'],
    data() {
        return {
            descriptor,
            functionColumn: null as IWidgetFunctionColumn | null,
            functions: [] as iFunction[],
            selectedFunction: null as iFunction | null
        }
    },
    computed: {
        functionColumnInvalid(): boolean {
            return this.functionColumn == null || !this.checkColumnsConfiguration() || !this.checkVariablesConfiguration() || !this.functionColumn.catalogFunctionConfig.environment
        }
    },
    watch: {
        propFunctionColumn() {
            this.loadFunctionColumn()
        },
        'functionColumn.catalogFunctionConfig.inputColumns': {
            handler() {},
            deep: true
        },
        'functionColumn.catalogFunctionConfig.inputVariables': {
            handler() {},
            deep: true
        }
    },
    async created() {
        await this.loadFunctions()
        this.loadFunctionColumn()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadFunctionColumn() {
            this.functionColumn = this.propFunctionColumn
            this.loadPreselectedFunction()
        },
        loadPreselectedFunction() {
            if (!this.functionColumn?.catalogFunctionId) return
            const tempFunction = this.functions.find((tempFunction: iFunction) => tempFunction.id === this.functionColumn?.catalogFunctionId)
            if (tempFunction) this.selectedFunction = tempFunction
        },
        async loadFunctions() {
            this.setLoading(true)
            this.functions = await loadFunctionsData(this.$http)
            this.setLoading(false)
        },
        onSelectedFunction(tempFunction: iFunction) {
            this.selectedFunction = tempFunction
            this.updateFunctionColumnWithSelectedFunctionInfo()
        },
        updateFunctionColumnWithSelectedFunctionInfo() {
            if (!this.functionColumn || !this.selectedFunction) return
            this.functionColumn.alias = this.selectedFunction.name
            this.functionColumn.columnName = this.selectedFunction.name
            this.functionColumn.orderColumn = this.selectedFunction.name
            if (this.selectedFunction.id) this.functionColumn.catalogFunctionId = this.selectedFunction.id
            this.functionColumn.catalogFunctionConfig.inputColumns = [...this.selectedFunction.inputColumns]
            this.functionColumn.catalogFunctionConfig.inputVariables = [...this.selectedFunction.inputVariables]
            this.functionColumn.catalogFunctionConfig.outputColumns = [...this.selectedFunction.outputColumns]
        },
        checkColumnsConfiguration() {
            if (!this.functionColumn || !this.functionColumn.catalogFunctionConfig) return false

            return this.functionColumn.catalogFunctionConfig.inputColumns.every((col) => col.dsColumn)
        },
        checkVariablesConfiguration() {
            if (!this.functionColumn || !this.functionColumn.catalogFunctionConfig) return false

            return this.functionColumn.catalogFunctionConfig.inputVariables.every((v) => v.value)
        },
        closeDialog() {
            this.$emit('close')
            this.functionColumn = null
        },
        save() {
            this.$emit('save', this.functionColumn)
        }
    }
})
</script>
