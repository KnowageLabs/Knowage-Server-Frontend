<template>
    <q-dialog :model-value="visible" persistent>
        <q-card class="column no-wrap" :style="{ ...descriptor.dialog.style, maxWidth: descriptor.dialog.style.width }">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.widgetEditor.catalogFunction') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section class="col row no-wrap q-col-gutter-md scroll">
                <WidgetEditorFunctionsList class="col-3" :prop-functions="functions" :propSelectedFunction="selectedFunction" @selectedFunction="onSelectedFunction"></WidgetEditorFunctionsList>
                <WidgetEditorFunctionsForm class="col-9" :propFunctionColumn="functionColumn" :prop-function="selectedFunction" :selected-dataset="selectedDataset"></WidgetEditorFunctionsForm>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat color="secondary" :label="$t('common.cancel')" @click="closeDialog" />
                <q-btn unelevated color="primary" :label="$t('common.save')" :disable="functionColumnInvalid" @click="save" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iFunction } from '../../../../../../../managers/functionsCatalog/FunctionsCatalog'
import { loadFunctionsData } from './WidgetEditorFunctionsDialogHelper'
import { IDataset, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import descriptor from './WidgetEditorFunctionsDialogDescriptor.json'
import WidgetEditorFunctionsList from './WidgetEditorFunctionsList.vue'
import WidgetEditorFunctionsForm from './WidgetEditorFunctionsForm.vue'

export default defineComponent({
    name: 'widget-editor-functions-dialog',
    components: { WidgetEditorFunctionsList, WidgetEditorFunctionsForm },
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
