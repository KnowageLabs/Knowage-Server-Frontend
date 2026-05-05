<template>
    <div v-if="visualizationTypeModel" class="q-px-md q-pb-md">
        <!-- Global Settings (index 0 = All Columns) -->
        <div v-if="visualizationTypeModel.types.length > 0" class="q-mb-md">
            <div>
                <div class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-12">
                        <q-select :model-value="descriptor.allColumnOption[0].value" :options="descriptor.allColumnOption" option-value="value" option-label="label" emit-value map-options outlined dense disable />
                    </div>
                    <div class="col-6">
                        <q-select v-model="visualizationTypeModel.types[0].type" :options="translatedVisualizationTypeOptions(visualizationTypeModel.types[0])" option-value="value" option-label="label" emit-value map-options :label="$t('common.type')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                    <div class="col-6">
                        <q-select v-model="visualizationTypeModel.types[0].pinned" :options="translatedPinnedOptions" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.pinned')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                </div>
                <div v-if="hasTextFields(visualizationTypeModel.types[0])" class="row q-col-gutter-sm q-mb-sm">
                    <div v-if="visualizationTypeModel.types[0].type && visualizationTypeModel.types[0].type !== 'Bar'" class="col-3">
                        <q-input v-model="visualizationTypeModel.types[0].prefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense :disable="visualizationTypeDisabled" @change="visualizationTypeChanged" />
                    </div>
                    <div v-if="visualizationTypeModel.types[0].type && visualizationTypeModel.types[0].type !== 'Bar'" class="col-3">
                        <q-input v-model="visualizationTypeModel.types[0].suffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense :disable="visualizationTypeDisabled" @change="visualizationTypeChanged" />
                    </div>
                    <div v-if="(optionsContainMeasureColumn(visualizationTypeModel.types[0]) && visualizationTypeModel.types[0].type === 'Text') || visualizationTypeModel.types[0].type === 'Text & Icon'" class="col-3">
                        <q-input v-model.number="visualizationTypeModel.types[0].precision" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div v-if="visualizationTypeModel.types[0].type === 'Text' || visualizationTypeModel.types[0].type === 'Text & Icon'" class="col-3">
                        <q-input v-model.number="visualizationTypeModel.types[0].maximumCharacters" type="number" :label="$t('dashboard.widgetEditor.visualizationType.maximumCharacters')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div v-if="optionsContainTimestampColumn(visualizationTypeModel.types[0])" class="col-6">
                        <q-select v-model="visualizationTypeModel.types[0].dateFormat" :options="dateFormatOptions" option-value="value" option-label="label" emit-value map-options :label="$t('managers.datasetManagement.ckanDateFormat')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                </div>
                <div v-if="optionsContainMeasureColumn(visualizationTypeModel.types[0]) && ['Bar', 'Sparkline', 'Bar & Text'].includes(visualizationTypeModel.types[0].type)" class="row q-col-gutter-sm items-end q-mb-sm">
                    <div class="col-2">
                        <q-input v-model.number="visualizationTypeModel.types[0].min" type="number" :label="$t('common.min')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div class="col-2">
                        <q-input v-model.number="visualizationTypeModel.types[0].max" type="number" :label="$t('common.max')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div class="col-4">
                        <q-select v-model="visualizationTypeModel.types[0].alignment" :options="translatedAlignmentOptions" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.alignment')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                    <div class="col-auto">
                        <WidgetEditorStyleToolbar :options="descriptor.styleToolbarVisualizationTypeOptions" :prop-model="{ color: visualizationTypeModel.types[0].color, 'background-color': visualizationTypeModel.types[0]['background-color'] }" :disabled="visualizationTypeDisabled" @change="onStyleToolbarChange($event, visualizationTypeModel.types[0])" />
                    </div>
                </div>
            </div>
        </div>

        <q-separator class="q-mb-sm" />

        <!-- Column Overrides -->
        <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.visualizationType.columnOverrides') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="visualizationTypeDisabled" @click="addVisualizationType" />
        </div>

        <div v-for="(visualizationType, index) in visualizationTypeModel.types.slice(1)" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <!-- Card content -->
            <div class="col q-pa-sm">
                <!-- Multiselect -->
                <div class="row items-center q-mb-sm">
                    <div class="col">
                        <WidgetEditorColumnsMultiselect :value="visualizationType.target as string[]" :available-target-options="availableColumnOptions" :widget-columns-alias-map="widgetColumnsAliasMap" option-label="alias" option-value="id" :disabled="visualizationTypeDisabled" @change="onColumnsSelected($event, visualizationType)" />
                    </div>
                    <q-icon v-if="['Icon', 'Text & Icon'].includes(visualizationType.type)" name="warning" color="warning" size="sm" class="q-ml-sm">
                        <q-tooltip>{{ $t('dashboard.widgetEditor.visualisationType.thresholdHint') }}</q-tooltip>
                    </q-icon>
                </div>
                <!-- Type + Pinned -->
                <div class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-6">
                        <q-select v-model="visualizationType.type" :options="translatedVisualizationTypeOptions(visualizationType)" option-value="value" option-label="label" emit-value map-options :label="$t('common.type')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                    <div class="col-6">
                        <q-select v-model="visualizationType.pinned" :options="translatedPinnedOptions" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.pinned')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                </div>
                <!-- Text/date fields -->
                <div v-if="hasTextFields(visualizationType)" class="row q-col-gutter-sm q-mb-sm">
                    <div v-if="visualizationType.type && visualizationType.type !== 'Bar'" class="col-3">
                        <q-input v-model="visualizationType.prefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense :disable="visualizationTypeDisabled" @change="visualizationTypeChanged" />
                    </div>
                    <div v-if="visualizationType.type && visualizationType.type !== 'Bar'" class="col-3">
                        <q-input v-model="visualizationType.suffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense :disable="visualizationTypeDisabled" @change="visualizationTypeChanged" />
                    </div>
                    <div v-if="(optionsContainMeasureColumn(visualizationType) && visualizationType.type === 'Text') || visualizationType.type === 'Text & Icon'" class="col-3">
                        <q-input v-model.number="visualizationType.precision" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div v-if="visualizationType.type === 'Text' || visualizationType.type === 'Text & Icon'" class="col-3">
                        <q-input v-model.number="visualizationType.maximumCharacters" type="number" :label="$t('dashboard.widgetEditor.visualizationType.maximumCharacters')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div v-if="optionsContainTimestampColumn(visualizationType)" class="col-6">
                        <q-select v-model="visualizationType.dateFormat" :options="dateFormatOptions" option-value="value" option-label="label" emit-value map-options :label="$t('managers.datasetManagement.ckanDateFormat')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                </div>
                <!-- Bar/sparkline metrics -->
                <div v-if="optionsContainMeasureColumn(visualizationType) && ['Bar', 'Sparkline', 'Bar & Text'].includes(visualizationType.type)" class="row q-col-gutter-sm items-end q-mb-sm">
                    <div class="col-3">
                        <q-input v-model.number="visualizationType.min" type="number" :label="$t('common.min')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div class="col-3">
                        <q-input v-model.number="visualizationType.max" type="number" :label="$t('common.max')" outlined dense :disable="visualizationTypeDisabled" @blur="visualizationTypeChanged" />
                    </div>
                    <div class="col-3">
                        <q-select v-model="visualizationType.alignment" :options="translatedAlignmentOptions" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.alignment')" outlined dense :disable="visualizationTypeDisabled" @update:model-value="visualizationTypeChanged" />
                    </div>
                    <div class="col-3">
                        <WidgetEditorStyleToolbar :options="descriptor.styleToolbarVisualizationTypeOptions" :prop-model="{ color: visualizationType.color, 'background-color': visualizationType['background-color'] }" :disabled="visualizationTypeDisabled" @change="onStyleToolbarChange($event, visualizationType)" />
                    </div>
                </div>
            </div>
            <!-- Action handle -->
            <div class="kn-action-handle row items-center justify-center" :class="visualizationTypeDisabled ? 'kn-action-handle-disabled' : ''">
                <q-btn flat round dense icon="delete" size="sm" :disable="visualizationTypeDisabled" @click="removeVisualizationType(index + 1)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetVisualizationType, IWidgetColumn, IWidgetStyleToolbarModel, ITableWidgetVisualizationTypes } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-visualization-type',
    components: {
        WidgetEditorColumnsMultiselect,
        WidgetEditorStyleToolbar
    },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            visualizationTypeModel: null as ITableWidgetVisualizationTypes | null,
            availableColumnOptions: [] as (IWidgetColumn | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any,
            widgetColumnsTypeMap: {} as any,
            widgetColumnsIsDateMap: {} as any,
            getTranslatedLabel
        }
    },
    computed: {
        visualizationTypeDisabled() {
            return !this.visualizationTypeModel || !this.visualizationTypeModel.enabled
        },
        translatedPinnedOptions(): { value: string; label: string }[] {
            return descriptor.pinnedOptions.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        },
        translatedAlignmentOptions(): { value: string; label: string }[] {
            return descriptor.alignmentOptions.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        },
        dateFormatOptions(): { value: string; label: string }[] {
            return descriptor.dateFormats.map((fmt: string) => ({ value: fmt, label: this.getFormattedDate(new Date(), fmt) }))
        }
    },
    created() {
        this.setEventListeners()
        this.loadColumnOptions()
        this.loadVisualizationTypes()
        this.loadWidgetColumnMaps()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromVisibilityTypes', this.onColumnRemovedFromVisibilityTypes)
            emitter.on('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.on('columnAdded', this.onColumnAdded)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromVisibilityTypes', this.onColumnRemovedFromVisibilityTypes)
            emitter.off('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.off('columnAdded', this.onColumnAdded)
        },
        onColumnRemovedFromVisibilityTypes() {
            this.onColumnRemoved()
        },
        onColumnAliasRenamed(column: any) {
            this.updateColumnAliases(column)
        },
        onColumnAdded(column: any) {
            this.addColumnAsOption(column)
        },
        loadColumnOptions() {
            this.availableColumnOptions = [...this.widgetModel.columns]
        },
        loadWidgetColumnMaps() {
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.id) {
                    this.widgetColumnsAliasMap[column.id] = column.alias
                    if (column.fieldType) this.widgetColumnsTypeMap[column.id] = column.fieldType
                    this.widgetColumnsIsDateMap[column.id] = column.type.toLowerCase().includes('date') || column.type.toLowerCase().includes('timestamp')
                }
            })
        },
        visualizationTypeChanged() {
            emitter.emit('visualizationTypeChanged', this.visualizationTypeModel)
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        loadVisualizationTypes() {
            if (this.widgetModel.settings?.visualization?.visualizationTypes) this.visualizationTypeModel = this.widgetModel.settings.visualization.visualizationTypes
            this.removeColumnsFromAvailableOptions()
        },
        removeColumnsFromAvailableOptions() {
            for (let i = 0; i < this.widgetModel.settings.visualization.visualizationTypes.types.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.visualization.visualizationTypes.types[i].target.length; j++) {
                    this.removeColumnFromAvailableOptions({
                        id: this.widgetModel.settings.visualization.visualizationTypes.types[i].target[j],
                        alias: this.widgetModel.settings.visualization.visualizationTypes.types[i].target[j]
                    })
                }
            }
        },
        removeColumnFromAvailableOptions(tempColumn: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === tempColumn.id)
            if (index !== -1) this.availableColumnOptions.splice(index, 1)
        },
        onColumnsSelected(event: any, visualizationType: ITableWidgetVisualizationType) {
            const intersection = (visualizationType.target as string[]).filter((el: string) => !event.value.includes(el))
            visualizationType.target = event.value

            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(visualizationType)
            this.visualizationTypeChanged()
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) =>
                this.availableColumnOptions.push({
                    id: el,
                    alias: this.widgetColumnsAliasMap[el]
                })
            )
        },
        onColumnsAddedFromMultiselect(visualizationType: ITableWidgetVisualizationType) {
            ;(visualizationType.target as string[]).forEach((target: string) => {
                const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableColumnOptions.splice(index, 1)
            })
        },
        getVisualizationTypeOptions(visualizationType: ITableWidgetVisualizationType) {
            return this.optionsContainMeasureColumn(visualizationType) ? descriptor.visualizationTypes : descriptor.visualizationTypes.slice(0, 4)
        },
        translatedVisualizationTypeOptions(visualizationType: ITableWidgetVisualizationType): { value: string; label: string }[] {
            return this.getVisualizationTypeOptions(visualizationType).map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        },
        hasTextFields(visualizationType: ITableWidgetVisualizationType): boolean {
            if (!visualizationType.type) return false
            const notBar = visualizationType.type !== 'Bar'
            const isText = visualizationType.type === 'Text' || visualizationType.type === 'Text & Icon'
            const measureText = this.optionsContainMeasureColumn(visualizationType) && visualizationType.type === 'Text'
            const hasTimestamp = this.optionsContainTimestampColumn(visualizationType)
            return notBar || isText || measureText || hasTimestamp
        },
        optionsContainMeasureColumn(visualizationType: ITableWidgetVisualizationType) {
            let found = false
            for (let i = 0; i < visualizationType.target.length; i++) {
                if (this.widgetColumnsTypeMap[visualizationType.target[i]] === 'MEASURE') {
                    found = true
                    break
                }
            }
            if (!found && (visualizationType.type === 'Bar' || visualizationType.type === 'Sparkline')) this.resetMeasureProperties(visualizationType)
            return found
        },
        optionsContainTimestampColumn(visualizationType: ITableWidgetVisualizationType) {
            let found = false
            for (let i = 0; i < visualizationType.target.length; i++) {
                if (this.widgetColumnsIsDateMap[visualizationType.target[i]]) {
                    found = true
                    break
                }
            }
            return found
        },
        resetMeasureProperties(visualizationType: ITableWidgetVisualizationType) {
            visualizationType.type = 'Text'
            const fields = ['min', 'max', 'alignment']
            fields.forEach((field: string) => delete visualizationType[field])
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, visualizationType: ITableWidgetVisualizationType) {
            visualizationType.color = model.color
            visualizationType['background-color'] = model['background-color'] ?? ''
            this.visualizationTypeChanged()
        },
        addVisualizationType() {
            if (this.visualizationTypeModel && !this.visualizationTypeDisabled)
                this.visualizationTypeModel.types.push({
                    target: [],
                    type: '',
                    prefix: '',
                    suffix: '',
                    pinned: ''
                })
        },
        removeVisualizationType(index: number) {
            if (!this.visualizationTypeModel || this.visualizationTypeDisabled) return
            ;(this.visualizationTypeModel.types[index].target as string[]).forEach((target: string) =>
                this.availableColumnOptions.push({
                    id: target,
                    alias: this.widgetColumnsAliasMap[target]
                })
            )
            this.visualizationTypeModel.types.splice(index, 1)
            this.visualizationTypeChanged()
        },
        onColumnRemoved() {
            this.loadColumnOptions()
            this.loadVisualizationTypes()
        },
        updateColumnAliases(column: IWidgetColumn) {
            if (column.id && this.widgetColumnsAliasMap[column.id]) this.widgetColumnsAliasMap[column.id] = column.alias

            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === column.id)
            if (index !== -1) this.availableColumnOptions[index].alias = column.alias
            this.visualizationTypeChanged()
        },
        addColumnAsOption(column: IWidgetColumn) {
            this.availableColumnOptions.push(column)
            this.loadWidgetColumnMaps()
        },
        getFormattedDate(date: any, format: any) {
            return luxonFormatDate(date, undefined, format)
        }
    }
})
</script>

<style scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
