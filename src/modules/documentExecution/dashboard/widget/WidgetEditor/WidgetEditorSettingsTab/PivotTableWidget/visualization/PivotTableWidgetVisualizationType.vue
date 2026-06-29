<template>
    <div v-if="visualizationTypeModel" class="q-px-md q-pb-md">
        <!-- Global Settings (index 0 = All Columns) -->
        <div v-if="visualizationTypeModel.types.length > 0" class="q-mb-md">
            <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col-12">
                    <q-select :model-value="descriptor.allColumnOption[0].value" :options="descriptor.allColumnOption" option-value="value" option-label="label" emit-value map-options outlined dense disable />
                </div>
                <div class="col-6">
                    <q-select v-model="visualizationTypeModel.types[0].type" :options="translatedVisualizationTypeOptions" option-value="value" option-label="label" emit-value map-options :label="$t('common.type')" outlined dense :disable="visualizationTypeDisabled" />
                </div>
                <div class="col-3">
                    <q-input v-model="visualizationTypeModel.types[0].prefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense :disable="visualizationTypeDisabled" />
                </div>
                <div class="col-3">
                    <q-input v-model="visualizationTypeModel.types[0].suffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense :disable="visualizationTypeDisabled" />
                </div>
                <div class="col-4">
                    <q-input v-model.number="visualizationTypeModel.types[0].precision" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense :disable="visualizationTypeDisabled" />
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
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="q-mb-sm">
                    <WidgetEditorColumnsMultiselect :value="visualizationType.target as string[]" :available-target-options="availableColumnOptions" :widget-columns-alias-map="widgetColumnsAliasMap" option-label="alias" option-value="id" :disabled="visualizationTypeDisabled" @change="onColumnsSelected($event, visualizationType)" />
                </div>
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-select v-model="visualizationType.type" :options="translatedVisualizationTypeOptions" option-value="value" option-label="label" emit-value map-options :label="$t('common.type')" outlined dense :disable="visualizationTypeDisabled" />
                    </div>
                    <div class="col-3">
                        <q-input v-model="visualizationType.prefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense :disable="visualizationTypeDisabled" />
                    </div>
                    <div class="col-3">
                        <q-input v-model="visualizationType.suffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense :disable="visualizationTypeDisabled" />
                    </div>
                    <div class="col-4">
                        <q-input v-model.number="visualizationType.precision" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense :disable="visualizationTypeDisabled" />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center" :class="visualizationTypeDisabled ? 'kn-action-handle-disabled' : ''">
                <q-btn flat round dense icon="delete" size="sm" :disable="visualizationTypeDisabled" @click="removeVisualizationType(index + 1)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotTableWidgetVisualizationType, IPivotTableWidgetVisualizationTypes } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from '../PivotTableSettingsDescriptor.json'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'pivot-table-widget-visualization-type',
    components: { WidgetEditorColumnsMultiselect },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            visualizationTypeModel: null as IPivotTableWidgetVisualizationTypes | null,
            availableColumnOptions: [] as (IWidgetColumn | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any
        }
    },
    computed: {
        visualizationTypeDisabled() {
            return !this.visualizationTypeModel || !this.visualizationTypeModel.enabled
        },
        translatedVisualizationTypeOptions(): { value: string; label: string }[] {
            return descriptor.visualizationTypes.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
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
            emitter.on('columnRemovedFromVisualizationTypes', this.onColumnRemoved)
            emitter.on('columnRemoved', this.loadColumnOptions)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromVisualizationTypes', this.onColumnRemoved)
            emitter.off('columnRemoved', this.loadColumnOptions)
        },
        loadVisualizationTypes() {
            if (this.widgetModel.settings?.visualization?.visualizationTypes) this.visualizationTypeModel = this.widgetModel.settings.visualization.visualizationTypes
            this.removeColumnsFromAvailableOptions()
        },
        loadColumnOptions() {
            this.availableColumnOptions = this.widgetModel.fields ? [...this.widgetModel.fields.data] : []
            this.removeColumnsFromAvailableOptions()
        },
        loadWidgetColumnMaps() {
            this.widgetModel.fields?.data?.forEach((column: IWidgetColumn) => {
                if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
            })
        },
        removeColumnsFromAvailableOptions() {
            for (let i = 0; i < this.widgetModel.settings.visualization.visualizationTypes.types.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.visualization.visualizationTypes.types[i].target.length; j++) {
                    this.removeColumnFromAvailableOptions({ id: this.widgetModel.settings.visualization.visualizationTypes.types[i].target[j], alias: this.widgetModel.settings.visualization.visualizationTypes.types[i].target[j] })
                }
            }
        },
        removeColumnFromAvailableOptions(tempColumn: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === tempColumn.id)
            if (index !== -1) this.availableColumnOptions.splice(index, 1)
        },
        onColumnsSelected(event: any, visualizationType: IPivotTableWidgetVisualizationType) {
            const intersection = (visualizationType.target as string[]).filter((el: string) => !event.value.includes(el))
            visualizationType.target = event.value
            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(visualizationType)
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) => this.availableColumnOptions.push({ id: el, alias: this.widgetColumnsAliasMap[el] }))
        },
        onColumnsAddedFromMultiselect(visualizationType: IPivotTableWidgetVisualizationType) {
            ;(visualizationType.target as string[]).forEach((target: string) => {
                const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableColumnOptions.splice(index, 1)
            })
        },
        addVisualizationType() {
            if (this.visualizationTypeModel && !this.visualizationTypeDisabled) this.visualizationTypeModel.types.push({ target: [], prefix: '', suffix: '', type: 'Text', precision: 2 })
        },
        removeVisualizationType(index: number) {
            if (!this.visualizationTypeModel || this.visualizationTypeDisabled) return
            ;(this.visualizationTypeModel.types[index].target as string[]).forEach((target: string) => this.availableColumnOptions.push({ id: target, alias: this.widgetColumnsAliasMap[target] }))
            this.visualizationTypeModel.types.splice(index, 1)
        },
        onColumnRemoved() {
            this.loadColumnOptions()
            this.loadVisualizationTypes()
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
