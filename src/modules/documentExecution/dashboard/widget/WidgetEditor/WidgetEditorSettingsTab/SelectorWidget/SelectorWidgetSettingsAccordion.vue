<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <Accordion v-model:activeIndex="activeIndex" class="selectorAccordion">
            <AccordionTab v-for="(accordion, index) in filteredSettings" :key="index" :disabled="accordion.type === 'LabelStyle' && labelStyleAccordionDisabled">
                <template #header>
                    <SelectorWidgetSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></SelectorWidgetSettingsAccordionHeader>
                </template>
                <SelectorWidgetRange v-if="accordion.type === 'DateRange'" :widget-model="widgetModel"></SelectorWidgetRange>
                <SelectorWidgetType v-if="accordion.type === 'SelectorType'" :widget-model="widgetModel"></SelectorWidgetType>
                <SelectorWidgetDefaultValues v-else-if="accordion.type === 'DefaultValues'" :widget-model="widgetModel"></SelectorWidgetDefaultValues>
                <SelectorWidgetValuesManagement v-else-if="accordion.type === 'ValuesManagement'" :widget-model="widgetModel"></SelectorWidgetValuesManagement>
                <WidgetSelectionConfiguration v-else-if="accordion.type === 'SelectionConfiguration'" :widget-model="widgetModel"></WidgetSelectionConfiguration>
                <WidgetMenuConfiguration v-else-if="accordion.type === 'MenuConfiguration'" :widget-model="widgetModel"></WidgetMenuConfiguration>
                <WidgetTitleStyle v-else-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <SelectorWidgetLabelStyle v-else-if="accordion.type === 'LabelStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></SelectorWidgetLabelStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
                <WidgetHelpSettings v-else-if="accordion.type === 'HelpSettings'" :widget-model="widgetModel"></WidgetHelpSettings>
                <SelectorWidgetRadioStyle v-else-if="accordion.type === 'RadioStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></SelectorWidgetRadioStyle>
                <SelectorWidgetCheckboxStyle v-else-if="accordion.type === 'CheckboxStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></SelectorWidgetCheckboxStyle>
                <SelectorWidgetDropdownStyle v-else-if="accordion.type === 'DropdownStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></SelectorWidgetDropdownStyle>
                <SelectorWidgetMultiDropdownStyle v-else-if="accordion.type === 'MultiDropdownStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></SelectorWidgetMultiDropdownStyle>
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
import descriptor from './SelectorWidgetSettingsDescriptor.json'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import SelectorWidgetType from './configuration/SelectorWidgetType.vue'
import SelectorWidgetDefaultValues from './configuration/SelectorWidgetDefaultValues.vue'
import SelectorWidgetValuesManagement from './configuration/SelectorWidgetValuesManagement.vue'
import WidgetMenuConfiguration from '../common/configuration/WidgetMenuConfiguration.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import SelectorWidgetLabelStyle from './style/SelectorWidgetLabelStyle.vue'
import SelectorWidgetRadioStyle from './style/SelectorWidgetRadioStyle.vue'
import SelectorWidgetCheckboxStyle from './style/SelectorWidgetCheckboxStyle.vue'
import SelectorWidgetDropdownStyle from './style/SelectorWidgetDropdownStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import SelectorWidgetSettingsAccordionHeader from './SelectorWidgetSettingsAccordionHeader.vue'
import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'
import WidgetSelectionConfiguration from '../common/configuration/WidgetSelectionConfiguration.vue'
import WidgetHelpSettings from '../common/help/WidgetHelpSettings.vue'
import SelectorWidgetRange from './configuration/SelectorWidgetRange.vue'
import SelectorWidgetMultiDropdownStyle from './style/SelectorWidgetMultiDropdownStyle.vue'

export default defineComponent({
    name: 'selector-widget-settings-container',
    components: {
        Accordion,
        AccordionTab,
        SelectorWidgetType,
        SelectorWidgetDefaultValues,
        SelectorWidgetValuesManagement,
        WidgetTitleStyle,
        SelectorWidgetLabelStyle,
        SelectorWidgetRadioStyle,
        SelectorWidgetCheckboxStyle,
        SelectorWidgetDropdownStyle,
        SelectorWidgetMultiDropdownStyle,
        WidgetBackgroundColorStyle,
        WidgetPaddingStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        SelectorWidgetSettingsAccordionHeader,
        WidgetEditorThemePicker,
        Message,
        WidgetMenuConfiguration,
        WidgetSelectionConfiguration,
        WidgetHelpSettings,
        SelectorWidgetRange
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
            themeId: null as number | null
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
        },
        isDateType() {
            return this.widgetModel?.settings?.isDateType
        },
        filteredSettings(): { title: string; type: string }[] {
            if (!this.settings) return []

            return this.settings.filter((setting) => {
                if (setting.type === 'DateRange' && !this.isDateType) return false
                return true
            })
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
            if (this.themeId) this.themePropertyChanged = true
        },
        onThemeSelected(themeId: number | null) {
            this.themeId = themeId
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
