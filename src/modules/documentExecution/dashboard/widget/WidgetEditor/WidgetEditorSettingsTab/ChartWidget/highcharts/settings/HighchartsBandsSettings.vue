<template>
    <div v-if="axisModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-if="axisModel.plotBands.length === 0" class="p-grid p-col-12 p-pl-2">
            <Message class="p-col-11" :closable="false">{{ bandsHint }}</Message>
            <div class="p-col-1 p-text-right">
                <i class="pi pi-plus-circle kn-cursor-pointer p-pt-4" @click="addPlotBand()"></i>
            </div>
        </div>

        <template v-else>
            <div v-for="(plotBand, index) in axisModel.plotBands" :key="index" class="p-grid p-col-12 p-ai-center p-ai-center p-pt-2">
                <div class="p-col-12 p-md-6 p-lg-6 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.from') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <InputText v-model="plotBand.from" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                        <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.bands.fromHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
                    </div>
                </div>
                <div class="p-col-12 p-md-6 p-lg-6 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.to') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <InputText v-model="plotBand.to" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                        <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.bands.toHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
                    </div>
                </div>
                <div class="p-col-12 p-md-6 p-lg-6 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.bands.thickness') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <InputNumber v-model="plotBand.thickness" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                        <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.bands.thicknessHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
                    </div>
                </div>
                <div class="p-col-12 p-md-6 p-lg-6 p-px-2 p-pt-4">
                    <WidgetEditorColorPicker :initial-value="plotBand.color" :label="$t('dashboard.widgetEditor.highcharts.tick.tickColor')" @change="onSelectionColorChanged($event, plotBand)"></WidgetEditorColorPicker>
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
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'

export default defineComponent({
    name: 'hihgcharts-bands-settings',
    components: { InputNumber, Message, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, axis: { type: String, required: true } },
    data() {
        return {
            descriptor,
            axisModel: null as any
        }
    },
    computed: {
        chartType() {
            return this.widgetModel.settings.chartModel?.model?.chart?.type
        },
        bandsHint() {
            let commonHint = this.$t('dashboard.widgetEditor.highcharts.bands.bandsHint')
            if (!['radar', 'column', 'line'].includes(this.chartType)) commonHint += this.$t('dashboard.widgetEditor.highcharts.bands.bandsGaugeHint')
            return commonHint
        }
    },
    created() {
        this.loadModel()
    },

    methods: {
        loadModel() {
            if (!this.widgetModel.settings.chartModel || !this.widgetModel.settings.chartModel.model) return
            this.axisModel = (this.axis === 'x' && this.chartType !== 'bar') || (this.chartType === 'bar' && this.axis === 'y') ? this.widgetModel.settings.chartModel.model.xAxis[0] : this.widgetModel.settings.chartModel.model.yAxis[0]
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onSelectionColorChanged(event: string | null, plotBand: any) {
            if (!event) return
            plotBand.color = event
            this.modelChanged()
        },
        onInputNumberChanged() {
            setTimeout(() => this.modelChanged(), 250)
        },
        addPlotBand() {
            if (!this.axisModel) return
            const defaultPlotBand = highchartsDefaultValues.getDefaultBandsSetting()
            this.axisModel.plotBands.push(defaultPlotBand)
        },
        deletePlotBand(index: number) {
            if (this.axisModel) this.axisModel.plotBands.splice(index, 1)
            this.modelChanged()
        }
    }
})
</script>
