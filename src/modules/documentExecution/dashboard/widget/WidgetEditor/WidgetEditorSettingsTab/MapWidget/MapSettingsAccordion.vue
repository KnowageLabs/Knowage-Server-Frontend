<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="widget-editor-accordion">
            <AccordionTab v-for="(accordion, index) in settings" :key="index">
                <template #header>
                    <MapSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></MapSettingsAccordionHeader>
                </template>
                <WidgetExport v-if="accordion.type === 'Export'" :widget-model="widgetModel"></WidgetExport>
                <WidgetMenuConfiguration v-else-if="accordion.type === 'MenuConfiguration'" :widget-model="widgetModel"></WidgetMenuConfiguration>
                <WidgetSelectionConfiguration v-else-if="accordion.type === 'SelectionConfiguration'" :widget-model="widgetModel"></WidgetSelectionConfiguration>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
                <MapWidgetSelectionsConfiguration v-else-if="accordion.type === 'Selection'" :visible="accordion.type === 'Selection'" :widget-model="widgetModel"></MapWidgetSelectionsConfiguration>
                <MapWidgetCrossNavigationConfiguration v-else-if="accordion.type === 'CrossNavigation'" :visible="accordion.type === 'CrossNavigation'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></MapWidgetCrossNavigationConfiguration>
                <MapWidgetLinkConfiguration v-else-if="accordion.type === 'Link'" :visible="accordion.type === 'Link'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></MapWidgetLinkConfiguration>
                <MapWidgetDatasetPreviewConfiguration v-else-if="accordion.type === 'Preview'" :visible="accordion.type === 'Preview'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></MapWidgetDatasetPreviewConfiguration>
                <WidgetVisType v-else-if="accordion.type === 'VisualizationType'" :widget-model="widgetModel" />
                <MapTooltips v-else-if="accordion.type === 'Tooltips'" :widget-model="widgetModel"></MapTooltips>
                <MapDialogSettings v-else-if="accordion.type === 'DialogSettings'" :widget-model="widgetModel"></MapDialogSettings>
                <MapLegendSettings v-else-if="accordion.type === 'Legend'" :widget-model="widgetModel"></MapLegendSettings>
                <MapBaseLayerSettings v-else-if="accordion.type === 'Map'" :widget-model="widgetModel"></MapBaseLayerSettings>
                <MapControlPanelSettings v-else-if="accordion.type === 'ControlPanel'" :widget-model="widgetModel"></MapControlPanelSettings>
                <MapConditionalStyles v-else-if="accordion.type === 'Conditions'" :widget-model="widgetModel" :variables="variables" :dashboard-id="dashboardId"></MapConditionalStyles>
                <WidgetHelpSettings v-else-if="accordion.type === 'HelpSettings'" :widget-model="widgetModel"></WidgetHelpSettings>
            </AccordionTab>
        </Accordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { ILayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import WidgetExport from '../common/configuration/WidgetExport.vue'
import WidgetMenuConfiguration from '../common/configuration/WidgetMenuConfiguration.vue'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import MapWidgetSelectionsConfiguration from './interactions/MapWidgetSelectionsConfiguration.vue'
import MapWidgetCrossNavigationConfiguration from './interactions/MapWidgetCrossNavigationConfiguration.vue'
import MapWidgetLinkConfiguration from './interactions/MapWidgetLinkConfiguration.vue'
import MapWidgetDatasetPreviewConfiguration from './interactions/MapWidgetDatasetPreviewConfiguration.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import MapSettingsAccordionHeader from './MapSettingsAccordionHeader.vue'
import WidgetVisType from './visualization/MapVisualizationType.vue'
import MapTooltips from './tooltips/MapTooltips.vue'
import MapDialogSettings from './dialog/MapDialogSettings.vue'
import MapLegendSettings from './legend/MapLegendSettings.vue'
import MapBaseLayerSettings from './configuration/MapBaseLayerSettings.vue'
import MapControlPanelSettings from './configuration/MapControlPanelSettings.vue'
import MapConditionalStyles from './conditionalStyle/MapConditionalStyles.vue'
import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'
import WidgetSelectionConfiguration from '../common/configuration/WidgetSelectionConfiguration.vue'
import WidgetHelpSettings from '../common/help/WidgetHelpSettings.vue'

export default defineComponent({
    components: {
        Accordion,
        AccordionTab,
        WidgetExport,
        WidgetTitleStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        MapWidgetSelectionsConfiguration,
        WidgetPaddingStyle,
        WidgetBackgroundColorStyle,
        MapSettingsAccordionHeader,
        MapTooltips,
        MapDialogSettings,
        MapLegendSettings,
        WidgetVisType,
        MapBaseLayerSettings,
        MapControlPanelSettings,
        MapConditionalStyles,
        WidgetEditorThemePicker,
        Message,
        WidgetMenuConfiguration,
        WidgetSelectionConfiguration,
        MapWidgetCrossNavigationConfiguration,
        WidgetHelpSettings,
        MapWidgetLinkConfiguration,
        MapWidgetDatasetPreviewConfiguration
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        settings: { type: Array as PropType<{ title: string; type: string }[]> },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        layers: { type: Array as PropType<ILayer[]>, required: true }
    },

    data() {
        return {
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
            ;(this.styleChangedFlag = !this.styleChangedFlag), (this.themePropertyChanged = true)
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
