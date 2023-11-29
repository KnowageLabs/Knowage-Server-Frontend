<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="widget-editor-accordion">
            <AccordionTab v-for="(accordion, index) in filteredSettings" :key="index">
                <template #header>
                    <HighchartsWidgetSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></HighchartsWidgetSettingsAccordionHeader>
                </template>

                <Highcharts3DConfiguration v-if="accordion.type === 'ConfigurationOf3D'" :widget-model="widgetModel"></Highcharts3DConfiguration>
                <HighchartsNoDataMessageConfiguration v-else-if="accordion.type === 'NoDataMessageConfiguration'" :widget-model="widgetModel"></HighchartsNoDataMessageConfiguration>
                <HighchartsAccessibilitySettings v-else-if="accordion.type === 'AccessibilitySettings'" :widget-model="widgetModel"></HighchartsAccessibilitySettings>
                <HighchartsSeriesAccessibilitySettings v-else-if="accordion.type === 'SeriesAccessibilitySettings'" :prop-widget-model="widgetModel"></HighchartsSeriesAccessibilitySettings>
                <HighchartsLabelsSettings v-else-if="accordion.type === 'Labels'" :widget-model="widgetModel"></HighchartsLabelsSettings>
                <HighchartsLegendSettings v-else-if="accordion.type === 'Legend'" :widget-model="widgetModel"></HighchartsLegendSettings>
                <HighchartsTooltipSettings v-else-if="accordion.type === 'Tooltip'" :widget-model="widgetModel"></HighchartsTooltipSettings>
                <HighchartsActivityGaugeTooltipSettings v-else-if="accordion.type === 'ActivityGaugeTooltip'" :widget-model="widgetModel"></HighchartsActivityGaugeTooltipSettings>
                <HighchartsSeriesLabelSettings v-else-if="accordion.type === 'SeriesLabel'" :prop-widget-model="widgetModel"></HighchartsSeriesLabelSettings>
                <HighchartsDrilldownSettings v-else-if="accordion.type === 'Drilldown'" :widget-model="widgetModel"></HighchartsDrilldownSettings>
                <HighchartsGaugeGeneralSettings v-else-if="accordion.type === 'GaugeSettings'" :widget-model="widgetModel"></HighchartsGaugeGeneralSettings>
                <HighchartsGaugeScaleSettings v-else-if="accordion.type === 'ScaleSettings'" :widget-model="widgetModel"></HighchartsGaugeScaleSettings>
                <HighchartsGaugeTickSettings v-else-if="accordion.type === 'TickSettings'" :widget-model="widgetModel"></HighchartsGaugeTickSettings>
                <HighchartsStopsSettings v-else-if="accordion.type === 'StopsSettings'" :widget-model="widgetModel"></HighchartsStopsSettings>
                <HighchartsBandsSettings v-else-if="accordion.type === 'XAxisBandsSettings'" :widget-model="widgetModel" axis="x"></HighchartsBandsSettings>
                <HighchartsBandsSettings v-else-if="accordion.type === 'YAxisBandsSettings'" :widget-model="widgetModel" axis="y"></HighchartsBandsSettings>
                <ChartColorSettings v-else-if="accordion.type === 'Colors'" :widget-model="widgetModel"></ChartColorSettings>
                <WidgetExport v-else-if="accordion.type === 'Export'" :widget-model="widgetModel"></WidgetExport>
                <WidgetMenuConfiguration v-else-if="accordion.type === 'MenuConfiguration'" :widget-model="widgetModel"></WidgetMenuConfiguration>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :theme-style="null" :widget-model="widgetModel" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
                <WidgetSelection v-else-if="accordion.type === 'Selection'" :widget-model="widgetModel"></WidgetSelection>
                <WidgetCrossNavigation v-else-if="accordion.type === 'CrossNavigation'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetCrossNavigation>
                <WidgetInteractionsLinks v-else-if="accordion.type === 'Link'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetInteractionsLinks>
                <WidgetPreview v-else-if="accordion.type === 'Preview'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetPreview>
                <HighchartsAxisSettings v-else-if="accordion.type === 'HeatmapXAxisSettings'" :widget-model="widgetModel" axis="x"></HighchartsAxisSettings>
                <HighchartsAxisSettings v-else-if="accordion.type === 'HeatmapYAxisSettings'" :widget-model="widgetModel" axis="y"></HighchartsAxisSettings>
                <HighchartsAxisTitleSettings v-else-if="accordion.type === 'HeatmapXAxisTitleSettings'" :widget-model="widgetModel" axis="x"></HighchartsAxisTitleSettings>
                <HighchartsAxisTitleSettings v-else-if="accordion.type === 'HeatmapYAxisTitleSettings'" :widget-model="widgetModel" axis="y"></HighchartsAxisTitleSettings>
                <HighchartsHeatmapNullSettings v-else-if="accordion.type === 'HeatmapNullSettings'" :widget-model="widgetModel"></HighchartsHeatmapNullSettings>
                <HighchartsDatetypeSettings v-else-if="accordion.type === 'DatetypeSettings'" :widget-model="widgetModel"></HighchartsDatetypeSettings>
                <HighchartsLineSettings v-else-if="accordion.type === 'XAxisLinesSettings'" :widget-model="widgetModel" axis="x"></HighchartsLineSettings>
                <HighchartsLineSettings v-else-if="accordion.type === 'YAxisLinesSettings'" :widget-model="widgetModel" axis="y"></HighchartsLineSettings>
                <HighchartsAxisGridSettings v-else-if="accordion.type === 'XAxisMajorGridSettings'" :widget-model="widgetModel" type="major" axis="x"></HighchartsAxisGridSettings>
                <HighchartsAxisGridSettings v-else-if="accordion.type === 'YAxisMajorGridSettings'" :widget-model="widgetModel" type="major" axis="y"></HighchartsAxisGridSettings>
                <HighchartsAxisGridSettings v-else-if="accordion.type === 'XAxisMinorGridSettings'" :widget-model="widgetModel" type="minor" axis="x"></HighchartsAxisGridSettings>
                <HighchartsAxisGridSettings v-else-if="accordion.type === 'YAxisMinorGridSettings'" :widget-model="widgetModel" type="minor" axis="y"></HighchartsAxisGridSettings>
                <HighchartsConditionalStyles v-else-if="accordion.type === 'ConditionalStyles'" :widget-model="widgetModel"></HighchartsConditionalStyles>
                <HighchartsSonificationSettings v-else-if="accordion.type === 'SonificationSettings'" :widget-model="widgetModel"></HighchartsSonificationSettings>
                <HighchartsGroupingSettings v-else-if="accordion.type === 'GroupingSettings'" :widget-model="widgetModel"></HighchartsGroupingSettings>
                <HighchartsStackingSettings v-else-if="accordion.type === 'StackingSettings' && isStacked" :widget-model="widgetModel"></HighchartsStackingSettings>
                <HighchartsCenterTextSettings v-else-if="accordion.type === 'CenterTextSettings'" :widget-model="widgetModel"></HighchartsCenterTextSettings>
                <HighchartsAxisLinesSettings v-else-if="accordion.type === 'AxisLinesSettings'" :widget-model="widgetModel"></HighchartsAxisLinesSettings>
                <HighchartsSVGSettings v-else-if="accordion.type === 'SVGSettings'" :widget-model="widgetModel"></HighchartsSVGSettings>
                <HighchartsFunnelNeckSettings v-else-if="accordion.type === 'FunnelNeckSettings'" :widget-model="widgetModel"></HighchartsFunnelNeckSettings>
                <HighchartsAdvancedSettings v-else-if="accordion.type === 'AdvancedSettings'" :prop-widget-model="widgetModel"></HighchartsAdvancedSettings>
            </AccordionTab>
        </Accordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import settingsTabDescriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetExport from '../../common/configuration/WidgetExport.vue'
