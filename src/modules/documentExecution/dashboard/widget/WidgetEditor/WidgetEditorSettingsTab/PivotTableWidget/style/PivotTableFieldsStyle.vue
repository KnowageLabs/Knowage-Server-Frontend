<template>
    <div v-if="fieldStyles" class="q-px-md q-pb-md">
        <!-- Global row (index 0) -->
        <div v-if="fieldStyles.styles.length > 0" class="q-mb-md">
            <div class="row items-center justify-between q-mb-sm">
                <div class="col">
                    <q-select :model-value="descriptor.allColumnOption[0].value" :options="descriptor.allColumnOption" option-value="value" option-label="label" emit-value map-options :label="$t('common.fields')" outlined dense disable />
                </div>
            </div>
            <WidgetEditorStyleToolbar :options="toolbarOptions" :prop-model="fieldStyles.styles[0].properties" :disabled="fieldStylesDisabled" @change="onStyleToolbarChange($event, fieldStyles.styles[0], 0)" />
        </div>

        <q-separator class="q-mb-sm" />
        <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.visualizationType.columnOverrides') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="fieldStylesDisabled" class="q-ml-sm" @click="addFieldStyle" />
        </div>

        <!-- Override rows -->
        <div v-for="(fieldStyle, index) in fieldStyles.styles.slice(1)" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="q-mb-sm">
                    <WidgetEditorColumnsMultiselect :value="fieldStyle.target as string[]" :available-target-options="availableFieldOptions" :widget-columns-alias-map="widgetFieldsAliasMap" option-label="alias" option-value="id" :disabled="fieldStylesDisabled" @change="onFieldsSelected($event, fieldStyle)" />
                </div>
                <WidgetEditorStyleToolbar :options="toolbarOptions" :prop-model="fieldStyle.properties" :disabled="fieldStylesDisabled" @change="onStyleToolbarChange($event, fieldStyle, index + 1)" />
            </div>
            <div class="kn-action-handle row items-center justify-center" :class="fieldStylesDisabled ? 'kn-action-handle-disabled' : ''">
                <q-btn flat round dense icon="delete" size="sm" :disable="fieldStylesDisabled" @click="removeFieldStyle(index + 1)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotTableColumnStyles, IPivotTableColumnStyle } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../PivotTableSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'pivot-table-fields-style',
    components: { WidgetEditorColumnsMultiselect, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IPivotTableColumnStyles | null>, required: true }, fieldType: { type: String, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            fieldStyles: null as IPivotTableColumnStyles | null,
            availableFieldOptions: [] as (IWidgetColumn | { id: string; alias: string })[],
            widgetFieldsAliasMap: {} as any
        }
    },
    computed: {
        combinedArray(): any {
            if (!this.widgetModel) return []
            const modelFields = this.widgetModel.fields
            const combinedArray = modelFields?.columns.concat(modelFields.rows, modelFields.data, modelFields.filters)
            return combinedArray
        },
        fieldStylesDisabled() {
            return !this.fieldStyles || !this.fieldStyles.enabled
        },
        toolbarOptions(): any {
            return this.fieldType === 'fieldHeaders' ? this.descriptor.columnHeadersToolbarStyleOptions : this.descriptor.defaultToolbarStyleOptions
        }
    },
    created() {
        this.setEventListeners()
        this.loadFieldOptions()
        this.loadFieldStyles()
        this.loadWidgetFieldMaps()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromColumnStyle', this.onFieldOrGroupRemoved)
            emitter.on('columnAdded', this.onFieldAdded)
            emitter.on('themeSelected', this.loadFieldStyles)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromColumnStyle', this.onFieldOrGroupRemoved)
            emitter.off('columnAdded', this.onFieldAdded)
            emitter.off('themeSelected', this.loadFieldStyles)
        },
        onFieldOrGroupRemoved() {
            this.onFieldRemoved()
        },
        onFieldAdded() {
            this.addFieldAsOption()
        },
        loadFieldStyles() {
            if (this.widgetModel) {
                this.fieldStyles = this.widgetModel?.settings.style[this.fieldType]
                this.removeFieldsFromAvailableOptions()
            } else this.fieldStyles = this.themeStyle
        },
        loadFieldOptions() {
            this.availableFieldOptions = [...this.combinedArray]
        },
        loadWidgetFieldMaps() {
            this.combinedArray?.forEach((field: IWidgetColumn) => {
                if (field.id) this.widgetFieldsAliasMap[field.id] = field.alias
            })
        },
        removeFieldsFromAvailableOptions() {
            const array = this.widgetModel?.settings.style.fields.styles
            for (let i = 1; i < array.length; i++) {
                for (let j = 0; j < array[i].target.length; j++) {
                    this.removeFieldFromAvailableOptions({ id: array[i].target[j], alias: array[i].target[j] })
                }
            }
        },
        removeFieldFromAvailableOptions(tempField: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableFieldOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === tempField.id)
            if (index !== -1) this.availableFieldOptions.splice(index, 1)
        },
        onFieldsSelected(event: any, fieldStyle: IPivotTableColumnStyle, index: number | null = null) {
            const intersection = (fieldStyle.target as string[]).filter((el: string) => !event.value.includes(el))
            fieldStyle.target = event.value
            intersection.length > 0 ? this.onFieldsRemovedFromMultiselect(intersection) : this.onFieldsAddedFromMultiselect(fieldStyle)
            this.pivotTableFieldsStyleChanged(index)
        },
        onFieldsAddedFromMultiselect(fieldStyle: IPivotTableColumnStyle) {
            ;(fieldStyle.target as string[]).forEach((target: string) => {
                const index = this.availableFieldOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableFieldOptions.splice(index, 1)
            })
        },
        onFieldsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) => this.availableFieldOptions.push({ id: el, alias: this.widgetFieldsAliasMap[el] }))
        },
        addFieldStyle() {
            if (!this.fieldStyles || this.fieldStylesDisabled) return
            const newStyle: any = {
                target: [],
                properties: {
                    'background-color': 'rgb(255, 255, 255, 0)',
                    color: 'rgb(0, 0, 0)',
                    'text-align': '',
                    'font-size': '',
                    'font-family': '',
                    'font-style': '',
                    'font-weight': ''
                }
            }
            if (this.fieldType === 'fieldHeaders') {
                newStyle.properties['vertical-align'] = ''
            }
            this.fieldStyles.styles.push(newStyle)
        },
        removeFieldStyle(index: number) {
            if (!this.fieldStyles || this.fieldStylesDisabled) return
            ;(this.fieldStyles.styles[index].target as string[]).forEach((target: string) => this.availableFieldOptions.push({ id: target, alias: this.widgetFieldsAliasMap[target] }))
            this.fieldStyles.styles.splice(index, 1)
        },
        addFieldAsOption() {
            this.reloadModel()
        },
        onFieldRemoved() {
            this.reloadModel()
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, fieldStyle: IPivotTableColumnStyle, index: number | null = null) {
            ;((fieldStyle.properties['background-color'] = model['background-color'] ?? 'rgb(0, 0, 0)'),
                (fieldStyle.properties.color = model.color ?? 'rgb(255, 255, 255)'),
                (fieldStyle.properties['text-align'] = model['text-align'] ?? 'center'),
                (fieldStyle.properties['vertical-align'] = model['vertical-align'] ?? ''),
                (fieldStyle.properties['font-size'] = model['font-size'] ?? '14px'),
                (fieldStyle.properties['font-family'] = model['font-family'] ?? ''),
                (fieldStyle.properties['font-style'] = model['font-style'] ?? 'normal'),
                (fieldStyle.properties['font-weight'] = model['font-weight'] ?? ''))
            this.pivotTableFieldsStyleChanged(index)
        },
        reloadModel() {
            this.loadFieldOptions()
            this.loadFieldStyles()
            this.loadWidgetFieldMaps()
        },
        pivotTableFieldsStyleChanged(index: number | null = null) {
            if (this.widgetModel && (!index || index === 0)) this.$emit('styleChanged')
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
