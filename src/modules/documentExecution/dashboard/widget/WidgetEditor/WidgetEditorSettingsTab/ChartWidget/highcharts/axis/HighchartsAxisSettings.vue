<template>
    <div v-if="axisModel" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div v-if="['area', 'bar', 'column', 'line', 'heatmap'].includes(chartType)" class="col-6 col-md-3">
                <q-input v-model.number="axisModel.min" type="number" :label="$t('common.min')" outlined dense @blur="onInputNumberChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-mr-xs">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.heatmap.axisMinHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div v-if="['area', 'bar', 'column', 'line', 'heatmap'].includes(chartType)" class="col-6 col-md-3">
                <q-input v-model.number="axisModel.max" type="number" :label="$t('common.max')" outlined dense @blur="onInputNumberChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-mr-xs">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.heatmap.axisMaxHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6" :class="chartType === 'heatmap' ? 'col-md-3' : 'col-md-3'">
                <q-input v-model.number="axisModel.labels.rotation" type="number" :label="$t('dashboard.widgetEditor.highcharts.heatmap.labelRotation')" outlined dense @blur="onInputNumberChanged" />
            </div>
            <div class="col-6" :class="chartType === 'heatmap' ? 'col-md-3' : 'col-md-3'">
                <q-select v-model="axisModel.labels.align" :label="$t('common.align')" emit-value map-options outlined dense :options="settingsDescriptor.alignmentOptions" option-value="value" option-label="label" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, settingsDescriptor.alignmentOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
            </div>
        </div>

        <div class="row q-mb-sm">
            <div class="col-12">
                <WidgetEditorStyleToolbar :options="descriptor.styleToolbarSettings" :prop-model="toolbarModel" @change="onStyleToolbarChange" />
            </div>
        </div>

        <div v-if="['scatter', 'bubble'].includes(chartType)" class="row q-gutter-x-md q-mb-sm">
            <q-checkbox v-model="axisModel.startOnTick" :label="$t('dashboard.widgetEditor.highcharts.axisTickSettings.startOnTick')" dense @update:model-value="modelChanged">
                <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.axisTickSettings.startOnTickHint') }}</q-tooltip>
            </q-checkbox>
            <q-checkbox v-model="axisModel.endOnTick" :label="$t('dashboard.widgetEditor.highcharts.axisTickSettings.endOnTick')" dense @update:model-value="modelChanged">
                <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.axisTickSettings.endOnTickkHint') }}</q-tooltip>
            </q-checkbox>
            <q-checkbox v-model="axisModel.showLastLabel" :label="$t('dashboard.widgetEditor.highcharts.axisTickSettings.showLastLabel')" dense @update:model-value="modelChanged">
                <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.axisTickSettings.showLastLabelHint') }}</q-tooltip>
            </q-checkbox>
        </div>

        <div class="row items-center justify-center cursor-pointer q-my-md" @click="advancedVisible = !advancedVisible">
            <span class="text-subtitle2">{{ $t('common.advanced') }}</span>
            <q-icon :name="advancedVisible ? 'expand_less' : 'expand_more'" class="q-ml-xs" />
        </div>
        <Transition>
            <div v-if="advancedVisible" class="column">
                <div class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-3">
                        <q-input v-model.number="axisModel.labels.x" type="number" :label="$t('dashboard.widgetEditor.highcharts.labels.xCoordinate')" outlined dense @blur="onInputNumberChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.labels.xAlignValueHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-9">
                        <q-input v-model="axisModel.labels.format" :label="$t('dashboard.widgetEditor.format')" type="textarea" outlined dense autogrow maxlength="250" @change="modelChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.labels.formatHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                </div>
                <div class="row q-mb-sm">
                    <div class="col-12">
                        <q-banner v-if="axisModel.labels.formatterError" class="q-mb-xs bg-warning text-white" rounded dense>{{ axisModel.labels.formatterError }}</q-banner>
                        <div class="formatter-block">
                            <div class="row items-center q-mb-xs">
                                <span class="text-caption text-grey-7">{{ $t('dashboard.widgetEditor.formatter') }}</span>
                                <q-icon name="help_outline" size="xs" class="q-ml-xs cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.labels.formatterHint') }}</q-tooltip>
                                </q-icon>
                            </div>
                            <HighchartsFormatterMonaco :prop-code="axisModel.labels.formatterText" :disabled="false" @change="onFormatterChange" @blur="modelChanged" />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsAxisSettingsDescriptor.json'
import settingsDescriptor from '../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import HighchartsFormatterMonaco from '../common/HighchartsFormatterMonaco.vue'

export default defineComponent({
    name: 'highcharts-axis-settings',
    components: { WidgetEditorStyleToolbar, HighchartsFormatterMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, axis: { type: String, required: true } },
    data() {
        return {
            descriptor,
            settingsDescriptor,
            axisModel: null as any,
            toolbarModel: {} as { 'font-style': string; 'font-family': string; 'font-size': string; 'font-weight': string; color: string },
            advancedVisible: false,
            getTranslatedLabel
        }
    },
    computed: {
        chartType() {
            return this.widgetModel.settings.chartModel?.model?.chart?.type
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            if (!this.widgetModel.settings.chartModel || !this.widgetModel.settings.chartModel.model) return
            this.axisModel = (this.axis === 'x' && this.chartType !== 'bar') || (this.chartType === 'bar' && this.axis === 'y') ? this.widgetModel.settings.chartModel.model.xAxis[0] : this.widgetModel.settings.chartModel.model.yAxis[0]
            this.loadToolbarModel()
        },
        loadToolbarModel() {
            if (this.axisModel && this.axisModel.labels)
                this.toolbarModel = {
                    'font-style': this.axisModel.labels.style.fontStyle,
                    'font-family': this.axisModel.labels.style.fontFamily,
                    'font-size': this.axisModel.labels.style.fontSize,
                    'font-weight': this.axisModel.labels.style.fontWeight,
                    color: this.axisModel.labels.style.color
                }
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onInputNumberChanged() {
            setTimeout(() => this.modelChanged(), 250)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.axisModel || !this.axisModel.labels) return
            this.toolbarModel = { 'font-style': model['font-style'] ?? '', 'font-family': model['font-family'] ?? '', 'font-size': model['font-size'] ?? '14px', 'font-weight': model['font-weight'] ?? '', color: model.color ?? '' }
            this.axisModel.labels.style = { color: this.toolbarModel.color ?? '', fontSize: this.toolbarModel['font-size'] ?? '14px', fontFamily: this.toolbarModel['font-family'] ?? '', fontWeight: this.toolbarModel['font-weight'] ?? '', fontStyle: this.toolbarModel['font-style'] }
            this.modelChanged()
        },
        onFormatterChange(newValue: string) {
            if (!this.axisModel) return
            this.axisModel.labels.formatterText = newValue
        },
        removeValue(value: 'min' | 'max') {
            this.axisModel[value] = null
        }
    }
})
</script>

<style lang="scss" scoped>
.formatter-block {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px;
}
</style>
