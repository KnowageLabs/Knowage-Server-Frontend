<template>
    <div v-if="sheetTabs" class="q-px-md q-pb-md">
        <q-banner v-if="connectedThemeName" dense class="dashboard-sheet-tabs__banner q-mb-sm">
            <template #avatar><q-icon name="link" size="xs" /></template>
            {{ $t('dashboard.sheetTabs.themeConnected', { theme: connectedThemeName }) }}
        </q-banner>
        <q-banner v-else-if="disconnected" dense class="dashboard-sheet-tabs__banner dashboard-sheet-tabs__banner--warning q-mb-sm">
            <template #avatar><q-icon name="link_off" size="xs" /></template>
            {{ $t('dashboard.sheetTabs.themeDisconnected') }}
        </q-banner>

        <div class="dashboard-sheet-tabs__preview q-mb-md">
            <div class="dashboard-sheet-tabs__preview-sheet" :style="{ backgroundColor: sheetColor || '#ffffff' }"></div>
            <KnSheetTabsPreview :tabs-style="tabsStyle" :tabs="previewTabs" show-menu show-add />
        </div>

        <DashboardSheetTabsFields :sheet-tabs="sheetTabs" :sheet-color="sheetColor" @change="onChange" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IDashboardSheetTabs } from '../../Dashboard'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { getSheetTabsStyle, normalizeSheetTabs } from '../../sheetTabs/SheetTabsHelper'
import DashboardSheetTabsFields from './DashboardSheetTabsFields.vue'
import KnSheetTabsPreview from '@/components/UI/KnDashboardTabs/KnSheetTabsPreview.vue'

// General settings › Sheet tabs. The settings edit the store model directly, as the background section does.
const props = defineProps<{ dashboardModelProp: any }>()
const { t } = useI18n()
const store = dashboardStore()

const configuration = props.dashboardModelProp.configuration
// A dashboard saved before this feature has no sheet tabs: it gets the default look (not a user change, it stays connected).
if (!configuration.sheetTabs) configuration.sheetTabs = { ...normalizeSheetTabs(null), themeId: null }
else Object.assign(configuration.sheetTabs, { ...normalizeSheetTabs(configuration.sheetTabs), themeId: configuration.sheetTabs.themeId ?? null })

const sheetTabs = computed<IDashboardSheetTabs & { themeId?: string | number | null }>(() => configuration.sheetTabs)
// Shown after a change disconnects the sheet tabs from their theme, until the settings close.
const disconnected = ref(false)

const sheetColor = computed(() => configuration.background?.sheetsBackgroundColor ?? '')
const tabsStyle = computed(() => getSheetTabsStyle(sheetTabs.value, sheetColor.value))
const previewTabs = computed(() => {
    const sheets = (props.dashboardModelProp.sheets ?? []).slice(0, 4).map((sheet: any) => ({ label: sheet.label, icon: sheet.icon?.className }))
    return sheets.length > 1 ? sheets : [...sheets, { label: t('dashboard.sheets.newSheet') }]
})

const connectedThemeName = computed(() => {
    if (sheetTabs.value?.themeId == null) return ''
    const theme = (store.getAllThemes() ?? []).find((theme: IDashboardTheme) => theme.id === sheetTabs.value.themeId)
    return theme?.themeName ?? ''
})

function onChange() {
    if (sheetTabs.value.themeId == null) return
    sheetTabs.value.themeId = null
    disconnected.value = true
}
</script>

<style lang="scss" scoped>
.dashboard-sheet-tabs__banner {
    background-color: #eef4fb;
    color: #35506b;
    font-size: 0.75rem;
    border-radius: 4px;

    &--warning {
        background-color: #fff4e5;
        color: #7a4a00;
    }
}
.dashboard-sheet-tabs__preview {
    overflow: hidden;
    border: 1px solid #dddddd;
    border-radius: 6px;
}
.dashboard-sheet-tabs__preview-sheet {
    height: 56px;
    background-image: radial-gradient(circle, rgba(128, 128, 128, 0.25) 1px, transparent 1px);
    background-size: 14px 14px;
}
</style>
