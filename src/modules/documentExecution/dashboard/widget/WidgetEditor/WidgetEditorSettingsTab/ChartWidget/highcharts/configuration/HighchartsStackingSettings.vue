<template>
    <div v-if="seriesSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ seriesSettings }}
        </div>

        <div class="p-col-3 p-d-flex p-flex-column kn-flex p-pr-4">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.grouping.secondCategoryToUse') }}</label>
            <Dropdown v-model="seriesSettings.stacking" class="kn-material-input" :options="descriptor.stackingOptions" option-value="value">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.stackingOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import Dropdown from 'primevue/dropdown'
import descriptor from './HighchartsConfigurationDescriptor.json'

export default defineComponent({
    name: 'highcharts-stacking-settings',
    components: { Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IWidget | null,
            seriesSettings: null as any,
            getTranslatedLabel
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
            if (this.widgetModel.settings.chartModel?.model?.plotOptions?.series) this.seriesSettings = this.widgetModel.settings.chartModel.model.plotOptions.series
        }
    }
})
</script>
