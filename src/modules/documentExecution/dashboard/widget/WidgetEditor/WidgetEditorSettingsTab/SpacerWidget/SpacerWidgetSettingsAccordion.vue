<template>
    <div v-show="widgetModel">
        <Message v-if="themePropertyChanged" class="p-p-2 p-m-4" severity="warn" :closable="false">{{ $t('dashboard.widgetEditor.themeChangedWarning') }}</Message>
        <WidgetEditorThemePicker v-if="showThemePicker" :widget-model="widgetModel" :style-changed-flag="styleChangedFlag" @themeSelected="onThemeSelected"></WidgetEditorThemePicker>
        <q-list class="widget-editor-accordion" bordered separator>
            <q-expansion-item v-for="(accordion, index) in filteredSettings" :key="index" :model-value="activeIndex === index" expand-icon-class="col kn-width-full" @update:model-value="(val) => onExpansionChange(val, index)">
                <template #header>
                    <SpacerWidgetSettingsAccordionHeader :widget-model="widgetModel" :title="accordion.title" :type="accordion.type" @styleChanged="onStyleChanged"></SpacerWidgetSettingsAccordionHeader>
                </template>
                <WidgetTitleStyle v-if="accordion.type === 'Title'" :widget-model="widgetModel" :theme-style="null" :toolbar-style-settings="settingsTabDescriptor.defaultToolbarStyleOptions" :dashboard-id="dashboardId" @styleChanged="onStyleChanged"></WidgetTitleStyle>
                <WidgetBackgroundColorStyle v-else-if="accordion.type === 'BackgroundColorStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBackgroundColorStyle>
                <WidgetBordersStyle v-else-if="accordion.type === 'BordersStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetBordersStyle>
                <WidgetPaddingStyle v-else-if="accordion.type === 'PaddingStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetPaddingStyle>
                <WidgetShadowsStyle v-else-if="accordion.type === 'ShadowsStyle'" :widget-model="widgetModel" :theme-style="null" @styleChanged="onStyleChanged"></WidgetShadowsStyle>
                <WidgetResponsive v-else-if="accordion.type === 'Responsive'" :widget-model="widgetModel"></WidgetResponsive>
            </q-expansion-item>
        </q-list>
        <q-item v-if="isSearchActive && filteredSettings.length === 0" class="q-pa-md">
            <q-item-section class="text-grey-6">{{ $t('common.info.noAvailableItems') }}</q-item-section>
        </q-item>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import descriptor from './SpacerWidgetSettingsDescriptor.json'
import settingsTabDescriptor from '../WidgetEditorSettingsTabDescriptor.json'
import WidgetBordersStyle from '../common/style/WidgetBordersStyle.vue'
import WidgetShadowsStyle from '../common/style/WidgetShadowsStyle.vue'
import WidgetResponsive from '../common/responsive/WidgetResponsive.vue'
import WidgetTitleStyle from '../common/style/WidgetTitleStyle.vue'
import WidgetPaddingStyle from '../common/style/WidgetPaddingStyle.vue'
import WidgetBackgroundColorStyle from '../common/style/WidgetBackgroundColorStyle.vue'
import SpacerWidgetSettingsAccordionHeader from './SpacerWidgetSettingsAccordionHeader.vue'
import WidgetEditorThemePicker from '../common/style/WidgetEditorThemePicker.vue'
import Message from 'primevue/message'

export default defineComponent({
    name: 'spacer-widget-settings-accordion',
    components: {
        WidgetTitleStyle,
        WidgetBordersStyle,
        WidgetShadowsStyle,
        WidgetResponsive,
        WidgetPaddingStyle,
        WidgetBackgroundColorStyle,
        SpacerWidgetSettingsAccordionHeader,
        WidgetEditorThemePicker,
        Message
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        settings: { type: Array as PropType<{ title: string; type: string }[]> },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]> },
        dashboardId: { type: String, required: true }
    },
    inject: {
        widgetSettingsSearch: { from: 'widgetSettingsSearch', default: null }
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
        },
        isSearchActive(): boolean {
            return ((this.widgetSettingsSearch as any) ?? '').length >= 3
        },
        filteredSettings(): { title: string; type: string }[] {
            if (!this.settings) return []
            const search = (this.widgetSettingsSearch as any) ?? ''
            if (search.length >= 3) {
                const lc = search.toLowerCase()
                return this.settings.filter((s: { title: string; type: string }) => this.$t(s.title).toLowerCase().includes(lc))
            }
            return [...this.settings]
        }
    },
    watch: {
        settings() {
            this.activeIndex = -1
        }
    },
    created() {
        this.themeId = this.widgetModel.settings?.style?.themeId ?? null
    },
    methods: {
        onExpansionChange(expanded: boolean, index: number) {
            this.activeIndex = expanded ? index : -1
        },
        onStyleChanged() {
            this.styleChangedFlag = !this.styleChangedFlag
            if (this.themeId) this.themePropertyChanged = true
        },
        onThemeSelected() {
            this.themePropertyChanged = false
            this.themeId = this.widgetModel.settings?.style?.themeId ?? null
        }
    }
})
</script>

<style lang="scss">
.widget-editor-accordion {
    ::v-deep(.p-accordion-tab) {
        box-shadow: none !important;
    }
}
</style>
