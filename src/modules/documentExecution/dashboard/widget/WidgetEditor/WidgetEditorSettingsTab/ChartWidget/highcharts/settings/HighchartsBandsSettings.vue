<template>
    <div v-if="axisModel" class="q-px-md q-pb-sm">
        <div class="row no-wrap items-start q-mb-sm">
            <div class="col text-subtitle2">{{ bandsHint }}</div>
            <q-btn flat round dense color="primary" icon="add" class="q-ml-xs" @click="addPlotBand()" />
        </div>

        <div v-for="(plotBand, index) in axisModel.plotBands" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-input v-model="plotBand.from" :label="$t('common.from')" outlined dense @blur="onInputNumberChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.bands.fromHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-6">
                        <q-input v-model="plotBand.to" :label="$t('common.to')" outlined dense @blur="onInputNumberChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.bands.toHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-6">
                        <q-input v-model.number="plotBand.thickness" type="number" :label="$t('dashboard.widgetEditor.highcharts.bands.thickness')" outlined dense @blur="onInputNumberChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.bands.thicknessHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-6">
                        <WidgetEditorColorPicker :initial-value="plotBand.color" :label="$t('dashboard.widgetEditor.highcharts.tick.tickColor')" @change="onSelectionColorChanged($event, plotBand)" />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn flat round dense icon="delete" size="sm" @click="deletePlotBand(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'

export default defineComponent({
    name: 'hihgcharts-bands-settings',
    components: { WidgetEditorColorPicker },
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

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
