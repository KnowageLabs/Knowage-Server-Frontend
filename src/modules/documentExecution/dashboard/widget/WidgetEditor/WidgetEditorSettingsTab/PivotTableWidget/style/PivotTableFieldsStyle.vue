<template>
    <div v-if="fieldStyles" class="kn-flex p-p-4">
        <div v-for="(fieldStyle, index) in fieldStyles.styles" :key="index">
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12 p-d-flex p-flex-row">
                    <span class="p-float-label kn-flex">
                        <Dropdown v-if="index === 0" v-model="fieldStyle.target" class="kn-material-input" :options="descriptor.allColumnOption" option-value="value" option-label="label" :disabled="true"> </Dropdown>
                        <WidgetEditorColumnsMultiselect
                            v-else
                            :value="(fieldStyle.target as string[])"
                            :available-target-options="availableFieldOptions"
                            :widget-columns-alias-map="widgetFieldsAliasMap"
                            option-label="alias"
                            option-value="id"
                            :disabled="fieldStylesDisabled"
                            @change="onFieldsSelected($event, fieldStyle)"
                        />
                        <label class="kn-material-input-label"> {{ $t('common.fields') }}</label>
                    </span>
                    <i v-if="widgetModel" :class="[index === 0 ? 'pi pi-plus-circle' : 'pi pi-trash', fieldStylesDisabled ? 'icon-disabled' : '']" class="kn-cursor-pointer p-as-center p-ml-3" @click="index === 0 ? addFieldStyle() : removeFieldStyle(index)"></i>
                </div>
            </form>

            <WidgetEditorStyleToolbar :options="descriptor.defaultToolbarStyleOptions" :prop-model="fieldStyle.properties" :disabled="fieldStylesDisabled" @change="onStyleToolbarChange($event, fieldStyle, index)"> </WidgetEditorStyleToolbar>

            <br v-if="widgetModel && index < fieldStyles.styles.length - 1" />
            <br v-if="widgetModel && index < fieldStyles.styles.length - 1" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotTableColumnStyles, IPivotTableColumnStyle } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../PivotTableSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'pivot-table-fields-style',
    components: { Dropdown, WidgetEditorColumnsMultiselect, WidgetEditorStyleToolbar },
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
            this.fieldStyles.styles.push({
                target: [],
                properties: {
                    'background-color': 'rgb(0, 0, 0)',
                    color: 'rgb(255, 255, 255)',
                    'text-align': '',
                    'font-size': '',
                    'font-family': '',
                    'font-style': '',
                    'font-weight': ''
                }
            })
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
            ;(fieldStyle.properties['background-color'] = model['background-color'] ?? 'rgb(0, 0, 0)'),
                (fieldStyle.properties.color = model.color ?? 'rgb(255, 255, 255)'),
                (fieldStyle.properties['text-align'] = model['text-align'] ?? 'center'),
                (fieldStyle.properties['font-size'] = model['font-size'] ?? '14px'),
                (fieldStyle.properties['font-family'] = model['font-family'] ?? ''),
                (fieldStyle.properties['font-style'] = model['font-style'] ?? 'normal'),
                (fieldStyle.properties['font-weight'] = model['font-weight'] ?? '')
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

<style lang="scss" scoped></style>
