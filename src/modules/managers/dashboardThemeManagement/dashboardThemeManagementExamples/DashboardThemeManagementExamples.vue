<template>
    <div class="p-p-2 p-d-flex p-flex-column" style="gap: 25px">
        <WidgetPictureExamples ref="text" :selected-theme-prop="selectedThemeProp" widget-type="text" />
        <WidgetPictureExamples ref="image" :selected-theme-prop="selectedThemeProp" widget-type="image" />
        <WidgetPictureExamples ref="chart" :selected-theme-prop="selectedThemeProp" widget-type="chart" />
        <WidgetPictureExamples ref="html" :selected-theme-prop="selectedThemeProp" widget-type="html" />
        <WidgetPictureExamples ref="map" :selected-theme-prop="selectedThemeProp" widget-type="map" />
        <WidgetPictureExamples ref="customChart" :selected-theme-prop="selectedThemeProp" widget-type="customChart" />
        <WidgetPictureExamples ref="python" :selected-theme-prop="selectedThemeProp" widget-type="python" />
        <WidgetPictureExamples ref="r" :selected-theme-prop="selectedThemeProp" widget-type="r" />
        <div ref="table" class="p-p-2 p-d-flex" style="min-height: 415px">
            <WidgetRenderer ref="table" :widget="tableModel" :widget-data="tableWidgetMock.tableDataMock" :widget-initial-data="tableWidgetMock.tableDataMock" :datasets="[]" :dashboard-id="'table'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <WidgetPictureExamples ref="pivot" :selected-theme-prop="selectedThemeProp" widget-type="pivot" />
        <div ref="discovery" class="p-p-2 p-d-flex" style="min-height: 415px">
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
        <ActiveSelectionsExample ref="activeSelections" :selected-theme-prop="selectedThemeProp" widget-type="activeSelections" />
        <div class="p-p-2 p-d-flex" style="height: 200px">
            <WidgetRenderer
                ref="selector"
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
import tableWidgetMock from './mocks/TableWidgetMock.json'
import discoveryWidgetMock from './mocks/DiscoveryWidgetMock.json'
import selectorWidgetMock from './mocks/SelectorWidgetMock.json'
import WidgetRenderer from '@/modules/documentExecution/dashboard/widget/WidgetRenderer.vue'
import deepcopy from 'deepcopy'
import cryptoRandomString from 'crypto-random-string'
import appStore from '@/App.store'
import ActiveSelectionsExample from './examples/ActiveSelectionsExample.vue'
import WidgetPictureExamples from './examples/WidgetPictureExamples.vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'dashboard-theme-management-editor',
    components: { WidgetRenderer, ActiveSelectionsExample, WidgetPictureExamples },
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
        }
    },
    created() {
        this.loadSelectedTheme()
        this.loadWidgetModels()
    },
    mounted() {
        this.setEventListeners()
    },
    unmounted() {
        this.removeEventListeners()
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
        setEventListeners() {
            emitter.on('scrollToExample', this.scrollToExample)
        },
        removeEventListeners() {
            emitter.off('scrollToExample', this.scrollToExample)
        },
        scrollToExample(widgetType: any) {
            console.log('CLICKED TYPE', this.$refs[widgetType])
            if (widgetType === 'activeSelections') {
                // @ts-ignore
                this.$refs[widgetType].$el.nextSibling.scrollIntoView({ behavior: 'smooth' })
                return
            }
            // @ts-ignore
            if (this.$refs[widgetType].$el) this.$refs[widgetType].$el.scrollIntoView({ behavior: 'smooth' })
            // @ts-ignore
            else this.$refs[widgetType].scrollIntoView({ behavior: 'smooth' })
        }
    }
})
</script>
<style lang="scss"></style>
