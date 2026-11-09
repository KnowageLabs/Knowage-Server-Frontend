<template>
    <div class="theme-sheet-tabs-panel column no-wrap">
        <div class="theme-sheet-tabs-panel__header row items-center no-wrap">
            <div class="col">
                <div class="theme-sheet-tabs-panel__title">{{ $t('dashboard.sheetTabs.title') }}</div>
                <div class="theme-sheet-tabs-panel__caption">{{ $t('managers.dashboardThemeManager.sheetTabsCaption') }}</div>
            </div>
            <q-btn flat round dense icon="close" :aria-label="$t('common.close')" @click="emit('close')">
                <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </div>

        <q-scroll-area class="col theme-sheet-tabs-panel__body">
            <div class="theme-sheet-tabs-panel__body-content">
                <q-card v-if="theme.config.sheetTabs" flat bordered class="theme-sheet-tabs-panel__card">
                    <q-card-section class="theme-sheet-tabs-panel__card-body">
                        <div class="theme-sheet-tabs-panel__preview">
                            <div class="theme-sheet-tabs-panel__sheet" :style="sheetStyle">
                                <div class="theme-sheet-tabs-panel__card-sample" style="left: 4%; top: 14%; width: 56%; height: 72%"></div>
                                <div class="theme-sheet-tabs-panel__card-sample" style="left: 64%; top: 14%; width: 32%; height: 72%"></div>
                            </div>
                            <KnSheetTabsPreview :tabs-style="tabsStyle" :tabs="previewTabs" :active-index="1" show-menu show-add />
                        </div>
                        <DashboardSheetTabsFields :sheet-tabs="theme.config.sheetTabs" :sheet-color="sheetColor" />
                    </q-card-section>
                </q-card>
            </div>
        </q-scroll-area>

        <div class="theme-sheet-tabs-panel__footer row items-center">
            <q-space />
            <q-btn flat no-caps color="primary" :label="$t('managers.dashboardThemeManager.discardChanges')" :disable="!dirty" @click="emit('discard')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IDashboardTheme } from '../DashboardThememanagement'
import DashboardSheetTabsFields from '@/modules/documentExecution/dashboard/generalSettings/sheetTabs/DashboardSheetTabsFields.vue'
import KnSheetTabsPreview from '@/components/UI/KnDashboardTabs/KnSheetTabsPreview.vue'
import { getSheetTabsStyle } from '@/modules/documentExecution/dashboard/sheetTabs/SheetTabsHelper'
import { getSheetBackgroundStyle } from '@/modules/documentExecution/dashboard/generalSettings/background/DashboardBackgroundHelper'

// The sheet tab bar of the theme. The page snapshot tracks the edits (the form edits the theme in place).
const props = defineProps<{
    theme: IDashboardTheme
    dirty: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'discard'): void
}>()

const { t } = useI18n()

const sheetColor = computed(() => props.theme.config.sheetBackground?.sheetsBackgroundColor ?? '')
const tabsStyle = computed(() => getSheetTabsStyle(props.theme.config.sheetTabs, sheetColor.value))
// The renderer style sets min-height: 100%; the preview sheet has its own height.
const sheetStyle = computed(() => ({ ...getSheetBackgroundStyle(props.theme.config.sheetBackground), 'min-height': '0' }))
const previewTabs = computed(() => [{ label: t('managers.dashboardThemeManager.canvas.sheetName', { number: 1 }) }, { label: t('managers.dashboardThemeManager.canvas.sheetName', { number: 2 }) }, { label: t('managers.dashboardThemeManager.canvas.sheetName', { number: 3 }) }])
</script>

<style lang="scss" scoped>
.theme-sheet-tabs-panel {
    height: 100%;
    background-color: #ffffff;
}

.theme-sheet-tabs-panel__header {
    padding: 12px 8px 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.theme-sheet-tabs-panel__title {
    font-size: 1rem;
    font-weight: 500;
}

.theme-sheet-tabs-panel__caption {
    font-size: 0.75rem;
    color: #6b6b6b;
    margin-top: 2px;
}

.theme-sheet-tabs-panel__body {
    min-height: 0;
    background-color: #f3f3f3;
}

.theme-sheet-tabs-panel__body-content {
    padding: 12px;
}

.theme-sheet-tabs-panel__card {
    margin-bottom: 12px;
}

.theme-sheet-tabs-panel__card-body {
    padding: 16px;
}

.theme-sheet-tabs-panel__preview {
    margin-bottom: 16px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
}

.theme-sheet-tabs-panel__sheet {
    position: relative;
    height: 96px;
    background-color: #ffffff;
}

.theme-sheet-tabs-panel__card-sample {
    position: absolute;
    border-radius: 3px;
    background-color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.theme-sheet-tabs-panel__footer {
    padding: 8px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
