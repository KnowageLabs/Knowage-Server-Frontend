<template>
    <div class="theme-background-panel column no-wrap">
        <div class="theme-background-panel__header row items-center no-wrap">
            <div class="col">
                <div class="theme-background-panel__title">{{ $t('managers.dashboardThemeManager.sheetBackground') }}</div>
                <div class="theme-background-panel__caption">{{ $t('managers.dashboardThemeManager.sheetBackgroundCaption') }}</div>
            </div>
            <q-btn flat round dense icon="close" :aria-label="$t('common.close')" @click="emit('close')">
                <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </div>

        <q-scroll-area class="col theme-background-panel__body">
            <div class="theme-background-panel__body-content">
                <q-card flat bordered class="theme-background-panel__card">
                    <q-card-section class="q-py-sm row items-center no-wrap">
                        <div class="col theme-background-panel__card-label">{{ $t('managers.dashboardThemeManager.laptopPreviewTitle') }}</div>
                        <q-toggle v-model="showWidgets" dense size="sm" :label="$t('managers.dashboardThemeManager.showWidgets')" left-label />
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <div class="theme-background-panel__preview" :style="previewStyle">
                            <template v-if="showWidgets">
                                <div class="theme-background-panel__preview-card" style="left: 4%; top: 7%; width: 44%; height: 38%"></div>
                                <div class="theme-background-panel__preview-card" style="left: 52%; top: 7%; width: 44%; height: 38%"></div>
                                <div class="theme-background-panel__preview-card" style="left: 4%; top: 51%; width: 92%; height: 42%"></div>
                            </template>
                        </div>
                    </q-card-section>
                </q-card>

                <q-card v-if="theme.config.sheetBackground" flat bordered class="theme-background-panel__card">
                    <q-card-section class="q-py-sm">
                        <div class="theme-background-panel__card-label">{{ $t('managers.dashboardThemeManager.background') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <DashboardBackgroundFields :background="theme.config.sheetBackground" />
                    </q-card-section>
                </q-card>
            </div>
        </q-scroll-area>

        <div class="theme-background-panel__footer row items-center">
            <q-space />
            <q-btn flat no-caps color="primary" :label="$t('managers.dashboardThemeManager.discardChanges')" :disable="!dirty" @click="emit('discard')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IDashboardTheme } from '../DashboardThememanagement'
import DashboardBackgroundFields from '@/modules/documentExecution/dashboard/generalSettings/background/DashboardBackgroundFields.vue'
import { getSheetBackgroundStyle } from '@/modules/documentExecution/dashboard/generalSettings/background/DashboardBackgroundHelper'
import { LAPTOP_SHEET } from '../canvas/DashboardThemeMockWidgets'

const props = defineProps<{
    theme: IDashboardTheme
    dirty: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'discard'): void
}>()

const showWidgets = ref(true)

// The sheet area of the laptop screen, styled as a dashboard styles its sheet.
const previewStyle = computed(() => ({ ...getSheetBackgroundStyle(props.theme.config.sheetBackground), 'aspect-ratio': `${LAPTOP_SHEET.width} / ${LAPTOP_SHEET.height}` }))
</script>

<style lang="scss" scoped>
.theme-background-panel {
    height: 100%;
    background-color: #ffffff;
}

.theme-background-panel__header {
    padding: 12px 8px 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.theme-background-panel__title {
    font-size: 1rem;
    font-weight: 500;
}

.theme-background-panel__caption {
    font-size: 0.75rem;
    color: #6b6b6b;
    margin-top: 2px;
}

.theme-background-panel__body {
    min-height: 0;
    background-color: #f3f3f3;
}

.theme-background-panel__body-content {
    padding: 12px;
}

.theme-background-panel__card {
    margin-bottom: 12px;
}

.theme-background-panel__card-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9e9e9e;
}

// The renderer sets min-height: 100% for the sheet; the preview has its own ratio.
.theme-background-panel__preview {
    position: relative;
    width: 100%;
    min-height: 0 !important;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    overflow: hidden;
}

.theme-background-panel__preview-card {
    position: absolute;
    border-radius: 3px;
    background-color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.theme-background-panel__footer {
    padding: 8px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
