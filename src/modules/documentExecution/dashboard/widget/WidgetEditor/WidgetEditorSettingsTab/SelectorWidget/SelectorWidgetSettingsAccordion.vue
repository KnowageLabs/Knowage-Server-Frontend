<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="selectorAccordion">
            <AccordionTab v-for="(accordion, index) in settings" :key="index" :disabled="accordion.type === 'LabelStyle' && labelStyleAccordionDisabled">
                <template #header>
                    <SelectorWidgetSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></SelectorWidgetSettingsAccordionHeader>
                </template>
                <SelectorWidgetType v-if="accordion.type === 'SelectorType'" :widget-model="widgetModel"></SelectorWidgetType>
                <SelectorWidgetDefaultValues v-else-if="accordion.type === 'DefaultValues'" :widget-model="widgetModel"></SelectorWidgetDefaultValues>
                <SelectorWidgetValuesManagement v-else-if="accordion.type === 'ValuesManagement'" :widget-model="widgetModel"></SelectorWidgetValuesManagement>
                <WidgetSelectionConfiguration v-else-if="accordion.type === 'SelectionConfiguration'" :widget-model="widgetModel"></WidgetSelectionConfiguration>
                <WidgetMenuConfiguration v-else-if="accordion.type === 'MenuConfiguration'" :widget-model="widgetModel"></WidgetMenuConfiguration>
                <WidgetExport v-else-if="accordion.type === 'Export'" :widget-model="widgetModel"></WidgetExport>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <SelectorWidgetLabelStyle v-else-if="accordion.type === 'LabelStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></SelectorWidgetLabelStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
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
import descriptor from './SelectorWidgetSettingsDescriptor.json'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import SelectorWidgetType from './configuration/SelectorWidgetType.vue'
import SelectorWidgetDefaultValues from './configuration/SelectorWidgetDefaultValues.vue'
import SelectorWidgetValuesManagement from './configuration/SelectorWidgetValuesManagement.vue'
import WidgetExport from '../common/configuration/WidgetExport.vue'
import WidgetMenuConfiguration from '../common/configuration/WidgetMenuConfiguration.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import SelectorWidgetLabelStyle from './style/SelectorWidgetLabelStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import SelectorWidgetSettingsAccordionHeader from './SelectorWidgetSettingsAccordionHeader.vue'
import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'
import WidgetSelectionConfiguration from '../common/configuration/WidgetSelectionConfiguration.vue'

export default defineComponent({
    name: 'selector-widget-settings-container',
    components: {
        Accordion,
        AccordionTab,
        SelectorWidgetType,
        SelectorWidgetDefaultValues,
        SelectorWidgetValuesManagement,
        WidgetExport,
        WidgetTitleStyle,
        SelectorWidgetLabelStyle,
        WidgetBackgroundColorStyle,
        WidgetPaddingStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        SelectorWidgetSettingsAccordionHeader,
        WidgetEditorThemePicker,
        Message,
        WidgetMenuConfiguration,
        WidgetSelectionConfiguration
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        settings: { type: Array as PropType<{ title: string; type: string }[]> },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]> }
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
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        labelStyleAccordionDisabled(): boolean {
            return !this.widgetModel || this.widgetModel.settings?.isDateType
        },
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
        onThemeSelected(themeName: string) {
            this.themeName = themeName
            this.themePropertyChanged = false
        }
    }
})
</script>

<style lang="scss">
.selectorAccordion {
    ::v-deep(.p-accordion-tab-active) {
        margin: 0;
    }
    .p-accordion-content {
        display: flex;
    }
}
</style>
