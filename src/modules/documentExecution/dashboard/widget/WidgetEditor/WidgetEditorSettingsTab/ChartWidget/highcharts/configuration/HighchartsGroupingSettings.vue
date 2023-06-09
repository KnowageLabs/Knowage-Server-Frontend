<template>
    <div v-if="groupingSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-if="['area', 'bar', 'column', 'line'].includes(chartType)" class="p-col-3 p-grid p-ai-center p-p-4">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.grouping.groupByCategories') }}</label>
            <InputSwitch v-model="groupingSettings.enabled" :disabled="groupingDisabled"></InputSwitch>
            <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.grouping.groupByCategoriesHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
        </div>

        <div v-if="['area', 'bar', 'column', 'line'].includes(chartType)" class="p-col-3 p-grid p-ai-center p-p-4">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.grouping.secondSerie') }}</label>
            <InputSwitch v-model="groupingSettings.secondSeries.enabled" :disabled="seriesGroupingDisabled"></InputSwitch>
            <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.grouping.secondSerieHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
        </div>

        <div class="p-col-3 p-grid p-ai-center p-p-4">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.grouping.secondCategory') }}</label>
            <InputSwitch v-model="groupingSettings.secondDimension.enabled" :disabled="dimensionGroupingDisabled"></InputSwitch>
            <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.grouping.secondCategoryHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
        </div>

        <div class="p-col-3 p-d-flex p-flex-column kn-flex p-pr-4">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.grouping.secondCategoryToUse') }}</label>
            <Dropdown v-model="groupingSettings.secondDimension.serie" class="kn-material-input" :options="measureColumns" option-value="columnName" option-label="columnName" :disabled="secondDimensionDisabled"> </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'highcharts-grouping-settings',
    components: { Dropdown, InputSwitch },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            groupingSettings: null as any
        }
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
        },
        groupingDisabled() {
            return !this.groupingSettings || this.groupingSettings.secondSeries.enabled || this.groupingSettings.secondDimension.enabled
        },
        seriesGroupingDisabled() {
            return !this.groupingSettings || this.groupingSettings.enabled || this.groupingSettings.secondDimension.enabled
        },
        dimensionGroupingDisabled() {
            return !this.groupingSettings || this.groupingSettings.enabled || this.groupingSettings.secondSeries.enabled
        },
        secondDimensionDisabled() {
            return !this.groupingSettings || !this.groupingSettings.secondDimension.enabled
        },
        measureColumns() {
            return this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            if (this.widgetModel?.settings?.configuration) this.groupingSettings = this.widgetModel.settings.configuration.grouping
        }
    }
})
</script>
