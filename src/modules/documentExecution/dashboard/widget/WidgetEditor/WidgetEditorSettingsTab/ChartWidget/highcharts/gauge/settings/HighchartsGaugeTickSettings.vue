<template>
    <div v-if="model?.yAxis && model.yAxis[0]" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-4">
                <q-select v-model="model.yAxis[0].tickPosition" :label="$t('dashboard.widgetEditor.highcharts.tick.tickPosition')" emit-value map-options outlined dense :options="descriptor.tickPositionOptions" option-value="value" option-label="label" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.tickPositionOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.tick.tickPositionHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-select>
            </div>
            <div class="col-4">
                <q-input v-model.number="model.yAxis[0].tickLength" type="number" :label="$t('dashboard.widgetEditor.highcharts.tick.tickLength')" outlined dense @blur="onInputNumberChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.tick.tickLengthHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-4">
                <q-input v-model.number="model.yAxis[0].tickWidth" type="number" :label="$t('dashboard.widgetEditor.highcharts.tick.tickWidth')" outlined dense @blur="onInputNumberChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.tick.tickWidthHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="minorTickInterval" :label="$t('dashboard.widgetEditor.highcharts.tick.minorTickInterval')" outlined dense @change="onMinorIntervalChange">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-mr-xs">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.tick.minorTickIntervalHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="model.yAxis[0].tickColor" :label="$t('dashboard.widgetEditor.highcharts.tick.tickColor')" @change="onSelectionColorChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorColorPicker from '../../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'hihgcharts-gauge-tick-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            minorTickInterval: null as string | null,
            getTranslatedLabel
        }
    },
    computed: {},
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (this.model?.yAxis && this.model?.yAxis[0].minorTickInterval) this.minorTickInterval = this.model.yAxis[0].minorTickInterval
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onInputNumberChanged() {
            setTimeout(() => this.modelChanged(), 250)
        },
        onSelectionColorChanged(event: string | null) {
            if (!event || !this.model) return
            this.model.yAxis[0].tickColor = event
            this.modelChanged()
        },
        onMinorIntervalChange() {
            if (!this.model) return
            if (this.minorTickInterval === 'auto' || this.minorTickInterval === null) this.model.yAxis[0].minorTickInterval = this.minorTickInterval
            else this.model.yAxis[0].minorTickInterval = +this.minorTickInterval
            this.modelChanged()
        },
        removeMinorTickInterval() {
            if (!this.model) return
            this.minorTickInterval = null
            this.model.yAxis[0].minorTickInterval = null
            this.modelChanged()
        }
    }
})
</script>
