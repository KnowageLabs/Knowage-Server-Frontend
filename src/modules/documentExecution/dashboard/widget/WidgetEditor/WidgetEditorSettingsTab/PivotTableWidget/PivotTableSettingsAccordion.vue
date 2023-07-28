<!-- eslint-disable vue/attribute-hyphenation -->
<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <!-- <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker> -->
        <Accordion v-model:activeIndex="activeIndex" class="widget-editor-accordion">
            <AccordionTab v-for="(accordion, index) in settings" :key="index">
                <template #header>
                    <PivotTableSettingsAccordionHeader :widgetModel="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></PivotTableSettingsAccordionHeader>
                </template>
                <WidgetExport v-if="accordion.type === 'Export'" :widgetModel="widgetModel"></WidgetExport>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widgetModel="widgetModel" :theme-style="null" :toolbarStyleSettings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widgetModel="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widgetModel="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widgetModel="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widgetModel="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widgetModel="widgetModel"></WidgetResponsive>
                <WidgetSelection v-else-if="accordion.type === 'Selection'" :widgetModel="widgetModel"></WidgetSelection>
                <WidgetCrossNavigation v-else-if="accordion.type === 'CrossNavigation'" :widgetModel="widgetModel" :datasets="datasets" :selectedDatasets="selectedDatasets" :dashboardId="dashboardId"></WidgetCrossNavigation>
                <WidgetInteractionsLinks v-else-if="accordion.type === 'Link'" :widgetModel="widgetModel" :datasets="datasets" :selectedDatasets="selectedDatasets" :dashboardId="dashboardId"></WidgetInteractionsLinks>
                <PivotTableRowsConfig v-else-if="accordion.type === 'Rows'" :widgetModel="widgetModel" />
                <PivotTableColumnsConfig v-else-if="accordion.type === 'Columns'" :widgetModel="widgetModel" />
                <PivotTableFieldPicker v-else-if="accordion.type === 'FieldPicker'" :widgetModel="widgetModel" />
                <PivotTableTooltips v-else-if="accordion.type === 'Tooltips'" :widgetModel="widgetModel" />
                <PivotTableTotalsStyle v-else-if="accordion.type === 'Totals'" :widgetModel="widgetModel" :toolbarStyleSettings="descriptor.columnHeadersToolbarStyleOptions" :totalType="accordion.type" :theme-style="null" @styleChanged="onStyleChanged" />
                <PivotTableTotalsStyle v-else-if="accordion.type === 'SubTotals'" :widgetModel="widgetModel" :toolbarStyleSettings="descriptor.columnHeadersToolbarStyleOptions" :totalType="accordion.type" :theme-style="null" @styleChanged="onStyleChanged" />
                <PivotTableTotalsStyle v-else-if="accordion.type === 'CrossTabHeaders'" :widgetModel="widgetModel" :toolbarStyleSettings="descriptor.columnHeadersToolbarStyleOptions" :totalType="accordion.type" :theme-style="null" @styleChanged="onStyleChanged" />
                <PivotTableFieldsStyle v-else-if="accordion.type === 'FieldsStyle'" :widgetModel="widgetModel" :fieldType="'fields'" :theme-style="null" @styleChanged="onStyleChanged" />
                <PivotTableFieldsStyle v-else-if="accordion.type === 'FieldHeadersStyle'" :widgetModel="widgetModel" :fieldType="'fieldHeaders'" :theme-style="null" @styleChanged="onStyleChanged" />
                <PivotTableConditionalStyle v-else-if="accordion.type === 'Conditions'" :widgetModel="widgetModel"></PivotTableConditionalStyle>
                <PivotTableWidgetVisualizationType v-else-if="accordion.type === 'VisualizationType'" :widgetModel="widgetModel"></PivotTableWidgetVisualizationType>
            </AccordionTab>
        </Accordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import descriptor from './PivotTableSettingsDescriptor.json'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import WidgetExport from '../common/configuration/WidgetExport.vue'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import WidgetSelection from '../common/interactions/selection/WidgetSelection.vue'
import WidgetCrossNavigation from '../common/interactions/crossNavigation/WidgetCrossNavigation.vue'
import WidgetInteractionsLinks from '../common/interactions/link/WidgetInteractionsLinks.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import PivotTableSettingsAccordionHeader from './PivotTableSettingsAccordionHeader.vue'
import PivotTableRowsConfig from './configuration/PivotTableRowsConfig.vue'
import PivotTableColumnsConfig from './configuration/PivotTableColumnsConfig.vue'
import PivotTableFieldPicker from './configuration/PivotTableFieldPicker.vue'
import PivotTableTooltips from './tooltips/PivotTableTooltips.vue'
import PivotTableTotalsStyle from './style/PivotTableTotalsStyle.vue'
import PivotTableFieldsStyle from './style/PivotTableFieldsStyle.vue'
import PivotTableConditionalStyle from './conditionalStyle/PivotTableConditionalStyle.vue'
import PivotTableWidgetVisualizationType from './visualization/PivotTableWidgetVisualizationType.vue'
// import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'

export default defineComponent({
    name: 'pivot-table-settings-accordion',
    components: {
        Accordion,
        AccordionTab,
        WidgetExport,
        WidgetTitleStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        WidgetSelection,
        WidgetPaddingStyle,
        WidgetBackgroundColorStyle,
        WidgetCrossNavigation,
        WidgetInteractionsLinks,
        PivotTableSettingsAccordionHeader,
        PivotTableRowsConfig,
        PivotTableColumnsConfig,
        PivotTableFieldPicker,
        PivotTableTooltips,
        PivotTableTotalsStyle,
        PivotTableFieldsStyle,
        PivotTableConditionalStyle,
        PivotTableWidgetVisualizationType,
        // WidgetEditorThemePicker,
        Message
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
