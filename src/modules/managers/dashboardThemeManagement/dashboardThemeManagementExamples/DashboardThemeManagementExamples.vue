<template>
    <div class="p-p-2 p-d-flex p-flex-column" style="gap: 25px">
        <!-- <div :id="chartID" style="width: 100%; height: 100%; margin: 0 auto"></div> -->
        <!-- <Pie :chart-options="chartJSOptions" :chart-data="chartJSData" :chart-id="'pie-chart'" :dataset-id-key="'label'" /> -->

        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="text" />
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="image" />
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="chart" />
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="html" />
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="map" />
        <!-- <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="customChart" /> -->
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="python" />
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="r" />
        <div class="p-p-2 p-d-flex" style="min-height: 415px">
            <WidgetRenderer :widget="tableModel" :widget-data="tableWidgetMock.tableDataMock" :widget-initial-data="tableWidgetMock.tableDataMock" :datasets="[]" :dashboard-id="'table'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <WidgetPictureExamples :selected-theme-prop="selectedThemeProp" widget-type="pivot" />
        <div class="p-p-2 p-d-flex" style="min-height: 415px">
            <WidgetRenderer
                :widget="discoveryModel"
                :widget-data="discoveryWidgetMock.discoveryDataMock"
                :widget-initial-data="discoveryWidgetMock.discoveryDataMock"
                :datasets="[]"
                :dashboard-id="'discovery'"
                :selection-is-locked="true"
                :prop-active-selections="[]"
                :variables="[]"
                :widget-loading="false"
            />
        </div>
        <ActiveSelectionsExample :selected-theme-prop="selectedThemeProp" widget-type="activeSelections" />
        <div class="p-p-2 p-d-flex" style="height: 240px">
            <WidgetRenderer
                :widget="selectorModel"
                :widget-data="selectorWidgetMock.selectorDataMock"
                :widget-initial-data="selectorWidgetMock.selectorDataMock"
                :datasets="[]"
                :dashboard-id="'selector'"
                :selection-is-locked="true"
                :prop-active-selections="[]"
                :variables="[]"
                :widget-loading="false"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardTheme } from '../DashboardThememanagement'
import { mapState } from 'pinia'
import { IChartJSData, IChartJSOptions } from '@/modules/documentExecution/dashboard/interfaces/chartJS/DashboardChartJSWidget'
import { Pie } from 'vue-chartjs'
import tableWidgetMock from './mocks/TableWidgetMock.json'
import discoveryWidgetMock from './mocks/DiscoveryWidgetMock.json'
import selectorWidgetMock from './mocks/SelectorWidgetMock.json'
import WidgetRenderer from '@/modules/documentExecution/dashboard/widget/WidgetRenderer.vue'
import deepcopy from 'deepcopy'
import cryptoRandomString from 'crypto-random-string'
import Highcharts from 'highcharts'
import HighchartsWidgetMock from './mocks/HighchartsWidgetMock.json'
import ChartJSWidgetMock from './mocks/ChartJSWidgetMock.json'
import appStore from '@/App.store'
import SelectorWidgetExample from './examples/SelectorWidgetExample.vue'
import ActiveSelectionsExample from './examples/ActiveSelectionsExample.vue'
import WidgetPictureExamples from './examples/WidgetPictureExamples.vue'

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetRenderer, Pie, SelectorWidgetExample, ActiveSelectionsExample, WidgetPictureExamples },
    props: { selectedThemeProp: { type: Object as any, required: true } },
    data() {
        return {
            tableWidgetMock,
            discoveryWidgetMock,
            selectorWidgetMock,
            tableModel: {} as any,
            discoveryModel: {} as any,
            selectorModel: {} as any,
            selectedTheme: {} as IDashboardTheme,
            chartID: cryptoRandomString({ length: 16, type: 'base64' }),
            chartJSData: { labels: [], datasets: [] } as IChartJSData,
            chartJSOptions: {} as IChartJSOptions
        }
    },
    computed: {
        ...mapState(appStore, { isEnterprise: 'isEnterprise' })
    },
    watch: {
        selectedThemeProp() {
            this.loadSelectedTheme()
            this.loadWidgetModels()
            //  this.loadChartExample()
        }
    },
    created() {
        console.log('THEME PROP ------------- \n', this.selectedThemeProp)
        this.loadSelectedTheme()
        this.loadWidgetModels()
    },
    mounted() {
        // this.loadChartExample()
    },
    methods: {
        loadSelectedTheme() {
            this.selectedTheme = this.selectedThemeProp as IDashboardTheme
        },
        loadWidgetModels() {
            this.tableModel = deepcopy(this.tableWidgetMock.tableModelMock)
            this.tableModel.settings.style = this.selectedTheme.config.table.style

            this.discoveryModel = deepcopy(this.discoveryWidgetMock.discoveryModelMock)
            this.discoveryModel.settings.style = this.selectedTheme.config.discovery.style

            this.selectorModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.selectorModel.settings.style = this.selectedTheme.config.selector.style
        },
        loadChartExample() {
            if (this.isEnterprise) {
                this.highchartsInstance = Highcharts.chart(this.chartID, HighchartsWidgetMock as any)
                this.highchartsInstance.reflow()
            } else {
                this.chartJSData = ChartJSWidgetMock.chartData
                this.chartJSOptions = {
                    ...ChartJSWidgetMock.chartOptions,
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        }
    }
})
</script>
<style lang="scss"></style>
