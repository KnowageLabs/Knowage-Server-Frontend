<template>
    <div v-if="groupingSettings" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div v-if="['area', 'bar', 'column', 'line'].includes(chartType)" class="col-auto row items-center">
                <q-toggle v-model="groupingSettings.enabled" :disable="groupingDisabled" :label="$t('dashboard.widgetEditor.highcharts.grouping.groupByCategories')" dense>
                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.grouping.groupByCategoriesHint') }}</q-tooltip>
                </q-toggle>
            </div>

            <div class="col-12"><q-separator /></div>

            <div v-if="['bar', 'column'].includes(chartType)" class="col-auto row items-center col-12">
                <q-toggle v-model="groupingSettings.secondSeries.enabled" :disable="seriesGroupingDisabled" :label="$t('dashboard.widgetEditor.highcharts.grouping.secondSerie')" dense>
                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.grouping.secondSerieHint') }}</q-tooltip>
                </q-toggle>
            </div>
            <div class="col-auto row items-center">
                <q-toggle v-model="groupingSettings.secondDimension.enabled" :disable="dimensionGroupingDisabled" :label="$t('dashboard.widgetEditor.highcharts.grouping.secondCategory')" dense>
                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.grouping.secondCategoryHint') }}</q-tooltip>
                </q-toggle>
            </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <q-select v-model="groupingSettings.secondDimension.serie" :label="$t('dashboard.widgetEditor.highcharts.grouping.secondCategoryToUse')" emit-value map-options outlined dense :options="measureColumns" option-value="columnName" option-label="columnName" :disable="secondDimensionDisabled" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
export default defineComponent({
    name: 'highcharts-grouping-settings',
    components: {},
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
