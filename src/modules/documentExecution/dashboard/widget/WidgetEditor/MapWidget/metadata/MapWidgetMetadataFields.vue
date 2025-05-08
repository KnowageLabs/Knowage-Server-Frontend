<template>
    <div class="p-grid p-jc-center p-ai-center kn-flex p-p-3">
        <div class="p-d-flex p-jc-between p-ai-center p-col-12">
            <label class="kn-material-input-label">{{ $t('common.fields') }}</label>
            <div class="p-d-flex p-ai-center">
                <Button :label="$t('common.addColumn')" icon="pi pi-plus-circle" class="p-button-outlined p-mr-2" @click="addField"></Button>
                <Button :label="$t('common.addCalculatedField')" icon="pi pi-plus-circle" class="p-button-outlined p-mr-1" @click="createNewCalcField"></Button>
            </div>
        </div>

        <div v-for="field in layerFields" :key="field.name" class="dynamic-form-item p-grid p-col-12 p-ai-center">
            <div class="p-grid p-ai-center p-mt-3 kn-width-full">
                <div class="p-col-12 p-d-flex p-flex-row">
                    <div class="p-float-label kn-flex">
                        <InputText v-model="field.alias" class="kn-material-input kn-width-full" :disabled="true" />
                        <label class="kn-material-input-label">{{ $t('common.column') }}</label>
                    </div>
                    <div class="p-field p-float-label p-fluid kn-flex p-ml-2">
                        <Dropdown v-model="field.fieldType" class="kn-material-input" :options="descriptor.columnTypeOptions" :disabled="true"></Dropdown>
                        <label class="kn-material-input-label">{{ $t('common.type') }}</label>
                    </div>
                    <div v-if="field.fieldType === 'MEASURE'" class="p-field p-float-label p-fluid kn-flex p-ml-2">
                        <Dropdown v-model="field.aggregationSelected" class="kn-material-input" :options="descriptor.columnAggregationOptions" option-value="value" option-label="label"></Dropdown>
                        <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.aggregation') }}</label>
                    </div>
                    <div v-if="field.fieldType !== 'SPATIAL_ATTRIBUTE'" class="p-d-flex p-flex-row p-jc-between p-ai-center p-ml-3 p-mb-2">
                        <i v-if="field.formula" class="pi pi-pencil kn-cursor-pointer p-mr-2" @click="editField(field)"></i>
                        <i class="pi pi-trash kn-cursor-pointer" @click="removeField(field)"></i>
                    </div>
                </div>
            </div>
        </div>

        <MapWidgetMetadataNewFieldDialog v-if="addNewFieldDialogVisible" :visible="addNewFieldDialogVisible" :prop-fields="fields" @addSelectedFields="onAddSelectedFields" @close="addNewFieldDialogVisible = false"></MapWidgetMetadataNewFieldDialog>
        <KnCalculatedField
            v-if="calcFieldDialogVisible"
            v-model:template="selectedCalcField"
            v-model:visibility="calcFieldDialogVisible"
            :fields="calcFieldColumns"
            :validation="true"
            :variables="variables"
            :descriptor="calcFieldDescriptor"
            :prop-calc-field-functions="availableFunctions"
            :read-only="false"
            :valid="true"
            source="dashboard"
            :prop-nullif-function="datasetFunctions.nullifFunction"
            @save="onCalcFieldSave"
            @cancel="calcFieldDialogVisible = false"
        >
        </KnCalculatedField>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { AxiosResponse } from 'axios'
