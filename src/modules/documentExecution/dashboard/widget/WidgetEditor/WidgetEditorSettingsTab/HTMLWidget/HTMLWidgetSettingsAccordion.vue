<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="widget-editor-accordion">
            <AccordionTab v-for="(accordion, index) in settings" :key="index">
                <template #header>
                    <HTMLWidgetSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></HTMLWidgetSettingsAccordionHeader>
                </template>
                <WidgetExport v-if="accordion.type === 'Export'" :widget-model="widgetModel"></WidgetExport>
                <WidgetMenuConfiguration v-else-if="accordion.type === 'MenuConfiguration'" :widget-model="widgetModel"></WidgetMenuConfiguration>
                <WidgetSelectionConfiguration v-else-if="accordion.type === 'SelectionConfiguration'" :widget-model="widgetModel"></WidgetSelectionConfiguration>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
                <WidgetHtmlEditor v-else-if="accordion.type === 'HTML'" :active-index="activeIndex" :widget-model="widgetModel" :variables="variables" :dashboard-id="dashboardId" :selected-datasets="selectedDatasets"></WidgetHtmlEditor>
                <WidgetCssEditor v-else-if="accordion.type === 'CSS'" :active-index="activeIndex" :widget-model="widgetModel"></WidgetCssEditor>
                <WidgetCrossNavigation v-else-if="accordion.type === 'CrossNavigation'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetCrossNavigation>
                <WidgetInteractionsLinks v-else-if="accordion.type === 'Link'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetInteractionsLinks>
                <WidgetPreview v-else-if="accordion.type === 'Preview'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetPreview>
                <WidgetInteractionsIframe v-else-if="accordion.type === 'IFrameInteraction'" :widget-model="widgetModel" :dashboard-id="dashboardId"></WidgetInteractionsIframe>
                <CustomDashboardHeaderConfiguration v-else-if="accordion.type === 'CustomDashboardHeaderConfiguration'" :widget-model="widgetModel"></CustomDashboardHeaderConfiguration>
                <WidgetHelpSettings v-else-if="accordion.type === 'HelpSettings'" :widget-model="widgetModel"></WidgetHelpSettings>
            </AccordionTab>
        </Accordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/Dashboard/Dashboard'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import descriptor from './HTMLWidgetSettingsDescriptor.json'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import WidgetExport from '../common/configuration/WidgetExport.vue'
import WidgetMenuConfiguration from '../common/configuration/WidgetMenuConfiguration.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import WidgetHtmlEditor from './editor/WidgetHtmlEditor.vue'
import WidgetCssEditor from './editor/WidgetCssEditor.vue'
import WidgetCrossNavigation from '../common/interactions/crossNavigation/WidgetCrossNavigation.vue'
import WidgetInteractionsLinks from '../common/interactions/link/WidgetInteractionsLinks.vue'
import WidgetPreview from '../common/interactions/preview/WidgetPreview.vue'
import HTMLWidgetSettingsAccordionHeader from './HTMLWidgetSettingsAccordionHeader.vue'
import WidgetInteractionsIframe from '../common/interactions/iframe/WidgetInteractionsIframe.vue'
import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'
import CustomDashboardHeaderConfiguration from './configuration/CustomDashboardHeaderConfiguration.vue'
import WidgetSelectionConfiguration from '../common/configuration/WidgetSelectionConfiguration.vue'
import WidgetHelpSettings from '../common/help/WidgetHelpSettings.vue'

export default defineComponent({
    name: 'html-widget-settings-container',
    components: {
        Accordion,
        AccordionTab,
        WidgetExport,
        WidgetTitleStyle,
        WidgetBackgroundColorStyle,
        WidgetPaddingStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        WidgetHtmlEditor,
        WidgetCssEditor,
        WidgetCrossNavigation,
        WidgetInteractionsLinks,
        WidgetPreview,
        HTMLWidgetSettingsAccordionHeader,
        WidgetInteractionsIframe,
        WidgetEditorThemePicker,
        Message,
        CustomDashboardHeaderConfiguration,
        WidgetMenuConfiguration,
        WidgetSelectionConfiguration,
        WidgetHelpSettings
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        settings: { type: Array as PropType<{ title: string; type: string }[]>, required: true },
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
            if (!this.settings) return
            if (this.settings.length === 1) this.activeIndex = 0
            else if (this.activeIndex === -1 && this.settings.length === 2 && this.settings[1].type === 'HTML') this.activeIndex = 1
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
</style>
