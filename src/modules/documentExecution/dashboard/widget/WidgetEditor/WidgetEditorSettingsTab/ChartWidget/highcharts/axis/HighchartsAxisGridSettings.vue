<template>
    <div v-if="axisModel" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6 col-md-3">
                <q-input v-if="type === 'major'" v-model.number="axisModel.tickInterval" type="number" :label="$t('dashboard.widgetEditor.highcharts.lines.lineInterval')" outlined dense />
                <q-input v-else v-model.number="axisModel.minorTickInterval" type="number" :label="$t('dashboard.widgetEditor.highcharts.lines.lineInterval')" outlined dense />
            </div>
            <div class="col-6 col-md-4">
                <q-select v-if="type === 'major'" v-model="axisModel.gridLineDashStyle" :label="$t('dashboard.widgetEditor.highcharts.lines.lineType')" emit-value map-options outlined dense :options="descriptor.gridLineTypeOptions" option-value="value" option-label="label">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.gridLineTypeOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
                <q-select v-else v-model="axisModel.minorGridLineDashStyle" :label="$t('dashboard.widgetEditor.highcharts.lines.lineType')" emit-value map-options outlined dense :options="descriptor.gridLineTypeOptions" option-value="value" option-label="label">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.gridLineTypeOptions, $t) }}</span>
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
            <div class="col-10 col-md-4">
                <WidgetEditorColorPicker v-if="type === 'major'" :initial-value="getDisplayedGridLineColor('major')" :label="$t('dashboard.widgetEditor.highcharts.lines.lineColor')" @change="onSelectionColorChanged" />
                <WidgetEditorColorPicker v-else :initial-value="getDisplayedGridLineColor('minor')" :label="$t('dashboard.widgetEditor.highcharts.lines.lineColor')" @change="onSelectionColorChanged" />
            </div>
            <div class="col-2 col-md-1 row items-center justify-center">
                <q-btn flat dense icon="backspace" size="sm" @click="removeGridSettings">
                    <q-tooltip>{{ $t('common.clear') }}</q-tooltip>
                </q-btn>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsAxisSettingsDescriptor.json'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'highcharts-axis-grid-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, type: { type: String, required: true }, axis: { type: String, required: true } },
    data() {
        return {
            descriptor,
            axisModel: null as any,
            getTranslatedLabel
        }
    },
    computed: {
        chartType() {
            return this.widgetModel.settings.chartModel?.model?.chart?.type
        }
    },
    watch: {
        propAxisModel() {
            this.loadModel()
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
        getDisplayedGridLineColor(type: 'major' | 'minor') {
            if (!this.axisModel) return '#000000'
            return type === 'major' ? this.axisModel.gridLineColor || '#000000' : this.axisModel.minorGridLineColor || '#000000'
        },
        onSelectionColorChanged(event: string | null) {
            if (!event || !this.axisModel) return
            if (this.type === 'major') this.axisModel.gridLineColor = event
            else this.axisModel.minorGridLineColor = event
        },
        removeGridSettings() {
            if (!this.axisModel) return
            if (this.type === 'major') {
                this.axisModel.tickInterval = null
                this.axisModel.gridLineColor = ''
                this.axisModel.gridLineDashStyle = ''
            } else {
                this.axisModel.minorTickInterval = null
                this.axisModel.minorGridLineColor = ''
                this.axisModel.minorGridLineDashStyle = ''
            }
        }
    }
})
</script>
