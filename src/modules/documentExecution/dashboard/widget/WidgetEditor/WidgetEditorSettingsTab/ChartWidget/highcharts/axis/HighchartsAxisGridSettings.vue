<template>
    <div v-if="axisModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ axisModel }}
        </div>
        <div class="p-col-12 p-md-3 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.lines.lineInterval') }}</label>
            <InputNumber v-if="type === 'major'" v-model="axisModel.tickInterval" class="kn-material-input p-inputtext-sm" />
            <InputNumber v-else v-model="axisModel.minorTickInterval" class="kn-material-input p-inputtext-sm" />
        </div>
        <div class="p-col-12 p-md-4 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.lines.lineType') }}</label>
            <Dropdown v-if="type === 'major'" v-model="axisModel.gridLineDashStyle" class="kn-material-input" :options="descriptor.gridLineTypeOptions" option-value="value">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.gridLineTypeOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
            <Dropdown v-else v-model="axisModel.minorGridLineDashStyle" class="kn-material-input" :options="descriptor.gridLineTypeOptions" option-value="value">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.gridLineTypeOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
        </div>
        <div class="p-col-10 p-md-3 p-px-2 p-pt-4">
            <WidgetEditorColorPicker v-if="type === 'major'" :initial-value="axisModel.gridLineColor" :label="$t('dashboard.widgetEditor.highcharts.lines.lineColor')" @change="onSelectionColorChanged"></WidgetEditorColorPicker>
            <WidgetEditorColorPicker v-else :initial-value="axisModel.minorGridLineColor" :label="$t('dashboard.widgetEditor.highcharts.lines.lineColor')" @change="onSelectionColorChanged"></WidgetEditorColorPicker>
        </div>

        <div class="p-col-2 p-text-right p-mt-3">
            <Button icon="fa fa-eraser" class="p-button-text p-button-rounded p-button-plain" @click="removeGridSettings" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsAxisSettingsDescriptor.json'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'highcharts-axis-grid-settings',
    components: { InputNumber, Dropdown, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, type: { type: String, required: true } },
    data() {
        return {
            descriptor,
            axisModel: null as any,
            getTranslatedLabel
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
            this.axisModel = this.widgetModel.settings.chartModel.model.yAxis
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
