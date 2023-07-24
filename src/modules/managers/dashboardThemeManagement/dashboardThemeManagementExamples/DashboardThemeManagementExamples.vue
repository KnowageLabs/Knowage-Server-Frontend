<template>
    <div class="p-p-2 p-d-flex" style="min-height: 415px">
        <WidgetRenderer :widget="tableModel" :widget-data="tableWidgetMock.tableDataMock" :widget-initial-data="tableWidgetMock.tableDataMock" :datasets="[]" :dashboard-id="'table'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        <div :id="chartID" style="width: 100%; height: 100%; margin: 0 auto"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardTheme } from '../DashboardThememanagement'
import tableWidgetMock from './mocks/TableWidgetMock.json'
import WidgetRenderer from '@/modules/documentExecution/dashboard/widget/WidgetRenderer.vue'
import deepcopy from 'deepcopy'
import cryptoRandomString from 'crypto-random-string'
import Highcharts from 'highcharts'
import HighchartsWidgetMock from './mocks/HighchartsWidgetMock.json'

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetRenderer },
    props: { selectedThemeProp: { type: Object as any, required: true } },
    data() {
        return {
            tableWidgetMock,
            selectedTheme: {} as IDashboardTheme,
            tableModel: {} as any,
            chartID: cryptoRandomString({ length: 16, type: 'base64' })
        }
    },
    computed: {},
    watch: {
        selectedThemeProp() {
            this.loadSelectedTheme()
            this.loadWidgetModels()
            this.loadChartExample()
        }
    },
    created() {
        this.loadSelectedTheme()
        this.loadWidgetModels()
    },
    mounted() {
        this.loadChartExample()
    },
    methods: {
        loadSelectedTheme() {
            this.selectedTheme = this.selectedThemeProp as IDashboardTheme
        },
        loadWidgetModels() {
            this.tableModel = deepcopy(this.tableWidgetMock.tableModelMock)
            this.tableModel.settings.style = this.selectedTheme.config.table.style
        },
        loadChartExample() {
            this.highchartsInstance = Highcharts.chart(this.chartID, HighchartsWidgetMock as any)
            this.highchartsInstance.reflow()
        }
    }
})
</script>
<style lang="scss"></style>
