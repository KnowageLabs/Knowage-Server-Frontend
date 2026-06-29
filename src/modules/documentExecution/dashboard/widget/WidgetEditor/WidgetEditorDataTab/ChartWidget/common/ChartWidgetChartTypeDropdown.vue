<template>
    <div v-if="widgetModel">
        <q-select v-model="selectedType" class="kn-flex" :options="filteredOptions" :option-label="(opt) => $t(opt.label)" option-value="value" emit-value map-options outlined dense use-input hide-selected fill-input input-debounce="0" @filter="filterFn" @update:model-value="onChange">
            <template #prepend>
                <img v-if="selectedType" class="chart-type-image" :src="getImageSource(selectedType)" />
            </template>
            <template #option="slotProps">
                <q-item v-bind="slotProps.itemProps">
                    <q-item-section avatar>
                        <img class="chart-type-image" :src="getImageSource(slotProps.opt.value)" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                    </q-item-section>
                </q-item>
            </template>
        </q-select>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapState } from 'pinia'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'chart-widget-chart-type-dropdown',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {
            commonDescriptor,
            selectedType: '',
            filteredOptions: [] as any[]
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
        this.filteredOptions = this.chartTypeOptions
        this.loadSelectedType()
    },

    methods: {
        loadSelectedType() {
            const chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (chartModel?.chart.type) {
                this.selectedType = chartModel.chart.type
                if (this.selectedType === 'sankey' && chartModel.chart.inverted) this.selectedType = 'sankeyInverted'
                if (['area', 'bar', 'line', 'column'].includes(this.selectedType) && chartModel.plotOptions.series.stacking) this.selectedType = this.selectedType + 'Stacked'
                if (this.selectedType === 'scatter' && chartModel.plotOptions?.scatter?.jitter) this.selectedType = 'scatterJitter'
            }
        },
        getImageSource(chartValue: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/chartTypes/${chartValue}.svg`
        },
        onChange() {
            this.$emit('selectedChartTypeChanged', this.selectedType)
        },
        filterFn(val: string, update: (fn: () => void) => void) {
            update(() => {
                if (!val.trim()) {
                    this.filteredOptions = this.chartTypeOptions
                } else {
                    const needle = val.toLowerCase()
                    this.filteredOptions = this.chartTypeOptions.filter((opt: any) => this.$t(opt.label).toLowerCase().includes(needle))
                }
            })
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
