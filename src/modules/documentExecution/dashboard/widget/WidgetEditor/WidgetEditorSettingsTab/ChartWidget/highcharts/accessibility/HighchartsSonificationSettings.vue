<template>
    <div v-if="model?.sonification" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12 p-md-6 p-lg-6 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.sonification.duration') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center p-fluid">
                <InputNumber v-model="model.sonification.duration" class="kn-material-input p-inputtext-sm" :disabled="sonificationDisabled" />
                <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.sonification.durationHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>
        <div class="p-col-12 p-md-6 p-lg-6 p-d-flex p-flex-row p-ai-center">
            <div class="p-d-flex p-flex-column kn-width-full p-p-2">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.sonification.order') }}</label>
                <Dropdown v-model="model.sonification.order" class="kn-material-input" :options="descriptor.sonificationOrderOptions" option-value="value" :disabled="sonificationDisabled">
                    <template #value="slotProps">
                        <div>
                            <span>{{ getTranslatedLabel(slotProps.value, descriptor.sonificationOrderOptions, $t) }}</span>
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div>
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>
            <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.sonification.orderHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2 p-mt-4"></i>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsAccessibilityDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

export default defineComponent({
    name: 'highcharts-sonification-settings',
    components: { Dropdown, InputNumber },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            getTranslatedLabel
        }
    },
    computed: {
        sonificationDisabled(): boolean {
            return !this.model || !this.model.sonification.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
        }
    }
})
</script>
