<template>
    <div v-if="model?.legend" class="q-px-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6 col-md-3">
                <q-select v-model="model.legend.align" :label="$t('common.align')" emit-value map-options outlined dense :options="descriptor.alignmentOptions" option-value="value" option-label="label" :disable="legendDisabled" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.alignmentOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                    <q-tooltip max-width="250px">{{ $t('dashboard.widgetEditor.highcharts.legend.alignHint') }}</q-tooltip>
                </q-select>
            </div>
            <div class="col-6 col-md-3">
                <q-select v-model="model.legend.verticalAlign" :label="$t('common.verticalAlign')" emit-value map-options outlined dense :options="descriptor.verticalAlignmentOptions" option-value="value" option-label="label" :disable="legendDisabled" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.verticalAlignmentOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                    <q-tooltip max-width="250px">{{ $t('dashboard.widgetEditor.highcharts.legend.verticalAlignHint') }}</q-tooltip>
                </q-select>
            </div>
            <div class="col-6 col-md-3">
                <q-select v-model="model.legend.layout" :label="$t('common.layout')" emit-value map-options outlined dense :options="descriptor.layoutOptions" option-value="value" option-label="label" :disable="legendDisabled" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.layoutOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                </q-select>
                <q-tooltip max-width="250px">{{ $t('dashboard.widgetEditor.highcharts.legend.layoutHint') }}</q-tooltip>
            </div>
            <div v-if="['area', 'bar', 'column', 'pie'].includes(chartType) && model.plotOptions.series" class="col-6 col-md-3 row items-center">
                <q-toggle v-model="model.plotOptions.series.showCheckbox" :label="$t('dashboard.widgetEditor.highcharts.showChekboxes')" dense />
            </div>
        </div>
        <div class="row q-mb-sm">
            <div class="col-12 q-py-sm">
                <WidgetEditorStyleToolbar :options="descriptor.legendStyleOptions" :prop-model="toolbarModel" :disabled="legendDisabled" @change="onStyleToolbarChange" />
            </div>
        </div>
        <div class="row q-mb-sm">
            <div class="col-12">
                <div class="row items-center justify-center cursor-pointer q-mb-sm" @click="advancedVisible = !advancedVisible">
                    <span class="text-subtitle2">{{ $t('common.advanced') }}</span>
                    <q-icon :name="advancedVisible ? 'expand_less' : 'expand_more'" class="q-ml-xs" />
                </div>
                <Transition>
                    <div v-if="advancedVisible" class="column">
                        <div class="row q-mb-sm">
                            <div class="col-12">
                                <q-input v-model="model.legend.labelFormat" :label="$t('dashboard.widgetEditor.format')" type="textarea" outlined dense autogrow maxlength="250" :disable="legendDisabled" :hint="$t('dashboard.widgetEditor.highcharts.legend.formatHint')" @change="modelChanged" />
                            </div>
                        </div>
                        <div class="row q-mb-sm">
                            <div class="col-12">
                                <q-banner v-if="model.legend.labelFormatterError" class="q-mb-xs bg-warning text-white" rounded dense>{{ model.legend.labelFormatterError }}</q-banner>
                                <div class="formatter-block">
                                    <div class="row items-center q-mb-xs">
                                        <span class="text-caption text-grey-7">{{ $t('dashboard.widgetEditor.formatter') }}</span>
                                        <q-icon name="help_outline" size="xs" class="q-ml-xs cursor-pointer text-grey-5">
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.legend.formatterHint') }}</q-tooltip>
                                        </q-icon>
                                    </div>
                                    <HighchartsFormatterMonaco :prop-code="model.legend.labelFormatterText" :disabled="false" @change="onFormatterChange" @blur="modelChanged" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '../../../../../../Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import HighchartsFormatterMonaco from '../common/HighchartsFormatterMonaco.vue'

export default defineComponent({
    name: 'hihgcharts-legend-settings',
    components: { WidgetEditorStyleToolbar, HighchartsFormatterMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            toolbarModel: {} as { 'font-family': string; 'font-size': string; 'font-weight': string; 'border-color': string; color: string; 'background-color': string },
            advancedVisible: false,
            getTranslatedLabel
        }
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
        },
        legendDisabled(): boolean {
            return !this.model || !this.model.legend.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.loadToolbarModel()
        },
        loadToolbarModel() {
            if (this.model?.legend) {
                this.toolbarModel = {
                    'font-family': this.model.legend.itemStyle.fontFamily,
                    'font-size': this.model.legend.itemStyle.fontSize,
                    'font-weight': this.model.legend.itemStyle.fontWeight,
                    'border-color': this.model.legend.borderColor ?? '',
                    color: this.model.legend.itemStyle.color,
                    'background-color': this.model.legend.backgroundColor
                }
            }
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.model || !this.model.legend) return
            this.toolbarModel = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-weight': model['font-weight'] ?? '',
                'border-color': model['border-color'] ?? '',
                color: model.color ?? '',
                'background-color': model['background-color'] ?? ''
            }
            this.model.legend.borderColor = this.toolbarModel['border-color'] ?? ''
            this.model.legend.backgroundColor = this.toolbarModel['background-color'] ?? ''
            this.model.legend.itemStyle = {
                color: this.toolbarModel.color ?? '',
                fontSize: this.toolbarModel['font-size'] ?? '14px',
                fontFamily: this.toolbarModel['font-family'] ?? '',
                fontWeight: this.toolbarModel['font-weight'] ?? ''
            }
            this.modelChanged()
        },
        getAlignValue(toolbarValue: string) {
            switch (toolbarValue) {
                case 'flex-start':
                    return 'left'
                case 'flex-end':
                    return 'right'
                default:
                    return 'center'
            }
        },
        onFormatterChange(newValue?: string) {
            debugger
            if (!this.model) return
            this.model.legend.labelFormatterText = newValue
        }
    }
})
</script>

<style lang="scss" scoped>
.v-enter-active,
.v-leave-active {
    transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}

.formatter-block {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px;
}
</style>
