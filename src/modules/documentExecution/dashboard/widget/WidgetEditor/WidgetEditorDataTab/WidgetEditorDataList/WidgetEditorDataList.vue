<template>
    <div v-if="widgetModel" class="dashboard-editor-list-card-container p-m-3">
        <span class="p-float-label p-mx-2 p-mt-4 p-mb-1">
            <Dropdown id="dataset" v-model="selectedDataset" class="kn-material-input kn-width-full" :options="datasetOptions" option-label="label" @change="onDatasetSelected"></Dropdown>
            <label for="dataset" class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.selectDataset') }} </label>
        </span>
        <div v-if="widgetModel.type !== 'selector'" class="p-col-12 p-d-flex">
            <label class="kn-material-input-label p-as-center p-ml-1 p-mr-auto"> {{ $t('common.columns') }} </label>

            <q-btn v-if="isEnterprise && !isTextOrHTMLWidget && !isSolrDataset" color="primary" class="kn-cursor-pointer p-ml-auto p-mr-1" :label="$t('common.add')">
                <q-menu>
                    <q-list style="min-width: 100px">
                        <q-item clickable v-close-popup @click="createNewCalcField">
                            <q-item-section>{{ $t('common.addCalculatedField') }}</q-item-section>
                        </q-item>
                        <q-item v-if="widgetModel.type !== 'python'" clickable v-close-popup :disable="createNewFormulaDisabled" @click="createNewFormulaField">
                            <q-item-section>{{ $t('dashboard.widgetEditor.addFunction') }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>

            <Button v-else-if="!isTextOrHTMLWidget && !isSolrDataset" :label="$t('common.addColumn')" icon="pi pi-plus-circle" class="p-button-outlined p-ml-auto p-mr-1" data-test="new-button" @click="createNewCalcField"></Button>
            <Button id="add-all-columns-button" icon="fa fa-arrow-right" class="p-button-text p-button-rounded p-button-plain" @click="addAllColumnsToWidgetModel" />
        </div>

        <Listbox v-if="selectedDataset" class="kn-list kn-list-no-border-right dashboard-editor-list" :options="selectedDatasetColumns" :filter="true" :filter-placeholder="$t('common.search')" :filter-fields="descriptor.filterFields" :empty-filter-message="$t('common.info.noDataFound')">
            <template #empty>{{ $t('common.info.noDataFound') }}</template>
            <template #option="slotProps">
                <div class="kn-list-item kn-draggable" draggable="true" :style="dataListDescriptor.style.list.listItem" data-test="list-item" @dragstart="onDragStart($event, slotProps.option)">
                    <i class="pi pi-bars" :style="dataListDescriptor.style.list.listIcon"></i>
                    <i :style="dataListDescriptor.style.list.listIcon" :class="slotProps.option.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'" class="p-ml-2"></i>
                    <div class="kn-list-item-text">
                        <span v-tooltip.top="slotProps.option.alias" class="dashboard-editor-list-alias-container">{{ slotProps.option.alias }}</span>
                    </div>
                </div>
            </template>
        </Listbox>
    </div>
    <KnCalculatedField v-if="calcFieldDialogVisible" v-model:template="selectedCalcField" v-model:visibility="calcFieldDialogVisible" :fields="calcFieldColumns" :validation="true" :variables="variables" :descriptor="calcFieldDescriptor" :prop-calc-field-functions="availableFunctions" :read-only="false" :valid="true" source="dashboard" :prop-nullif-function="datasetFunctions.nullifFunction" @save="onCalcFieldSave" @cancel="calcFieldDialogVisible = false">
    </KnCalculatedField>

    <WidgetEditorFunctionsDialog v-if="functionsDialogVisible" :visible="functionsDialogVisible" :prop-function-column="selectedFunctionColumn" :selected-dataset="selectedDatasetForFunctions" :edit-mode="functionsDialogEditMode" @close="onFunctionsDialogClosed" @save="onFunctionsColumnSave"></WidgetEditorFunctionsDialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDataset, IDatasetColumn, IDataset, IWidget, IWidgetColumn, IVariable, IWidgetFunctionColumn } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import { removeColumnFromDiscoveryWidgetModel } from '../../helpers/discoveryWidget/DiscoveryWidgetFunctions'
