<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="widget-editor-accordion">
            <AccordionTab v-for="(accordion, index) in settings" :key="index">
                <template #header>
                    <TableWidgetSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></TableWidgetSettingsAccordionHeader>
                </template>

                <TableWidgetRows v-if="accordion.type === 'Rows'" :widget-model="widgetModel"></TableWidgetRows>
                <TableWidgetSummaryRows v-else-if="accordion.type === 'SummaryRows'" :widget-model="widgetModel"></TableWidgetSummaryRows>
                <TableWidgetHeader v-else-if="accordion.type === 'Header'" :widget-model="widgetModel" :variables="variables" :dashboard-id="dashboardId"></TableWidgetHeader>
                <TableWidgetColumnGroups v-else-if="accordion.type === 'ColumnGroups'" :widget-model="widgetModel"></TableWidgetColumnGroups>
                <WidgetExport v-else-if="accordion.type === 'Export'" :widget-model="widgetModel"></WidgetExport>
                <TableWidgetCustomMessages v-else-if="accordion.type === 'CustomMessages'" :widget-model="widgetModel"></TableWidgetCustomMessages>
                <TableWidgetVisualizationType v-else-if="accordion.type === 'VisualizationType'" :widget-model="widgetModel"></TableWidgetVisualizationType>
                <TableWidgetVisibilityConditions v-else-if="accordion.type === 'VisibilityConditions'" :widget-model="widgetModel" :variables="variables"></TableWidgetVisibilityConditions>
                <TableWidgetHeaders v-else-if="accordion.type === 'Headers'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></TableWidgetHeaders>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <TableWidgetColumnStyle v-else-if="accordion.type === 'ColumnStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></TableWidgetColumnStyle>
                <TableWidgetColumnStyle v-else-if="accordion.type === 'ColumnGroupsStyle'" :widget-model="widgetModel" :theme-style="null" mode="columnGroups" @styleChanged="onStyleChanged"></TableWidgetColumnStyle>
                <WidgetRowsStyle v-else-if="accordion.type === 'RowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetRowsStyle>
                <TableWidgetSummaryStyle v-else-if="accordion.type === 'SummaryStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></TableWidgetSummaryStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <TableWidgetConditions v-else-if="accordion.type === 'Conditions'" :widget-model="widgetModel" :variables="variables" :dashboard-id="dashboardId"></TableWidgetConditions>
                <TableWidgetTooltips v-else-if="accordion.type === 'Tooltips'" :widget-model="widgetModel"></TableWidgetTooltips>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
                <WidgetSelection v-else-if="accordion.type === 'Selection'" :widget-model="widgetModel"></WidgetSelection>
                <WidgetCrossNavigation v-else-if="accordion.type === 'CrossNavigation'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetCrossNavigation>
                <WidgetInteractionsLinks v-else-if="accordion.type === 'Link'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetInteractionsLinks>
                <WidgetPreview v-else-if="accordion.type === 'Preview'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetPreview>
                <WidgetInteractionsIframe v-else-if="accordion.type === 'IFrameInteraction'" :widget-model="widgetModel" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></WidgetInteractionsIframe>
                <TableWidgetPaginator v-else-if="accordion.type === 'PaginatorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></TableWidgetPaginator>
            </AccordionTab>
        </Accordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import descriptor from './TableWidgetSettingsDescriptor.json'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import TableWidgetRows from './configuration/TableWidgetRows.vue'
import TableWidgetSummaryRows from './configuration/TableWidgetSummaryRows.vue'
import TableWidgetHeader from './configuration/TableWidgetHeader.vue'
import TableWidgetColumnGroups from './configuration/TableWidgetColumnGroups.vue'
import WidgetExport from '../common/configuration/WidgetExport.vue'
import TableWidgetCustomMessages from './configuration/TableWidgetCustomMessages.vue'
import TableWidgetVisualizationType from './visualization/TableWidgetVisualizationType.vue'
import TableWidgetVisibilityConditions from './visualization/TableWidgetVisibilityConditions.vue'
import TableWidgetHeaders from './style/TableWidgetHeaders.vue'
import TableWidgetColumnStyle from './style/TableWidgetColumnStyle.vue'
import WidgetRowsStyle from '../common/style/WidgetRowsStyle.vue'
import TableWidgetSummaryStyle from './style/TableWidgetSummaryStyle.vue'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import TableWidgetConditions from './conditionalStyle/TableWidgetConditions.vue'
import TableWidgetTooltips from './tooltips/TableWidgetTooltips.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import WidgetSelection from '../common/interactions/selection/WidgetSelection.vue'
import WidgetCrossNavigation from '../common/interactions/crossNavigation/WidgetCrossNavigation.vue'
import WidgetInteractionsLinks from '../common/interactions/link/WidgetInteractionsLinks.vue'
import WidgetPreview from '../common/interactions/preview/WidgetPreview.vue'
import WidgetInteractionsIframe from '../common/interactions/iframe/WidgetInteractionsIframe.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import TableWidgetSettingsAccordionHeader from './TableWidgetSettingsAccordionHeader.vue'
import TableWidgetPaginator from './style/TableWidgetPaginator.vue'
import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'

export default defineComponent({
    name: 'table-widget-configuration-container',
    components: {
        Accordion,
        AccordionTab,
        TableWidgetRows,
        TableWidgetSummaryRows,
        TableWidgetHeader,
        TableWidgetColumnGroups,
        WidgetExport,
        TableWidgetCustomMessages,
        TableWidgetVisualizationType,
        TableWidgetVisibilityConditions,
        WidgetTitleStyle,
        TableWidgetHeaders,
        TableWidgetColumnStyle,
        WidgetRowsStyle,
        TableWidgetSummaryStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        TableWidgetConditions,
        TableWidgetTooltips,
        WidgetResponsive,
        WidgetSelection,
        WidgetPaddingStyle,
        WidgetBackgroundColorStyle,
        WidgetCrossNavigation,
        WidgetInteractionsLinks,
        WidgetPreview,
        TableWidgetSettingsAccordionHeader,
        TableWidgetPaginator,
        WidgetInteractionsIframe,
        WidgetEditorThemePicker,
        Message,
        WidgetInteractionsIframe
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
            themeName: ''
        }
    },
    computed: {
        showThemePicker() {
            return this.settings && this.settings.find((setting: { title: string; type: string }) => setting.type === 'Title')
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
            console.log('--------- TODO - STYLE CHANGED FLAG CALLED!')
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