import { removeColumnFromModel } from '../MapWidgetLayersTabListHelper'
import { mapActions } from 'pinia'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './MapWidgetMetadataDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import MapWidgetMetadataNewFieldDialog from './MapWidgetMetadataNewFieldDialog.vue'
import KnCalculatedField from '@/components/functionalities/KnCalculatedField/KnCalculatedField.vue'
import calcFieldDescriptor from './MapWidgetMetadataFieldsCalcFieldDescriptor.json'
import appStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'map-widget-metadata-fields',
    components: { Dropdown, InputSwitch, MapWidgetMetadataNewFieldDialog, KnCalculatedField },
    props: {
        propFields: {
            type: Array as PropType<IWidgetMapLayerColumn[]>,
            required: true
        },
        selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, required: true },
        propWidget: { type: Object as PropType<IWidget>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            descriptor,
            calcFieldDescriptor,
            widgetModel: null as IWidget | null,
            fields: [] as IWidgetMapLayerColumn[],
            addNewFieldDialogVisible: false,
            calcFieldDialogVisible: false,
            calcFieldColumns: [] as any,
            selectedCalcField: null as any,
            datasetFunctions: {} as {
                availableFunctions: string[]
                nullifFunction: string[]
            },
            availableFunctions: [] as any
        }
    },
    computed: {
        layerFields() {
            return this.fields.filter((field: IWidgetMapLayerColumn) => !field.deleted)
        }
    },
    watch: {
        propWidget() {
            this.loadWidgetModel()
        },
        propFields() {
            this.loadFields()
        }
    },
    async created() {
        this.loadWidgetModel()
        this.loadFields()
        await this.loadAvailableFunctions()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        ...mapActions(dashboardStore, ['getAllDatasets']),
        loadWidgetModel() {
            this.widgetModel = this.propWidget
        },
        loadFields() {
            this.fields = this.propFields
        },
        addField() {
            this.addNewFieldDialogVisible = true
        },
        removeField(field: IWidgetMapLayerColumn) {
            const index = this.fields.findIndex((tempField: IWidgetMapLayerColumn) => tempField.name === field.name)
            if (index !== -1) {
                field.formula ? this.fields.splice(index, 1) : (this.fields[index].deleted = true)
                removeColumnFromModel(this.selectedLayer, field, this.widgetModel)
            }
            emitter.emit('mapFieldsUpdated')
        },
        onAddSelectedFields(fields: IWidgetMapLayerColumn[]) {
            fields.forEach((field: IWidgetMapLayerColumn) => {
                const index = this.fields.findIndex((tempField: IWidgetMapLayerColumn) => tempField.name === field.name)
                if (index !== -1) this.fields[index].deleted = false
            })
            this.addNewFieldDialogVisible = false
            emitter.emit('mapFieldsUpdated')
        },
        async loadAvailableFunctions() {
            if (!this.selectedLayer) return

            this.setLoading(true)

            const datasets = this.getAllDatasets()
            const datasetForType = datasets?.filter((x) => x.label == this.selectedLayer?.name)
            if (datasetForType && datasetForType.length > 0) {
                const datasetType = datasetForType[0].type
                this.availableFunctions = JSON.parse(JSON.stringify(calcFieldDescriptor.availableFunctions)).filter((x) => !x.exclude?.includes(datasetType))
            } else {
                this.availableFunctions = JSON.parse(JSON.stringify(calcFieldDescriptor.availableFunctions))
            }

            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/availableFunctions/${this.selectedLayer.id}?useCache=false`)
                .then((response: AxiosResponse<any>) => {
                    this.datasetFunctions = response.data

                    calcFieldDescriptor.additionalFunctions.forEach((x: any) => {
                        if (this.datasetFunctions.availableFunctions.includes(x.name)) {
                            this.availableFunctions.push(x)
                        }
                    })
                })
                .catch(() => {})

            this.setLoading(false)
        },
        createNewCalcField() {
            this.createCalcFieldColumns()
            this.selectedCalcField = { alias: '', expression: '', format: undefined, nature: 'ATTRIBUTE', type: 'STRING' } as any
            this.calcFieldDialogVisible = true
        },
        editField(field: IWidgetMapLayerColumn) {
            if (field.formula) this.editCalcField(field)
        },
        editCalcField(field: IWidgetMapLayerColumn) {
            this.createCalcFieldColumns()
            this.selectedCalcField = { ...field }
            this.calcFieldDialogVisible = true
        },
        createCalcFieldColumns() {
            this.calcFieldColumns = []

            this.fields.forEach((field) => {
                if (field.fieldType === 'MEASURE' && !field.formula) this.calcFieldColumns.push({ fieldAlias: `${field.alias}`, fieldLabel: field.alias })
            })
        },
        onCalcFieldSave(calcFieldOutput: { colName: string; formula: string }) {
            if (this.selectedCalcField.id) {
                this.selectedCalcField.newCalculatedField = calcFieldOutput.colName
                this.selectedCalcField.alias = calcFieldOutput.colName
                this.selectedCalcField.formula = calcFieldOutput.formula
            } else {
                const newCalculatedField = {
                    id: crypto.randomUUID(),
                    name: calcFieldOutput.colName,
                    alias: calcFieldOutput.colName,
                    type: 'java.lang.Double',
                    properties: {
                        aggregateBy: false,
                        coordType: '',
                        coordFormat: '',
                        showTooltip: false,
                        modal: false
                    },
                    fieldType: 'MEASURE',
                    multiValue: false,
                    precision: 2,
                    scale: 0,
                    personal: false,
                    decrypt: false,
                    subjectId: false,
                    aliasToShow: calcFieldOutput.colName,
                    formula: calcFieldOutput.formula
                }
                this.fields.push(newCalculatedField)
            }

            this.calcFieldDialogVisible = false
            emitter.emit('mapFieldsUpdated')
        }
    }
})
</script>