import descriptor from './WidgetEditorDataListDescriptor.json'
import Dropdown from 'primevue/dropdown'
import mainStore from '../../../../../../../App.store'
import Listbox from 'primevue/listbox'
import dataListDescriptor from '../../../../dataset/DatasetEditorDataTab/DatasetEditorDataList/DatasetEditorDataListDescriptor.json'
import KnCalculatedField from '@/components/functionalities/KnCalculatedField/KnCalculatedField.vue'
import calcFieldDescriptor from './WidgetEditorCalcFieldDescriptor.json'
import { AxiosResponse } from 'axios'
import { createNewWidgetColumn } from '../../helpers/WidgetEditorHelpers'
import { mapState } from 'pinia'
import WidgetEditorFunctionsDialog from './WidgetEditorFunctionsDialog/WidgetEditorFunctionsDialog.vue'
import { createNewFunctionColumn } from './WidgetEditorFunctionsDialog/WidgetEditorFunctionsDialogHelper'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'widget-editor-data-list',
    components: { Dropdown, Listbox, KnCalculatedField, WidgetEditorFunctionsDialog },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array }, selectedDatasets: { type: Array as PropType<IDataset[]> }, variables: { type: Array as PropType<IVariable[]>, required: true } },
    emits: ['datasetSelected', 'selectedDatasetColumnsChanged'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            descriptor,
            dataListDescriptor,
            model: null as IWidget | null,
            datasetOptions: [] as IDashboardDataset[],
            selectedDataset: null as IDashboardDataset | null,
            selectedDatasetColumns: [] as IDatasetColumn[],
            calcFieldDescriptor,
            calcFieldDialogVisible: false,
            calcFieldColumns: [] as any,
            selectedCalcField: null as any,
            calcFieldFunctionsToShow: [] as any,
            datasetFunctions: {} as {
                availableFunctions: string[]
                nullifFunction: string[]
            },
            availableFunctions: [] as any,
            functionsDialogVisible: false,
            selectedDatasetForFunctions: null as IDataset | null,
            selectedFunctionColumn: null as IWidgetFunctionColumn | null,
            functionsDialogEditMode: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        createNewFormulaDisabled() {
            if (!this.widgetModel) return true
            return this.widgetModel.columns.some((col: IWidgetColumn) => col.type === 'pythonFunction')
        },
        isTextOrHTMLWidget() {
            return this.widgetModel.type === 'text' || this.widgetModel.type === 'html'
        },
        isSolrDataset() {
            if (!this.selectedDatasets?.length || !this.selectedDataset?.id) return false

            const dataset = this.selectedDatasets.find((dataset) => dataset.id?.dsId === this.selectedDataset?.id)
            return dataset?.type === 'SbiSolrDataSet'
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        }
    },
    created() {
        this.setEventListeners()
        this.loadDatasets()
        this.loadModel()
        this.loadSelectedDataset()
        if (this.selectedDataset) this.loadAvailableFunctions(this.selectedDataset)
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        async loadAvailableFunctions(dataset: IDashboardDataset | null) {
            if (!dataset) return
            this.store.setLoading(true)

            const datasetForType = this.datasets?.filter((x) => x.label == dataset.label)
            if (datasetForType && datasetForType.length > 0) {
                const datasetType = datasetForType[0].type
                this.availableFunctions = JSON.parse(JSON.stringify(calcFieldDescriptor.availableFunctions)).filter((x) => !x.exclude?.includes(datasetType))
            } else {
                this.availableFunctions = JSON.parse(JSON.stringify(calcFieldDescriptor.availableFunctions))
            }
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/availableFunctions/${dataset.id}?useCache=false`)
                .then((response: AxiosResponse<any>) => {
                    this.datasetFunctions = response.data

                    calcFieldDescriptor.additionalFunctions.forEach((x: any) => {
                        if (this.datasetFunctions.availableFunctions.includes(x.name)) {
                            this.availableFunctions.push(x)
                        }
                    })
                })
                .catch(() => {})
            this.store.setLoading(false)
        },
        setEventListeners() {
            emitter.on('editCalculatedField', this.editCalcField)
            emitter.on('editFunctionColumn', this.editFunctionColumn)
        },
        removeEventListeners() {
            emitter.off('editCalculatedField', this.editCalcField)
            emitter.off('editFunctionColumn', this.editFunctionColumn)
        },
        loadDatasets() {
            this.datasetOptions = []
            this.selectedDatasets?.forEach((dataset: IDataset) => {
                if ((this.widgetModel.type === 'discovery' && dataset.type === 'SbiSolrDataSet') || this.widgetModel.type !== 'discovery') {
                    this.datasetOptions.push({
                        id: dataset.id.dsId,
                        label: dataset.label,
                        cache: dataset.cache ?? false,
                        indexes: dataset.indexes,
                        parameters: dataset.parameters
                    })
                }
            })
        },
        loadModel() {
            this.model = this.widgetModel
            if (this.datasetOptions.length === 1) {
                this.selectedDataset = this.datasetOptions[0]
                this.onDatasetSelected()
            }
            this.loadDatasetColumns()
            this.loadSelectedDatasetForFunctions()
        },
        loadSelectedDataset() {
            const index = this.datasetOptions?.findIndex((dataset: IDashboardDataset) => dataset.id === this.model?.dataset)
            if (index !== -1) {
                this.selectedDataset = this.datasetOptions[index]
                console.log('selectedDataset', this.selectedDataset)
                this.$emit('datasetSelected', this.selectedDataset)
            }
            this.loadDatasetColumns()
            this.loadSelectedDatasetForFunctions()
        },
        onDatasetSelected() {
            console.log('onDatasetSelected', this.selectedDataset)
            if (this.availableFunctions.length === 0) this.loadAvailableFunctions(this.selectedDataset)
            this.loadDatasetColumns()
            if (this.model) {
                const previousDatasetId = this.model.dataset
                const newDatasetId = this.selectedDataset ? this.selectedDataset.id : null
                if (previousDatasetId !== newDatasetId) this.removeSelectedColumnsFromModel()
                this.model.dataset = newDatasetId
            }
            this.loadSelectedDatasetForFunctions()
            this.$emit('datasetSelected', this.selectedDataset)
            emitter.emit('clearWidgetData', this.widgetModel.id)
            emitter.emit('reloadChartColumns', this.widgetModel.id)
        },
        addAllColumnsToWidgetModel() {
            const formattedColumns = [] as IWidgetColumn[]
            this.selectedDatasetColumns.forEach((column: IDatasetColumn) => {
                formattedColumns.push(createNewWidgetColumn({ name: column.name, alias: column.alias, type: column.type, fieldType: column.fieldType }, this.model ? this.model.type : ''))
            })

            formattedColumns.forEach((column: IWidgetColumn) => {
                const index = this.model?.columns.findIndex((modelColumn: IWidgetColumn) => modelColumn.columnName === column.columnName)
                if (index === -1) {
                    this.model?.columns.push(column)
                    emitter.emit('columnAdded', column)
                }
            })
        },
        removeSelectedColumnsFromModel() {
            if (!this.model?.columns) return
            for (let i = 0; i < this.model.columns.length; i++) {
                emitter.emit('columnRemoved', this.model.columns[i])
                if (this.widgetModel.type === 'discovery') removeColumnFromDiscoveryWidgetModel(this.widgetModel, this.model.columns[i])
            }
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
            this.model.columns = []
        },
        loadDatasetColumns() {
            this.selectedDatasetColumns = []
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return

            const index = this.selectedDatasets.findIndex((dataset: any) => dataset.id?.dsId === this.selectedDataset?.id)
            if (index !== -1) this.addSelectedDatasetColumnsFromMetadata(this.selectedDatasets[index].metadata.fieldsMeta)
            this.$emit('selectedDatasetColumnsChanged', this.selectedDatasetColumns)
        },
        addSelectedDatasetColumnsFromMetadata(fieldsMeta: any[]) {
            for (let i = 0; i < fieldsMeta.length; i++) {
                if (this.widgetModel.type !== 'selector' || fieldsMeta[i].fieldType === 'ATTRIBUTE') this.selectedDatasetColumns.push({ ...fieldsMeta[i], dataset: this.selectedDataset?.id })
            }
        },
        onDragStart(event: any, datasetColumn: IDatasetColumn) {
            event.dataTransfer.setData('text/plain', JSON.stringify(datasetColumn))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        createNewCalcField() {
            this.createCalcFieldColumns()
            this.selectedCalcField = { alias: '', expression: '', format: undefined, nature: 'ATTRIBUTE', type: 'STRING' } as any
            this.calcFieldDialogVisible = true
        },
        editCalcField(calcField) {
            this.createCalcFieldColumns()
            this.selectedCalcField = calcField
            this.calcFieldDialogVisible = true
        },
        createCalcFieldColumns() {
            this.calcFieldColumns = []
            if (this.model?.type == 'static-pivot-table' || this.model?.type == 'ce-pivot-table') {
                const modelFields = this.model.fields as any
                const allFields = [].concat(modelFields?.columns, modelFields?.data, modelFields?.filters, modelFields?.rows) as any

                allFields.forEach((field) => {
                    if (field.fieldType === 'MEASURE' && !field.formula) this.calcFieldColumns.push({ fieldAlias: `${field.alias}`, fieldLabel: field.columnName })
                })
            } else {
                this.model?.columns.forEach((field) => {
                    if (field.fieldType === 'MEASURE' && !field.formula) this.calcFieldColumns.push({ fieldAlias: `${field.alias}`, fieldLabel: field.columnName })
                })
            }
        },
        onCalcFieldSave(calcFieldOutput) {
            if (this.selectedCalcField.id) {
                this.selectedCalcField.alias = calcFieldOutput.colName
                this.selectedCalcField.formula = calcFieldOutput.formula
            } else {
                emitter.emit('addNewCalculatedField', {
                    id: crypto.randomUUID(),
                    columnName: calcFieldOutput.colName,
                    alias: calcFieldOutput.colName,
                    type: 'java.lang.Double',
                    fieldType: 'MEASURE',
                    filter: {},
                    formula: calcFieldOutput.formula,
                    formulaEditor: calcFieldOutput.formula,
                    aggregation: 'SUM'
                })
            }

            this.calcFieldDialogVisible = false
        },
        createNewFormulaField() {
            this.selectedFunctionColumn = createNewFunctionColumn()
            this.functionsDialogVisible = true
        },
        onFunctionsDialogClosed() {
            this.functionsDialogVisible = false
            this.selectedFunctionColumn = null
            this.functionsDialogEditMode = false
        },
        loadSelectedDatasetForFunctions() {
            if (!this.selectedDatasets || !this.selectedDataset) return
            const dataset = this.selectedDatasets.find((tempDataset: IDataset) => tempDataset.id.dsId === this.selectedDataset?.id)
            this.selectedDatasetForFunctions = dataset ?? null
        },
        editFunctionColumn(functionColumn: any) {
            this.selectedFunctionColumn = deepcopy(functionColumn)
            this.functionsDialogEditMode = true
            this.functionsDialogVisible = true
        },
        onFunctionsColumnSave(functionColumn: IWidgetFunctionColumn) {
            this.functionsDialogVisible = false
            this.selectedFunctionColumn = null
            this.functionsDialogEditMode ? emitter.emit('functionColumnEdited', functionColumn) : emitter.emit('addNewFunctionColumn', functionColumn)
            this.functionsDialogEditMode = false
        }
    }
})
</script>

<style lang="scss" scoped>
.dashboard-editor-list-alias-container {
    font-size: 0.8rem;
}

#add-all-columns-button {
    font-size: 1.5rem;
}
</style>
