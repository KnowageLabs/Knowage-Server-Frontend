<template>
    <div v-if="model" class="q-px-md">
        <div v-if="['heatmap', 'sunburst'].includes(chartType)" class="row q-col-gutter-sm">
            <div class="col-4">
                <q-input v-model="model.tooltip.valuePrefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense @change="modelChanged" />
            </div>
            <div class="col-4">
                <q-input v-model="model.tooltip.valueSuffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense @change="modelChanged" />
            </div>
            <div class="col-4">
                <q-input v-model.number="model.tooltip.valueDecimals" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense @blur="modelChanged" />
            </div>
        </div>
        <div class="row q-mb-sm">
            <div class="col-12 q-py-sm">
                <WidgetEditorStyleToolbar :options="descriptor.tooltipStyleOptions" :prop-model="toolbarModel" :disabled="tooltipDisabled" @change="onStyleToolbarChange" />
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
                                <q-banner v-if="model.tooltip.formatterError" class="q-mb-xs bg-warning text-white" rounded dense>{{ model.tooltip.formatterError }}</q-banner>
                                <div class="formatter-block">
                                    <div class="row items-center q-mb-xs">
                                        <span class="text-caption text-grey-7">{{ $t('dashboard.widgetEditor.formatter') }}</span>
                                        <q-icon name="help_outline" size="xs" class="q-ml-xs cursor-pointer text-grey-5">
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.tooltip.formatterHint') }}</q-tooltip>
                                        </q-icon>
                                    </div>
                                    <HighchartsFormatterMonaco :prop-code="model.tooltip.formatterText" :disabled="tooltipDisabled" @change="onFormatterChange($event, 'formatter')" @blur="modelChanged" />
                                </div>
                            </div>
                        </div>
                        <div class="row q-mb-sm">
                            <div class="col-12">
                                <q-banner v-if="model.tooltip.pointFormatterError" class="q-mb-xs bg-warning text-white" rounded dense>{{ model.tooltip.pointFormatterError }}</q-banner>
                                <div class="formatter-block">
                                    <div class="row items-center q-mb-xs">
                                        <span class="text-caption text-grey-7">{{ $t('dashboard.widgetEditor.highcharts.tooltip.pointFormatter') }}</span>
                                        <q-icon name="help_outline" size="xs" class="q-ml-xs cursor-pointer text-grey-5">
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.tooltip.pointFormatterHint') }}</q-tooltip>
                                        </q-icon>
                                    </div>
                                    <HighchartsFormatterMonaco :prop-code="model.tooltip.pointFormatterText" :disabled="tooltipDisabled" @change="onFormatterChange($event, 'pointFormatter')" @blur="modelChanged" />
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
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import HighchartsFormatterMonaco from '../common/HighchartsFormatterMonaco.vue'

export default defineComponent({
    name: 'hihgcharts-tooltip-settings',
    components: { WidgetEditorStyleToolbar, HighchartsFormatterMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as any | null,
            toolbarModel: {} as {
                'font-family': string
                'font-size': string
                'font-weight': string
                color: string
                'background-color': string
            },
            advancedVisible: false
        }
    },
    computed: {
        tooltipDisabled(): boolean {
            return !this.model || !this.model.tooltip.enabled
        },
        chartType() {
            return this.model?.chart.type
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (this.model?.tooltip)
                this.toolbarModel = {
                    'font-family': this.model.tooltip.style.fontFamily,
                    'font-size': this.model.tooltip.style.fontSize,
                    'font-weight': this.model.tooltip.style.fontWeight,
                    color: this.model.tooltip.style.color,
                    'background-color': this.model.tooltip.backgroundColor
                }
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.model || !this.model.tooltip) return
            this.toolbarModel = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? '',
                'background-color': model['background-color'] ?? ''
            }
            ;((this.model.tooltip.backgroundColor = this.toolbarModel['background-color'] ?? ''),
                (this.model.tooltip.style = {
                    fontFamily: this.toolbarModel['font-family'] ?? '',
                    fontSize: this.toolbarModel['font-size'] ?? '14px',
                    fontWeight: this.toolbarModel['font-weight'] ?? '',
                    color: this.toolbarModel.color ?? ''
                }))
            this.modelChanged()
        },
        onFormatterChange(newValue: string, type: 'formatter' | 'pointFormatter') {
            if (!this.model) return
            if (type === 'formatter') this.model.tooltip.formatterText = newValue
            else this.model.tooltip.pointFormatterText = newValue
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