import WidgetMenuConfiguration from '../../common/configuration/WidgetMenuConfiguration.vue'
import WidgetBordersStyle from '../../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../../common/responsive/WidgetResponsive.vue'
import WidgetSelection from '../../common/interactions/selection/WidgetSelection.vue'
import WidgetCrossNavigation from '../../common/interactions/crossNavigation/WidgetCrossNavigation.vue'
import WidgetInteractionsLinks from '../../common/interactions/link/WidgetInteractionsLinks.vue'
import WidgetPreview from '../../common/interactions/preview/WidgetPreview.vue'
import WidgetTitleStyle from '../../common/style/WidgetTitleStyle.vue'
import WidgetPaddingStyle from '../../common/style/WidgetPaddingStyle.vue'
import WidgetBackgroundColorStyle from '../../common/style/WidgetBackgroundColorStyle.vue'
import Highcharts3DConfiguration from '../highcharts/configuration/Highcharts3DConfiguration.vue'
import HighchartsCenterTextSettings from '../highcharts/configuration/HighchartsCenterTextSettings.vue'
import HighchartsNoDataMessageConfiguration from '../highcharts/configuration/HighchartsNoDataMessageConfiguration.vue'
import HighchartsAccessibilitySettings from '../highcharts/accessibility/HighchartsAccessibilitySettings.vue'
import HighchartsSeriesAccessibilitySettings from '../highcharts/accessibility/HighchartsSeriesAccessibilitySettings.vue'
import HighchartsLabelsSettings from '../highcharts/labels/HighchartsLabelsSettings.vue'
import HighchartsLegendSettings from '../highcharts/legend/HighchartsLegendSettings.vue'
import HighchartsTooltipSettings from '../highcharts/tooltip/HighchartsTooltipSettings.vue'
import HighchartsActivityGaugeTooltipSettings from '../highcharts/tooltip/HighchartsActivityGaugeTooltipSettings.vue'
import HighchartsSeriesLabelSettings from '../highcharts/series/HighchartsSeriesLabelSettings.vue'
import ChartColorSettings from '../common/ChartColorSettings.vue'
import HighchartsDrilldownSettings from './interactions/HighchartsDrilldownSettings.vue'
import HighchartsGaugeGeneralSettings from './gauge/settings/HighchartsGaugeGeneralSettings.vue'
import HighchartsGaugeScaleSettings from './gauge/settings/HighchartsGaugeScaleSettings.vue'
import HighchartsGaugeTickSettings from './gauge/settings/HighchartsGaugeTickSettings.vue'
import HighchartsStopsSettings from './gauge/settings/HighchartsStopsSettings.vue'
import HighchartsBandsSettings from './settings/HighchartsBandsSettings.vue'
import HighchartsWidgetSettingsAccordionHeader from './HighchartsWidgetSettingsAccordionHeader.vue'
import HighchartsAxisSettings from './axis/HighchartsAxisSettings.vue'
import HighchartsAxisTitleSettings from './axis/HighchartsAxisTitleSettings.vue'
import HighchartsHeatmapNullSettings from './heatmap/HighchartsHeatmapNullSettings.vue'
import HighchartsDatetypeSettings from './configuration/HighchartsDatetypeSettings.vue'
import HighchartsLineSettings from './settings/HighchartsLineSettings.vue'
import HighchartsAxisGridSettings from './axis/HighchartsAxisGridSettings.vue'
import HighchartsConditionalStyles from './series/HighchartsConditionalStyles.vue'
import HighchartsSonificationSettings from './accessibility/HighchartsSonificationSettings.vue'
import HighchartsGroupingSettings from './configuration/HighchartsGroupingSettings.vue'
import HighchartsStackingSettings from './configuration/HighchartsStackingSettings.vue'
import HighchartsAxisLinesSettings from './configuration/HighchartsAxisLinesSettings.vue'
import HighchartsSVGSettings from './configuration/HighchartsSVGSettings.vue'
import WidgetEditorThemePicker from '../../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'
import HighchartsFunnelNeckSettings from '../highcharts/series/HighchartsFunnelNeckSettings.vue'
import HighchartsAdvancedSettings from '../highcharts/advanced/HighchartsAdvancedSettings.vue'

