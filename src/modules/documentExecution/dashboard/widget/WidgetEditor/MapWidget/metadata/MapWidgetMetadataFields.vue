<template>
    <div class="column col">
        <div v-for="field in layerFields" :key="field.name" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm items-center">
                    <div class="col">
                        <q-input dense outlined :disable="true" v-model="field.alias" :label="$t('common.column')" hide-bottom-space />
                    </div>
                    <div class="col">
                        <q-select dense outlined :disable="true" v-model="field.fieldType" :options="descriptor.columnTypeOptions" :label="$t('common.type')" hide-bottom-space />
                    </div>
                    <div v-if="field.fieldType === 'MEASURE' && !field.formula" class="col">
                        <q-select dense outlined v-model="field.aggregationSelected" :options="descriptor.columnAggregationOptions" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.aggregation')" hide-bottom-space @update:model-value="onFieldConfigurationChanged" />
                    </div>
                    <div v-if="showAggregateByToggle(field)" class="row items-center q-ml-sm">
                        <span class="text-caption q-mr-xs">{{ $t('dashboard.widgetEditor.map.metadata.aggregateBy') }}</span>
                        <q-toggle v-model="field.properties.aggregateBy" dense @update:model-value="onFieldConfigurationChanged" />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn v-if="field.formula" flat round dense icon="edit" size="sm" @click="editField(field)" />
                <q-btn v-if="field.fieldType !== 'SPATIAL_ATTRIBUTE'" flat round dense icon="delete" size="sm" @click="removeField(field)" />
            </div>
        </div>

        <MapWidgetMetadataNewFieldDialog v-if="addNewFieldDialogVisible" :visible="addNewFieldDialogVisible" :prop-fields="fields" @addSelectedFields="onAddSelectedFields" @close="addNewFieldDialogVisible = false"></MapWidgetMetadataNewFieldDialog>
        <KnBlockly v-if="calcFieldDialogVisible" :fields="calcFieldColumns" :variables="variables" :field-name="selectedCalcField?.alias || ''" :initial-state="getCalcFieldInitialState(selectedCalcField)" :lock-saved-mode="shouldLockCalcFieldMode(selectedCalcField)" v-model:visibility="calcFieldDialogVisible" @save="onCalcFieldSave" @cancel="calcFieldDialogVisible = false"></KnBlockly>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { removeColumnFromModel } from '../MapWidgetLayersTabListHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './MapWidgetMetadataDescriptor.json'
import MapWidgetMetadataNewFieldDialog from './MapWidgetMetadataNewFieldDialog.vue'
import KnBlockly from '@/components/UI/KnBlockly/KnBlockly.vue'

export default defineComponent({
    name: 'map-widget-metadata-fields',
    components: { MapWidgetMetadataNewFieldDialog, KnBlockly },
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

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
