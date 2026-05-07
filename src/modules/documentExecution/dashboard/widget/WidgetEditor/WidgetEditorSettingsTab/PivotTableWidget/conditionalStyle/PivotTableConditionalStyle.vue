<template>
    <div v-if="conditionalStylesModel" class="q-px-md q-pb-md">
        <div class="row items-center justify-between">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.conditions.addCondition') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="conditionalStylesDisabled" @click="addConditionalStyle" />
        </div>

        <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>

        <div v-for="(conditionalStyle, index) in conditionalStylesModel.conditions" :key="index">
            <div class="condition-row row no-wrap" :draggable="!conditionalStylesDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                <div class="kn-drag-handle row items-center justify-center" :class="{ 'kn-drag-handle-disabled': conditionalStylesDisabled }">
                    <q-icon name="drag_indicator" size="xs" />
                </div>
                <div class="col q-pa-sm">
                    <div class="row q-col-gutter-sm q-mb-sm">
                        <div class="col-6">
                            <q-select v-model="conditionalStyle.target" :options="widgetModel.fields?.data ?? []" option-label="alias" option-value="id" emit-value map-options :label="$t('common.column')" outlined dense :disable="conditionalStylesDisabled" />
                        </div>
                        <div class="col-3">
                            <q-select v-model="conditionalStyle.condition.operator" :options="translatedOperatorOptions" option-value="value" option-label="label" emit-value map-options :label="$t('common.operator')" outlined dense :disable="conditionalStylesDisabled" />
                        </div>
                        <div class="col-3">
                            <q-input v-model.number="conditionalStyle.condition.value" type="number" :label="$t('common.value')" outlined dense :disable="conditionalStylesDisabled" />
                        </div>
                    </div>
                    <WidgetEditorStyleToolbar :options="tableWidgetDescriptor.conditionsToolbarStyleOptions" :prop-model="conditionalStyle.properties" :disabled="conditionalStylesDisabled" @change="onStyleToolbarChange($event, conditionalStyle)" />
                </div>
                <div class="kn-action-handle row items-center justify-center" :class="{ 'kn-action-handle-disabled': conditionalStylesDisabled }">
                    <q-btn flat round dense icon="delete" size="sm" :disable="conditionalStylesDisabled" @click.stop="removeConditionalStyle(index)" />
                </div>
            </div>

            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotTableWidgetConditionalStyle, IPivotTableWidgetConditionalStyles } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import * as pivotTableDefaultValues from '../../../helpers/pivotTableWidget/PivotTableDefaultValues'
import descriptor from '../PivotTableSettingsDescriptor.json'
import tableWidgetDescriptor from '../../TableWidget/TableWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'pivot-table-conditional-style',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            tableWidgetDescriptor,
            conditionalStylesModel: null as IPivotTableWidgetConditionalStyles | null,
            isDragging: false,
            activeDropzone: -1
        }
    },
    computed: {
        conditionalStylesDisabled() {
            return !this.conditionalStylesModel || !this.conditionalStylesModel.enabled
        },
        translatedOperatorOptions(): { value: string; label: string }[] {
            return tableWidgetDescriptor.columnConditionOptions.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        }
    },
    watch: {
        conditionalStylesDisabled() {
            this.onConditionalStylesEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadConditionalStyles()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemoved', this.loadConditionalStyles)
        },
        removeEventListeners() {
            emitter.off('columnRemoved', this.loadConditionalStyles)
        },
        loadConditionalStyles() {
            if (this.widgetModel?.settings?.conditionalStyles) this.conditionalStylesModel = this.widgetModel.settings.conditionalStyles
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, conditionalStyle: IPivotTableWidgetConditionalStyle) {
            const defaultConditionalStyle = pivotTableDefaultValues.getDefaultConditionalStyle()

            const mapJustifyContentToTextAlign = (justifyContent: string) => {
                switch (justifyContent) {
                    case 'flex-start':
                        return 'left'
                    case 'center':
                        return 'center'
                    case 'flex-end':
                        return 'right'
                    default:
                        return justifyContent || defaultConditionalStyle.properties['text-align']
                }
            }

            conditionalStyle.properties = {
                'background-color': model['background-color'] ?? defaultConditionalStyle.properties['background-color'],
                color: model.color ?? defaultConditionalStyle.properties.color,
                'text-align': model['justify-content'] ? mapJustifyContentToTextAlign(model['justify-content']) : (model['text-align'] ?? defaultConditionalStyle.properties['text-align']),
                'font-size': model['font-size'] ?? defaultConditionalStyle.properties['font-size'],
                'font-family': model['font-family'] ?? defaultConditionalStyle.properties['font-family'],
                'font-style': model['font-style'] ?? defaultConditionalStyle.properties['font-style'],
                'font-weight': model['font-weight'] ?? defaultConditionalStyle.properties['font-weight'],
                icon: model.icon ?? defaultConditionalStyle.properties.icon
            }
        },
        addConditionalStyle() {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.push(pivotTableDefaultValues.getDefaultConditionalStyle())
        },
        removeConditionalStyle(index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.splice(index, 1)
        },
        onConditionalStylesEnabledChange() {
            if (!this.conditionalStylesModel) return
            if (this.conditionalStylesModel.enabled && this.conditionalStylesModel.conditions.length === 0) {
                this.conditionalStylesModel.conditions.push(pivotTableDefaultValues.getDefaultConditionalStyle())
            }
        },
        onDragStart(event: any, index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.isDragging = true
            this.activeDropzone = -1
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropAtIndex(event: any, targetDropzoneIndex: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.isDragging = false
            this.activeDropzone = -1
            const sourceIndex = JSON.parse(event.dataTransfer.getData('text/plain'))
            if (sourceIndex === targetDropzoneIndex || sourceIndex === targetDropzoneIndex - 1) return
            const items = this.conditionalStylesModel.conditions
            const [removed] = items.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            items.splice(insertAt, 0, removed)
        }
    }
})
</script>

<style lang="scss" scoped>
.condition-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
