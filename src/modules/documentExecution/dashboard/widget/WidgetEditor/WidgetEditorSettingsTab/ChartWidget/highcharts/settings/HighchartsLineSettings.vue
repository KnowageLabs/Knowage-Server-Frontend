<template>
    <div v-if="axisModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-if="axisModel.plotLines.length === 0" class="p-grid p-col-12 p-pl-2">
            <Message class="p-col-11" :closable="false">{{ $t('dashboard.widgetEditor.highcharts.lines.linesHint') }}</Message>
            <div class="p-col-1 p-text-right">
                <i class="pi pi-plus-circle kn-cursor-pointer p-pt-4" @click="addPlotBand()"></i>
            </div>
        </div>

        <template v-else>
            <div v-for="(plotLine, index) in axisModel.plotLines" :key="index" class="p-grid p-col-12 p-ai-center p-ai-center p-pt-2">
                <div class="p-col-12 p-md-3 p-lg-2 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.value') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <InputText v-model="plotLine.value" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                        <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.lines.valueHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
                    </div>
                </div>
                <div class="p-col-12 p-md-3 p-lg-2 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.width') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <InputNumber v-model="plotLine.width" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                        <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.lines.widthHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
                    </div>
                </div>

                <div class="p-col-12 p-md-3 p-lg-2 p-d-flex p-flex-column p-p-2">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.type') }}</label>
                    <Dropdown v-model="plotLine.dashStyle" class="kn-material-input" :options="descriptor.lineTypeOptions" option-value="value">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.lineTypeOptions, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <div class="p-col-12 p-md-6 p-lg-6 p-px-2 p-pt-4">
                    <WidgetEditorColorPicker :initial-value="plotLine.color" :label="$t('dashboard.widgetEditor.highcharts.tick.tickColor')" @change="onSelectionColorChanged($event, plotLine)"></WidgetEditorColorPicker>
                </div>

                <div class="p-col-1 p-d-flex p-flex-row p-jc-center p-ai-center p-pl-2">
                    <i v-if="index === 0" class="pi pi-plus-circle kn-cursor-pointer p-pr-4 p-pt-2" @click="addPlotBand()"></i>
                    <i :class="'pi pi-trash'" class="kn-cursor-pointer p-pt-2" @click="deletePlotBand(index)"></i>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import settingsDescriptor from '../HighchartsWidgetSettingsDescriptor.json'
import descriptor from './HighchartsLineSettingsDescriptor.json'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import Dropdown from 'primevue/dropdown'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'

export default defineComponent({
    name: 'hihgcharts-line-settings',
    components: { InputNumber, Message, WidgetEditorColorPicker, Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, axis: { type: String, required: true } },
    data() {
        return {
            descriptor,
            settingsDescriptor,
            axisModel: null as any,
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
            this.axisModel = (this.axis === 'x' && this.chartType !== 'bar') || (this.chartType === 'bar' && this.axis === 'y') ? this.widgetModel.settings.chartModel.model.xAxis[0] : this.widgetModel.settings.chartModel.model.yAxis[0]
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onSelectionColorChanged(event: string | null, plotLine: any) {
            if (!event) return
            plotLine.color = event
            this.modelChanged()
        },
        onInputNumberChanged() {
            setTimeout(() => this.modelChanged(), 250)
        },
        addPlotBand() {
            if (!this.axisModel) return
            const defaultPlotLine = highchartsDefaultValues.getDefaultPlotLinesSetting()
            this.axisModel.plotLines.push(defaultPlotLine)
        },
        deletePlotBand(index: number) {
            if (this.axisModel) this.axisModel.plotLines.splice(index, 1)
            this.modelChanged()
        }
    }
})
</script>
