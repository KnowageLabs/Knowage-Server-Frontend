<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="widget-editor-accordion">
            <AccordionTab v-for="(accordion, index) in settings" :key="index">
                <template #header>
                    <VegaChartsSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></VegaChartsSettingsAccordionHeader>
                </template>

                <VegaNoDataMessageConfiguration v-if="accordion.type === 'NoDataMessageConfiguration'" :widget-model="widgetModel"></VegaNoDataMessageConfiguration>
                <VegaTextConfiguration v-if="accordion.type === 'TextConfiguration'" :widget-model="widgetModel"></VegaTextConfiguration>
                <VegaTooltipSettings v-if="accordion.type === 'Tooltips'" :widget-model="widgetModel"></VegaTooltipSettings>
                <ChartColorSettings v-else-if="accordion.type === 'Colors'" :widget-model="widgetModel"></ChartColorSettings>
                <WidgetSelectionConfiguration v-else-if="accordion.type === 'SelectionConfiguration'" :widget-model="widgetModel"></WidgetSelectionConfiguration>
                <WidgetMenuConfiguration v-else-if="accordion.type === 'MenuConfiguration'" :widget-model="widgetModel"></WidgetMenuConfiguration>
                <WidgetExport v-else-if="accordion.type === 'Export'" :widget-model="widgetModel"></WidgetExport>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
                <WidgetSelection v-else-if="accordion.type === 'Selection'" :widget-model="widgetModel"></WidgetSelection>
                <WidgetCrossNavigation v-else-if="accordion.type === 'CrossNavigation'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetCrossNavigation>
                <WidgetInteractionsLinks v-else-if="accordion.type === 'Link'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetInteractionsLinks>
                <WidgetPreview v-else-if="accordion.type === 'Preview'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetPreview>
                <WidgetHelpSettings v-else-if="accordion.type === 'HelpSettings'" :widget-model="widgetModel"></WidgetHelpSettings>
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
import descriptor from './VegaChartsSettingsDescriptor.json'
import settingsTabDescriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import VegaNoDataMessageConfiguration from './configuration/VegaNoDataMessageConfiguration.vue'
import WidgetExport from '../../common/configuration/WidgetExport.vue'
import WidgetSelectionConfiguration from '../../common/configuration/WidgetSelectionConfiguration.vue'
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
import VegaChartsSettingsAccordionHeader from './VegaChartsSettingsAccordionHeader.vue'
import VegaTextConfiguration from '../vega/configuration/VegaTextConfiguration.vue'
import VegaTooltipSettings from '../vega/tooltip/VegaTooltipSettings.vue'
import ChartColorSettings from '../common/ChartColorSettings.vue'
import WidgetEditorThemePicker from '../../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'
import WidgetHelpSettings from '../../common/help/WidgetHelpSettings.vue'

export default defineComponent({
    name: 'vega-charts-configuration-container',
    components: {
        Accordion,
        AccordionTab,
        VegaNoDataMessageConfiguration,
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
        WidgetSelection,
        VegaChartsSettingsAccordionHeader,
        VegaTextConfiguration,
        VegaTooltipSettings,
        ChartColorSettings,
        WidgetEditorThemePicker,
        Message,
        WidgetMenuConfiguration,
        WidgetSelectionConfiguration,
        WidgetHelpSettings
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        settings: { type: Array as PropType<{ title: string; type: string }[]> },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor,
            settingsTabDescriptor,
            activeIndex: -1,
            styleChangedFlag: false,
            themePropertyChanged: false,
            themeId: null as number | null
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        showThemePicker() {
            return this.isEnterprise && this.settings && this.settings.find((setting: { title: string; type: string }) => setting.type === 'Title')
        }
    },
    watch: {
        settings() {
            this.activeIndex = -1
            this.setActiveAccordion()
        }
    },
    created() {
        this.setActiveAccordion()
    },
    methods: {
        setActiveAccordion() {
            if (this.settings?.length === 1) this.activeIndex = 0
        },
        onStyleChanged() {
            this.styleChangedFlag = !this.styleChangedFlag
            this.themePropertyChanged = true
        },
        onThemeSelected(themeId: number | null) {
            this.themeId = themeId
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
