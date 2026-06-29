<template>
    <div v-if="conditionalStylesModel" class="q-px-md q-pb-md">
        <div class="row items-center justify-between">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.conditions.addCondition') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="conditionalStylesDisabled" @click="addConditionalStyle" />
        </div>

        <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>

        <div v-for="(conditionalStyle, index) in conditionalStylesModel.conditions" :key="index">
            <div class="column-type-row row no-wrap" :draggable="!conditionalStylesDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                <div class="kn-drag-handle row items-center justify-center" :class="{ 'kn-drag-handle-disabled': conditionalStylesDisabled }">
                    <q-icon name="drag_indicator" size="xs" />
                </div>
                <div class="col q-pa-sm">
                    <div class="row q-col-gutter-sm q-mb-sm">
                        <div class="col-6">
                            <q-select v-model="conditionalStyle.target" :options="widgetModel.columns" option-label="alias" option-value="id" emit-value map-options :label="$t('common.column')" outlined dense :disable="conditionalStylesDisabled" />
                        </div>
                        <div class="col-2">
                            <q-select v-model="conditionalStyle.condition.operator" :options="tableWidgetDescriptor.columnConditionOptions" option-label="label" option-value="value" emit-value map-options :label="$t('common.operator')" outlined dense :disable="conditionalStylesDisabled" />
                        </div>
                        <div class="col-4">
                            <q-input v-model="conditionalStyle.condition.value" :label="$t('common.value')" outlined dense :disable="conditionalStylesDisabled" />
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <WidgetEditorStyleToolbar :options="tableWidgetDescriptor.conditionsToolbarStyleOptions" :prop-model="conditionalStyle.properties" :disabled="conditionalStylesDisabled" @change="onStyleToolbarChange($event, conditionalStyle)" />
                        </div>
                    </div>
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
import { IHighchartsCommonConditionalStyle, IHighchartsCommonConditionalStyles } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import * as commonDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import tableWidgetDescriptor from '../descriptors/HighchartsConditionalStylesDescriptor.json'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'pivot-table-conditional-style',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            tableWidgetDescriptor,
            conditionalStylesModel: null as IHighchartsCommonConditionalStyles | null,
            isDragging: false,
            activeDropzone: -1
        }
    },
    computed: {
        conditionalStylesDisabled() {
            return !this.conditionalStylesModel || !this.conditionalStylesModel.enabled
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
            if (this.widgetModel?.settings?.series?.conditionalStyles) this.conditionalStylesModel = this.widgetModel.settings.series.conditionalStyles
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, conditionalStyle: IHighchartsCommonConditionalStyle) {
            const defaultConditionalStyle = commonDefaultValues.getDefaultConditionalStyles()
            conditionalStyle.properties = {
                color: model.color ?? defaultConditionalStyle.properties.color
            }
        },
        addConditionalStyle() {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.push(commonDefaultValues.getDefaultConditionalStyles())
        },
        removeConditionalStyle(index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.splice(index, 1)
        },
        onDragStart(event: any, index: number) {
            if (this.conditionalStylesDisabled) return
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
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
