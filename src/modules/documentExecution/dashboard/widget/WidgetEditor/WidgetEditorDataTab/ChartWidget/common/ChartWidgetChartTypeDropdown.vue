<template>
    <div v-if="widgetModel">
        <div class="p-d-flex p-flex-row p-ai-center p-p-4">
            <Dropdown v-model="selectedType" class="kn-material-input kn-flex" :options="chartTypeOptions" option-value="value" @change="onChange">
                <template #value="slotProps">
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <img class="chart-type-image p-mr-2" :src="getImageSource(slotProps.value)" />
                        <span>{{ getTranslatedLabel(slotProps.value, chartTypeOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <img class="chart-type-image p-mr-2" :src="getImageSource(slotProps.option.value)" />
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import { mapState } from 'pinia'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import Dropdown from 'primevue/dropdown'
import mainStore from '@/App.store'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'

export default defineComponent({
    name: 'chart-widget-chart-type-dropdown',
    components: { Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {
            commonDescriptor,
            selectedType: '',
            getTranslatedLabel
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        chartTypeOptions() {
            return this.isEnterprise ? commonDescriptor.chartTypeOptions : commonDescriptor.chartTypeOptions.filter((chartOption: any) => ['bar', 'line', 'pie'].includes(chartOption.value))
        }
    },
    async created() {
        this.loadSelectedType()
    },

    methods: {
        loadSelectedType() {
            const chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (chartModel?.chart.type) {
                this.selectedType = chartModel.chart.type
                if (this.selectedType === 'sankey' && chartModel.chart.inverted) this.selectedType = 'sankeyInverted'
                if (['area', 'bar', 'line'].includes(this.selectedType) && chartModel.plotOptions.series.stacking) this.selectedType = this.selectedType + 'Stacked'
                if (this.selectedType === 'scatter' && chartModel.plotOptions?.scatter?.jitter) this.selectedType = 'scatterJitter'
            }
        },
        getImageSource(chartValue: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/chartTypes/${chartValue}.png`
        },
        onChange() {
            this.$emit('selectedChartTypeChanged', this.selectedType)
        }
    }
})
</script>

<style lang="scss" scoped>
.chart-type-image {
    width: 20px;
    height: 20px;
}
</style>
