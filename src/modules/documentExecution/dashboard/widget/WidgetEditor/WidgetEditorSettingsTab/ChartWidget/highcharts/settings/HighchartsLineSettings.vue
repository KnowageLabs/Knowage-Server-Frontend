<template>
    <div v-if="axisModel" class="q-px-md q-pb-sm">
        <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.highcharts.lines.linesHint') }}</span>
            <q-btn flat round dense color="primary" icon="add" @click="addPlotBand()" />
        </div>

        <div v-for="(plotLine, index) in axisModel.plotLines" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-6 col-md-3">
                        <q-input v-model="plotLine.value" :label="$t('common.value')" outlined dense @blur="onInputNumberChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.lines.valueHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-6 col-md-3">
                        <q-input v-model.number="plotLine.width" type="number" :label="$t('common.width')" outlined dense @blur="onInputNumberChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.lines.widthHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-6 col-md-3">
                        <q-select v-model="plotLine.dashStyle" :label="$t('common.type')" emit-value map-options outlined dense :options="descriptor.lineTypeOptions" option-value="value" option-label="label">
                            <template #selected-item="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.lineTypeOptions, $t) }}</span>
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
                    <div class="col-6 col-md-3">
                        <WidgetEditorColorPicker :initial-value="plotLine.color" :label="$t('dashboard.widgetEditor.highcharts.tick.tickColor')" @change="onSelectionColorChanged($event, plotLine)" />
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
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import settingsDescriptor from '../HighchartsWidgetSettingsDescriptor.json'
import descriptor from './HighchartsLineSettingsDescriptor.json'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'

export default defineComponent({
    name: 'hihgcharts-line-settings',
    components: { WidgetEditorColorPicker },
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

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