export default defineComponent({
    name: 'hihgcharts-widget-configuration-container',
    components: {
        Accordion,
        AccordionTab,
        WidgetExport,
        WidgetTitleStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        WidgetPaddingStyle,
        WidgetBackgroundColorStyle,
        WidgetCrossNavigation,
        WidgetInteractionsLinks,
        WidgetPreview,
        Highcharts3DConfiguration,
        HighchartsNoDataMessageConfiguration,
        HighchartsAccessibilitySettings,
        HighchartsSeriesAccessibilitySettings,
        HighchartsLabelsSettings,
        HighchartsLegendSettings,
        HighchartsTooltipSettings,
        HighchartsActivityGaugeTooltipSettings,
        HighchartsSeriesLabelSettings,
        ChartColorSettings,
        HighchartsDrilldownSettings,
        WidgetSelection,
        HighchartsGaugeGeneralSettings,
        HighchartsGaugeScaleSettings,
        HighchartsGaugeTickSettings,
        HighchartsStopsSettings,
        HighchartsBandsSettings,
        HighchartsWidgetSettingsAccordionHeader,
        HighchartsAxisSettings,
        HighchartsAxisTitleSettings,
        HighchartsHeatmapNullSettings,
        HighchartsDatetypeSettings,
        HighchartsLineSettings,
        HighchartsAxisGridSettings,
        HighchartsConditionalStyles,
        HighchartsSonificationSettings,
        HighchartsGroupingSettings,
        HighchartsStackingSettings,
        HighchartsCenterTextSettings,
        HighchartsAxisLinesSettings,
        HighchartsSVGSettings,
        WidgetEditorThemePicker,
        Message,
        HighchartsFunnelNeckSettings,
        HighchartsAdvancedSettings,
        WidgetMenuConfiguration
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        settings: { type: Array as PropType<{ title: string; type: string }[]> },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        descriptor: { type: Object as PropType<any>, required: true }
    },
    data() {
        return {
            settingsTabDescriptor,
            filteredSettings: [] as { title: string; type: string }[],
            activeIndex: -1,
            styleChangedFlag: false,
            themePropertyChanged: false,
            themeName: ''
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        isStacked() {
            if (this.widgetModel?.settings.chartModel?.model?.plotOptions?.series?.stacking) return true
            return false
        },
        showThemePicker() {
            return this.isEnterprise && this.settings && this.settings.find((setting: { title: string; type: string }) => setting.type === 'Title')
        }
    },
    watch: {
        settings() {
            this.activeIndex = -1
            this.loadSettings()
        },
        isStacked() {
            this.loadSettings()
        }
    },
    created() {
        this.loadSettings()
    },
    methods: {
        loadSettings() {
            this.filteredSettings = this.settings ? [...this.settings] : []
            if (!this.isStacked) this.removeStackedFromOptions()
            this.setActiveAccordion()
        },
        removeStackedFromOptions() {
            const index = this.filteredSettings.findIndex((setting: { title: string; type: string }) => setting.type === 'StackingSettings')
            if (index !== -1) this.filteredSettings.splice(index, 1)
        },
        setActiveAccordion() {
            if (this.settings?.length === 1) this.activeIndex = 0
        },
        onStyleChanged() {
            this.styleChangedFlag = !this.styleChangedFlag
            this.themePropertyChanged = true
        },
        onThemeSelected(themeName: string) {
            this.themeName = themeName
            this.themePropertyChanged = false
        }
    }
})
</script>

<style lang="scss">
.widget-editor-accordion {
    ::v-deep(.p-accordion-tab-active) {
        margin: 0;
    }
}

.p-accordion-content {
    padding: 0 !important;
}

.dynamic-form-item {
    border-bottom: 1px solid #c2c2c2;
}

.dynamic-form-item:last-child {
    border-bottom: none;
}
</style>
