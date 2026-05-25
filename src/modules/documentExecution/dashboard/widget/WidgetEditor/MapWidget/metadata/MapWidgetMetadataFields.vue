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
                        <div v-if="field.fieldType === 'MEASURE' && !field.formula" class="p-field p-float-label p-fluid kn-flex p-ml-2">
                            <Dropdown v-model="field.aggregationSelected" class="kn-material-input" :options="descriptor.columnAggregationOptions" option-value="value" option-label="label" @change="onFieldConfigurationChanged"></Dropdown>
                            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.aggregation') }}</label>
                        </div>
                        <div v-if="showAggregateByToggle(field)" class="p-d-flex p-ai-center p-ml-3 p-mb-2">
                            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.map.metadata.aggregateBy') }}</label>
                            <InputSwitch v-model="field.properties.aggregateBy" @change="onFieldConfigurationChanged"></InputSwitch>
                        </div>
                        <div v-if="field.fieldType !== 'SPATIAL_ATTRIBUTE'" class="p-d-flex p-flex-row p-jc-between p-ai-center p-ml-3 p-mb-2">
                            <i v-if="field.formula" class="pi pi-pencil kn-cursor-pointer p-mr-2" @click="editField(field)"></i>
                            <i class="pi pi-trash kn-cursor-pointer" @click="removeField(field)"></i>
                        </div>
                    </div>
            </div>
        </div>

        <MapWidgetMetadataNewFieldDialog v-if="addNewFieldDialogVisible" :visible="addNewFieldDialogVisible" :prop-fields="fields" @addSelectedFields="onAddSelectedFields" @close="addNewFieldDialogVisible = false"></MapWidgetMetadataNewFieldDialog>
        <KnBlockly
            v-if="calcFieldDialogVisible"
            :fields="calcFieldColumns"
            :variables="variables"
            :field-name="selectedCalcField?.alias || ''"
            :initial-state="getCalcFieldInitialState(selectedCalcField)"
            :lock-saved-mode="shouldLockCalcFieldMode(selectedCalcField)"
            v-model:visibility="calcFieldDialogVisible"
            @save="onCalcFieldSave"
            @cancel="calcFieldDialogVisible = false"
        ></KnBlockly>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { removeColumnFromModel } from '../MapWidgetLayersTabListHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './MapWidgetMetadataDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import MapWidgetMetadataNewFieldDialog from './MapWidgetMetadataNewFieldDialog.vue'
import KnBlockly from '@/components/UI/KnBlockly/KnBlockly.vue'

export default defineComponent({
    name: 'map-widget-metadata-fields',
    components: { Dropdown, InputSwitch, MapWidgetMetadataNewFieldDialog, KnBlockly },
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
            widgetModel: null as IWidget | null,
            fields: [] as IWidgetMapLayerColumn[],
            addNewFieldDialogVisible: false,
            calcFieldDialogVisible: false,
            calcFieldColumns: [] as string[],
            selectedCalcField: null as any
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
    created() {
        this.loadWidgetModel()
        this.loadFields()
    },
    methods: {
        loadWidgetModel() {
            this.widgetModel = this.propWidget
        },
        loadFields() {
            this.fields = this.propFields
            this.fields.forEach((field: IWidgetMapLayerColumn) => this.initializeFieldConfiguration(field))
        },
        addField() {
            this.addNewFieldDialogVisible = true
        },
        initializeFieldConfiguration(field: IWidgetMapLayerColumn) {
            if (!field.properties) {
                field.properties = {
                    aggregateBy: field.fieldType !== 'MEASURE',
                    coordType: '',
                    coordFormat: '',
                    showTooltip: false,
                    modal: false
                }
            } else if (field.fieldType !== 'MEASURE' && typeof field.properties.aggregateBy === 'undefined') {
                field.properties.aggregateBy = true
            }

            if (field.fieldType === 'MEASURE' && !field.aggregationSelected) field.aggregationSelected = 'NONE'
        },
        showAggregateByToggle(field: IWidgetMapLayerColumn) {
            return this.selectedLayer?.type === 'dataset' && field.fieldType !== 'MEASURE'
        },
        onFieldConfigurationChanged() {
            emitter.emit('mapFieldsUpdated')
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
        getCalcFieldInitialState(calcField: IWidgetMapLayerColumn | null) {
            if (!calcField) return null
            if (calcField.blocklyXml) return calcField.blocklyXml
            const savedDsl = calcField.formulaEditor ?? calcField.formula
            if (savedDsl) {
                return {
                    dsl: savedDsl,
                    mode: 'text'
                }
            }

            return null
        },
        shouldLockCalcFieldMode(calcField: IWidgetMapLayerColumn | null) {
            return !!this.getCalcFieldInitialState(calcField)
        },
        createNewCalcField() {
            this.createCalcFieldColumns()
            this.selectedCalcField = { alias: '', blocklyXml: null, formula: '', formulaEditor: '' } as any
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
                if (field.fieldType === 'MEASURE' && !field.formula) this.calcFieldColumns.push(field.alias)
            })
        },
        onCalcFieldSave(calcFieldOutput: { name: string; dsl: string; state: any }) {
            if (this.selectedCalcField.id) {
                this.selectedCalcField.alias = calcFieldOutput.name
                this.selectedCalcField.aliasToShow = calcFieldOutput.name
                this.selectedCalcField.formula = calcFieldOutput.dsl
                this.selectedCalcField.formulaEditor = calcFieldOutput.dsl
                this.selectedCalcField.blocklyXml = calcFieldOutput.state
            } else {
                const newCalculatedField = {
                    id: crypto.randomUUID(),
                    name: calcFieldOutput.name,
                    alias: calcFieldOutput.name,
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
                    aliasToShow: calcFieldOutput.name,
                    formula: calcFieldOutput.dsl,
                    formulaEditor: calcFieldOutput.dsl,
                    blocklyXml: calcFieldOutput.state,
                    isCalculatedField: true
                }
                this.fields.push(newCalculatedField)
            }

            this.calcFieldDialogVisible = false
            emitter.emit('mapFieldsUpdated')
        }
    }
})
</script>
