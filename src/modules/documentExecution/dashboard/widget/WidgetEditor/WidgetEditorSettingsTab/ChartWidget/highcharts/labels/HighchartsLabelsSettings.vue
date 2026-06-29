<template>
    <div v-if="dataLabelsModel" class="q-px-md q-pb-md">
        <div v-if="dataLabelsModel.distance !== undefined" class="row q-col-gutter-sm q-mb-sm">
            <div class="col-12">
                <q-input v-model.number="dataLabelsModel.distance" type="number" :label="$t('dashboard.widgetEditor.highcharts.labels.distance')" outlined dense :disable="labelsConfigurationDisabled" :hint="$t('dashboard.widgetEditor.highcharts.labels.distanceHint')" @blur="modelChanged" />
            </div>
        </div>
        <div class="col-12 q-py-sm">
            <WidgetEditorStyleToolbar :options="descriptor.labelsStyleOptions" :prop-model="toolbarModel" :disabled="labelsConfigurationDisabled" @change="onStyleToolbarChange" />
        </div>
        <div class="row q-my-sm">
            <div class="col-12">
                <div class="row items-center justify-center cursor-pointer q-mb-sm" @click="advancedVisible = !advancedVisible">
                    <span class="text-subtitle2">{{ $t('common.advanced') }}</span>
                    <q-icon :name="advancedVisible ? 'expand_less' : 'expand_more'" class="q-ml-xs" />
                </div>
                <Transition>
                    <div v-if="advancedVisible" class="column">
                        <div class="row q-mb-sm">
                            <div class="col-12">
                                <q-input v-model="dataLabelsModel.format" :label="$t('dashboard.widgetEditor.format')" type="textarea" outlined dense autogrow maxlength="250" :disable="labelsConfigurationDisabled" :hint="$t('dashboard.widgetEditor.highcharts.labels.formatHint')" @change="modelChanged" />
                            </div>
                        </div>
                        <div class="row q-mb-sm">
                            <div class="col-12">
                                <q-banner v-if="dataLabelsModel.formatterError" class="q-mb-xs bg-warning text-white" rounded dense>{{ dataLabelsModel.formatterError }}</q-banner>
                                <div class="formatter-block">
                                    <div class="row items-center q-mb-xs">
                                        <span class="text-caption text-grey-7">{{ $t('dashboard.widgetEditor.formatter') }}</span>
                                        <q-icon name="help_outline" size="xs" class="q-ml-xs cursor-pointer text-grey-5">
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.labels.formatterHint') }}</q-tooltip>
                                        </q-icon>
                                    </div>
                                    <HighchartsFormatterMonaco :prop-code="dataLabelsModel.formatterText" :disabled="labelsConfigurationDisabled" @change="onFormatterChange" @blur="modelChanged" />
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
import { IHighchartsChartModel, IHighchartsChartDataLabels } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import HighchartsFormatterMonaco from '../common/HighchartsFormatterMonaco.vue'

export default defineComponent({
    name: 'hihgcharts-labels-settings',
    components: { WidgetEditorStyleToolbar, HighchartsFormatterMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            dataLabelsModel: null as IHighchartsChartDataLabels | null,
            toolbarModel: {} as {
                'justify-content': string
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
        labelsConfigurationDisabled(): boolean {
            return !this.dataLabelsModel || !this.dataLabelsModel.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.loadDataLabelsModel()
            this.loadToolbarModel()
        },
        loadDataLabelsModel() {
            switch (this.model?.chart.type) {
                case 'pie':
                    this.dataLabelsModel = this.model.plotOptions.pie?.dataLabels ?? null
                    break
                case 'activitygauge':
                    this.dataLabelsModel = this.model.plotOptions.solidgauge?.dataLabels ?? null
                    break
            }
        },
        loadToolbarModel() {
            if (this.dataLabelsModel)
                this.toolbarModel = {
                    'justify-content': this.dataLabelsModel.position,
                    'font-family': this.dataLabelsModel.style.fontFamily,
                    'font-size': this.dataLabelsModel.style.fontSize,
                    'font-weight': this.dataLabelsModel.style.fontWeight,
                    color: this.dataLabelsModel.style.color,
                    'background-color': this.dataLabelsModel.backgroundColor ?? ''
                }
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.model || !this.dataLabelsModel) return
            this.toolbarModel = {
                'justify-content': model['justify-content'] ?? '',
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? '',
                'background-color': model['background-color'] ?? ''
            }
            ;((this.dataLabelsModel.position = this.getTextAlignValue(this.toolbarModel['justify-content'])), (this.dataLabelsModel.backgroundColor = this.toolbarModel['background-color'] ?? ''))
            this.dataLabelsModel.style = {
                color: this.toolbarModel.color ?? '',
                fontSize: this.toolbarModel['font-size'] ?? '14px',
                fontFamily: this.toolbarModel['font-family'] ?? '',
                fontWeight: this.toolbarModel['font-weight'] ?? '',
                textOutline: 'none'
            }

            this.modelChanged()
        },
        getTextAlignValue(toolbarValue: string) {
            switch (toolbarValue) {
                case 'flex-start':
                    return 'left'
                case 'flex-end':
                    return 'right'
                default:
                    return 'center'
            }
        },
        onFormatterChange(newValue: string) {
            if (!this.model || !this.dataLabelsModel) return
            this.dataLabelsModel.formatterText = newValue
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
