<template>
    <div v-if="axisModel" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-12 col-md-6">
                <q-input v-model="axisModel.title.text" :label="$t('common.text')" outlined dense :disable="titleDisabled" @change="modelChanged" />
            </div>
            <div class="col-12 col-md-6">
                <q-select v-model="axisModel.title.align" :label="$t('common.align')" emit-value map-options outlined dense :options="axisAlignOptions" option-value="value" option-label="label" :disable="titleDisabled" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, axisAlignOptions, $t) }}</span>
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
                <WidgetEditorStyleToolbar :options="descriptor.styleToolbarSettings" :prop-model="toolbarModel" :disabled="titleDisabled" @change="onStyleToolbarChange" />
            </div>
        </div>
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

export default defineComponent({
    name: 'highcharts-heatmap-axis-title-settings',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, axis: { type: String, required: true } },
    data() {
        return {
            descriptor,
            settingsDescriptor,
            axisModel: null as any,
            toolbarModel: {} as { 'font-style': string; 'font-family': string; 'font-size': string; 'font-weight': string; color: string },
            getTranslatedLabel
        }
    },
    computed: {
        chartType() {
            return this.widgetModel.settings.chartModel?.model?.chart?.type
        },
        titleDisabled() {
            return !this.axisModel || !this.axisModel.title || !this.axisModel.title.enabled
        },
        axisAlignOptions() {
            return (this.axis === 'x' && this.chartType !== 'bar') || (this.chartType === 'bar' && this.axis === 'y') ? descriptor.xAxisTitleAlignOptions : descriptor.yAxisTitleAlignOptions
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
            if (this.axisModel && this.axisModel.title) this.toolbarModel = { 'font-style': this.axisModel.title.style.fontStyle, 'font-family': this.axisModel.title.style.fontFamily, 'font-size': this.axisModel.title.style.fontSize, 'font-weight': this.axisModel.title.style.fontWeight, color: this.axisModel.title.style.color }
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.axisModel || !this.axisModel.title) return
            this.toolbarModel = { 'font-style': model['font-style'] ?? '', 'font-family': model['font-family'] ?? '', 'font-size': model['font-size'] ?? '14px', 'font-weight': model['font-weight'] ?? '', color: model.color ?? '' }
            this.axisModel.title.style = { fontStyle: this.toolbarModel['font-style'] ?? '', color: this.toolbarModel.color ?? '', fontSize: this.toolbarModel['font-size'] ?? '14px', fontFamily: this.toolbarModel['font-family'] ?? '', fontWeight: this.toolbarModel['font-weight'] ?? '' }
            this.modelChanged()
        }
    }
})
</script>
