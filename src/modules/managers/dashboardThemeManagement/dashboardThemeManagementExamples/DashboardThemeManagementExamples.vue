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
            <WidgetRenderer :widget="discoveryModel" :widget-data="discoveryWidgetMock.discoveryDataMock" :widget-initial-data="discoveryWidgetMock.discoveryDataMock" :datasets="[]" :dashboard-id="'discovery'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <ActiveSelectionsExample ref="activeSelections" :selected-theme-prop="selectedThemeProp" widget-type="activeSelections" />
        <div class="p-p-2 p-d-flex" style="height: 200px">
            <WidgetRenderer ref="selector" :widget="radioModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, radioModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, radioModel)" :datasets="[]" :dashboard-id="'selector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 200px">
            <WidgetRenderer ref="checkboxSelector" :widget="checkboxModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, checkboxModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, checkboxModel)" :datasets="[]" :dashboard-id="'checkboxSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 100px">
            <WidgetRenderer ref="dropdownSelector" :widget="selectModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, selectModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, selectModel)" :datasets="[]" :dashboard-id="'dropdownSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 100px">
            <WidgetRenderer ref="multiDropdownSelector" :widget="multiDropdownModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, multiDropdownModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, multiDropdownModel)" :datasets="[]" :dashboard-id="'multiDropdownSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 100px">
            <WidgetRenderer ref="multiDropdownSelector" :widget="dateDropdownModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, dateDropdownModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, dateDropdownModel)" :datasets="[]" :dashboard-id="'multiDropdownSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 100px">
            <WidgetRenderer ref="multiDropdownSelector" :widget="dateRangeModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, dateRangeModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, dateRangeModel)" :datasets="[]" :dashboard-id="'multiDropdownSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 300px">
            <WidgetRenderer ref="multiDropdownSelector" :widget="sliderModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, sliderModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, sliderModel)" :datasets="[]" :dashboard-id="'multiDropdownSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 300px">
            <WidgetRenderer ref="multiDropdownSelector" :widget="rangeModel" :widget-data="formatSelectorData(selectorWidgetMock.selectorDataMock, rangeModel)" :widget-initial-data="formatSelectorData(selectorWidgetMock.selectorDataMock, rangeModel)" :datasets="[]" :dashboard-id="'multiDropdownSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
        </div>
        <div class="p-p-2 p-d-flex" style="height: 100px">
            <WidgetRenderer ref="buttonToggleSelector" :widget="buttonToggleModel" :widget-data="formatSelectorData(buttonToggleDataMock, buttonToggleModel)" :widget-initial-data="formatSelectorData(buttonToggleDataMock, buttonToggleModel)" :datasets="[]" :dashboard-id="'buttonToggleSelector'" :selection-is-locked="true" :prop-active-selections="[]" :variables="[]" :widget-loading="false" />
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
            chartID: crypto.randomUUID(),
            chartJSData: { labels: [], datasets: [] } as IChartJSData,
            chartJSOptions: {} as IChartJSOptions,
            radioModel: {} as any,
            checkboxModel: {} as any,
            selectModel: {} as any,
            multiDropdownModel: {} as any,
            dateDropdownModel: {} as any,
            dateRangeModel: {} as any,
            sliderModel: {} as any,
            rangeModel: {} as any,
            buttonToggleModel: {} as any
        }
    },
    computed: {
        ...mapState(appStore, { isEnterprise: 'isEnterprise' }),
        buttonToggleDataMock(): any {
            const mock = this.selectorWidgetMock.selectorDataMock
            return { ...mock, rows: mock.rows.slice(0, 6), results: 6 }
        }
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

            this.radioModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.radioModel.settings.style = this.selectedTheme.config.selector.style
            this.radioModel.settings.configuration.selectorType.modality = 'singleValue'

            this.checkboxModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.checkboxModel.settings.style = this.selectedTheme.config.selector.style
            this.checkboxModel.settings.configuration.selectorType.modality = 'multiValue'

            this.selectModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.selectModel.settings.style = this.selectedTheme.config.selector.style
            this.selectModel.settings.configuration.selectorType.modality = 'dropdown'

            this.multiDropdownModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.multiDropdownModel.settings.style = this.selectedTheme.config.selector.style
            this.multiDropdownModel.settings.configuration.selectorType.modality = 'multiDropdown'

            this.dateDropdownModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.dateDropdownModel.settings.style = this.selectedTheme.config.selector.style
            this.dateDropdownModel.settings.configuration.selectorType.modality = 'date'

            this.dateRangeModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.dateRangeModel.settings.style = this.selectedTheme.config.selector.style
            this.dateRangeModel.settings.configuration.selectorType.modality = 'dateRange'

            this.sliderModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.sliderModel.settings.style = this.selectedTheme.config.selector.style
            this.sliderModel.settings.configuration.selectorType.modality = 'slider'

            this.rangeModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.rangeModel.settings.style = this.selectedTheme.config.selector.style
            this.rangeModel.settings.configuration.selectorType.modality = 'range'

            this.buttonToggleModel = deepcopy(this.selectorWidgetMock.selectorModelMock)
            this.buttonToggleModel.settings.style = this.selectedTheme.config.selector.style
            this.buttonToggleModel.settings.configuration.selectorType.modality = 'buttonToggle'
        },

        setEventListeners() {
            emitter.on('scrollToExample', this.scrollToExample)
        },
        removeEventListeners() {
            emitter.off('scrollToExample', this.scrollToExample)
        },
        formatSelectorData(mockData: any, model: any): any {
            // Wrap simple mock data into multi-column format expected by selector
            // { rows: [...] } => { columnName: { rows: [...] } }
            if (!model?.columns?.[0]?.columnName) return mockData
            const columnName = model.columns[0].columnName
            return { [columnName]: mockData }
        },
        scrollToExample(widgetType: any) {
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
