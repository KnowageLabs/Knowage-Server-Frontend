<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-drawer v-model="drawerVisible" side="left" :width="300" :breakpoint="0" show-if-above bordered class="column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.dashboardThemeManager.title') }}</q-toolbar-title>
                <q-btn flat round dense icon="add" :aria-label="$t('managers.dashboardThemeManager.addTheme')">
                    <q-tooltip :delay="500">{{ $t('managers.dashboardThemeManager.addTheme') }}</q-tooltip>
                    <q-menu auto-close>
                        <q-list dense style="min-width: 200px">
                            <q-item clickable @click="addTheme">
                                <q-item-section avatar><q-icon name="add" /></q-item-section>
                                <q-item-section>{{ $t('managers.dashboardThemeManager.newTheme') }}</q-item-section>
                            </q-item>
                            <q-item clickable @click="fileInput?.click()">
                                <q-item-section avatar><q-icon name="upload_file" /></q-item-section>
                                <q-item-section>{{ $t('managers.dashboardThemeManager.importTheme') }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </q-toolbar>
            <q-linear-progress v-if="loading" indeterminate color="primary" />
            <DashboardThemeList class="col" :themes="themes" :selected-id="selectedTheme?.id ?? null" :loading="loading" @select="(theme) => leaveTheme(() => selectTheme(theme))" @delete="confirmDelete" />
            <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="onImportFile" />
        </q-drawer>

        <q-drawer v-model="panelOpen" side="right" overlay :width="PANEL_WIDTH" :breakpoint="0" bordered class="theme-management__panel">
            <DashboardThemeStylePanel v-if="selectedTheme && panelOpen" :theme="selectedTheme" :widget-type="panelType" :all-widgets="panelAllWidgets" :focus-section="panelFocusSection" :dirty="dirty" @close="closePanel" @discard="discardChanges" @section-opened="onSectionOpened" @form-mounting="onFormMounting" @form-mounted="onFormMounted" />
        </q-drawer>

        <q-page-container>
            <q-page class="theme-management__page">
                <DashboardThemeCanvas v-if="selectedTheme" class="theme-management__canvas" :key="canvasKey" v-model:selector-variant="selectorVariant" :theme="selectedTheme" :panel-width="panelOpen ? PANEL_WIDTH : 0" :active-type="panelOpen && !panelAllWidgets ? panelType : null" @select="openTypePanel" @deselect="closePanel">
                    <template #top-left>
                        <div class="kn-canvas-controls">
                            <button class="kn-canvas-controls__button" type="button" :aria-label="$t('managers.dashboardThemeManager.toggleList')" @click="drawerVisible = !drawerVisible">
                                <q-icon :name="drawerVisible ? 'menu_open' : 'menu'" />
                                <q-tooltip :delay="500">{{ $t('managers.dashboardThemeManager.toggleList') }}</q-tooltip>
                            </button>
                            <button class="kn-canvas-controls__button theme-management__name" type="button">
                                <span class="ellipsis">{{ selectedTheme.themeName }}</span>
                                <span v-if="dirty" class="theme-management__dirty-dot" :title="$t('managers.dashboardThemeManager.unsavedChanges')"></span>
                                <q-badge v-if="selectedTheme.isDefault" outline color="grey-7" :label="$t('managers.dashboardThemeManager.default')" />
                                <q-icon name="edit" size="14px" />
                                <q-tooltip :delay="500">{{ $t('managers.dashboardThemeManager.rename') }}</q-tooltip>
                                <q-popup-edit v-slot="scope" v-model="selectedTheme.themeName" auto-save :validate="(value) => !!value?.trim()">
                                    <q-input v-model="scope.value" dense autofocus outlined :label="$t('common.name')" @keyup.enter="scope.set" />
                                </q-popup-edit>
                            </button>
                        </div>
                    </template>
                    <template #top-right>
                        <div class="kn-canvas-controls">
                            <button class="kn-canvas-controls__button" type="button" @click="openAllWidgetsPanel">
                                <q-icon name="dashboard_customize" />
                                {{ $t('managers.dashboardThemeManager.editAllWidgets') }}
                            </button>
                            <button v-if="selectedTheme.id" class="kn-canvas-controls__button" type="button" :aria-label="$t('managers.themeManagement.download')" @click="downloadTheme">
                                <q-icon name="download" />
                                <q-tooltip :delay="500">{{ $t('managers.themeManagement.download') }}</q-tooltip>
                            </button>
                            <button class="kn-canvas-controls__button" :class="{ 'kn-canvas-controls__button--primary': dirty && saveState === 'idle', 'kn-canvas-controls__button--success': saveState === 'success' }" type="button" :disabled="(!dirty && saveState === 'idle') || saveState === 'saving'" :aria-label="$t('managers.themeManagement.save')" @click="saveTheme">
                                <q-icon :name="saveState === 'saving' ? 'hourglass_empty' : saveState === 'success' ? 'check' : 'save'" />
                                <q-tooltip :delay="500">{{ $t('managers.themeManagement.save') }}</q-tooltip>
                            </button>
                        </div>
                    </template>
                </DashboardThemeCanvas>

                <div v-else-if="!loading" class="theme-management__empty">
                    <KnHint title="managers.dashboardThemeManager.title" hint="managers.dashboardThemeManager.hint" />
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import axios from 'axios'
import deepcopy from 'deepcopy'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import DashboardThemeList from './DashboardThemeList.vue'
import DashboardThemeCanvas from './canvas/DashboardThemeCanvas.vue'
import DashboardThemeStylePanel from './panel/DashboardThemeStylePanel.vue'
import { IDashboardTheme } from './DashboardThememanagement'
import { getDefaultDashboardThemeConfig, IEditorWidgetType, prepareThemeForEditor, resolveThemeInheritance, themeBackwardsCompatibility } from './DashboardThemeHelper'
import { ISelectorVariant, SELECTOR_SECTION_VARIANTS } from './canvas/DashboardThemeMockWidgets'

const PANEL_WIDTH = 520
const THEMES_URL = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/dashboardtheme`

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const themes = ref<IDashboardTheme[]>([])
const selectedTheme = ref<IDashboardTheme | null>(null)
const savedSnapshot = ref<string | null>(null)
const loading = ref(false)
const drawerVisible = ref(true)
const panelOpen = ref(false)
const panelType = ref<IEditorWidgetType | null>(null)
const panelAllWidgets = ref(false)
const panelFocusSection = ref<string | null>(null)
const selectorVariant = ref<ISelectorVariant>('singleValue')
const saveState = ref<'idle' | 'saving' | 'success'>('idle')
const canvasKey = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

const dirty = computed(() => !!selectedTheme.value && JSON.stringify(selectedTheme.value) !== savedSnapshot.value)

// The shared style flows into every type that inherits it, so the canvas and the saved theme stay resolved.
watch(
    () => selectedTheme.value?.config.shared,
    () => {
        if (selectedTheme.value) resolveThemeInheritance(selectedTheme.value.config)
    },
    { deep: true }
)

onMounted(async () => {
    if (!store.isEnterprise) {
        router.back()
        return
    }
    await loadThemes()
    openInitialTheme()
})

function openInitialTheme() {
    const initial = themes.value.find((theme) => theme.isDefault) ?? themes.value[0]
    if (initial) selectTheme(initial)
}

onBeforeRouteLeave((_to, _from, next) => {
    if (!dirty.value) return next()
    $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true })
        .onOk(() => next())
        .onCancel(() => next(false))
})

async function loadThemes() {
    loading.value = true
    try {
        const response = await axios.get(THEMES_URL)
        themes.value = response.data ?? []
    } finally {
        loading.value = false
    }
}

// Switching themes with unsaved changes asks first.
function leaveTheme(action: () => void) {
    if (!dirty.value) return action()
    $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true }).onOk(action)
}

function openTheme(theme: IDashboardTheme, snapshot: boolean) {
    prepareThemeForEditor(theme.config)
    selectedTheme.value = theme
    savedSnapshot.value = snapshot ? JSON.stringify(theme) : null
    closePanel()
    canvasKey.value++
}

function selectTheme(theme: IDashboardTheme) {
    openTheme(deepcopy(theme), true)
}

function addTheme() {
    leaveTheme(() => openTheme({ id: null, themeName: t('managers.dashboardThemeManager.newThemeName'), config: getDefaultDashboardThemeConfig(), isDefault: false }, false))
}

function openTypePanel(type: IEditorWidgetType) {
    panelType.value = type
    panelAllWidgets.value = false
    panelFocusSection.value = null
    panelOpen.value = true
}

function openAllWidgetsPanel() {
    panelType.value = null
    panelAllWidgets.value = true
    panelFocusSection.value = null
    panelOpen.value = true
}

function closePanel() {
    panelOpen.value = false
    panelType.value = null
    panelAllWidgets.value = false
    panelFocusSection.value = null
}

function onSectionOpened(section: string) {
    if (panelType.value === 'selector' && SELECTOR_SECTION_VARIANTS[section]) selectorVariant.value = SELECTOR_SECTION_VARIANTS[section]
}

// A form may fill in missing defaults when it mounts. That is not a user change: if the theme was clean, it stays clean.
let cleanBeforeFormMount = false
function onFormMounting() {
    cleanBeforeFormMount = !dirty.value && savedSnapshot.value !== null
}

function onFormMounted() {
    if (!cleanBeforeFormMount) return
    cleanBeforeFormMount = false
    nextTick(() => (savedSnapshot.value = JSON.stringify(selectedTheme.value)))
}

function discardChanges() {
    if (!selectedTheme.value) return
    const saved = savedSnapshot.value ? (JSON.parse(savedSnapshot.value) as IDashboardTheme) : null
    if (saved) openTheme(saved, true)
    else addTheme()
}

function themeForExport(): IDashboardTheme | null {
    if (!selectedTheme.value) return null
    const theme = deepcopy(selectedTheme.value)
    resolveThemeInheritance(theme.config)
    return theme
}

async function saveTheme() {
    const theme = themeForExport()
    if (!theme || saveState.value === 'saving') return
    saveState.value = 'saving'
    try {
        const response = theme.id ? await axios.put(`${THEMES_URL}/${theme.id}`, theme) : await axios.post(THEMES_URL, theme)
        if (!theme.id && response.data?.id) theme.id = response.data.id
        store.setInfo({ title: t('common.toast.updateTitle'), msg: t('common.toast.updateSuccess') })
        if (selectedTheme.value) selectedTheme.value.id = theme.id
        savedSnapshot.value = JSON.stringify(selectedTheme.value)
        await loadThemes()
        saveState.value = 'success'
        setTimeout(() => (saveState.value = 'idle'), 1500)
    } catch {
        saveState.value = 'idle'
    }
}

function downloadTheme() {
    const theme = themeForExport()
    if (!theme) return
    theme.id = null
    downloadDirect(JSON.stringify(theme), theme.themeName, 'application/json')
}

function confirmDelete(theme: IDashboardTheme) {
    $q.dialog({ title: t('common.toast.deleteConfirmTitle'), message: t('common.toast.deleteMessage'), cancel: true, persistent: true }).onOk(async () => {
        await axios.delete(`${THEMES_URL}/${theme.id}`)
        store.setInfo({ title: t('common.toast.deleteTitle'), msg: t('common.toast.deleteSuccess') })
        await loadThemes()
        if (selectedTheme.value?.id === theme.id) {
            selectedTheme.value = null
            savedSnapshot.value = null
            closePanel()
            openInitialTheme()
        }
    })
}

function onImportFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
        try {
            const json = JSON.parse(String(reader.result))
            if (json.config) themeBackwardsCompatibility(json.config)
            json.id = null
            const response = await axios.post(THEMES_URL, json)
            store.setInfo({ title: t('managers.themeManagement.uploadTheme'), msg: t('managers.themeManagement.themeSuccessfullyUploaded') })
            await loadThemes()
            const imported = themes.value.find((theme) => theme.id === response.data?.id)
            if (imported) leaveTheme(() => selectTheme(imported))
        } catch {
            store.setError({ title: t('common.toast.errorTitle'), msg: t('managers.dashboardThemeManager.importError') })
        }
    }
    reader.readAsText(file)
}
</script>

<style lang="scss" scoped>
// Quasar sets the page min-height from the layout. The canvas fills the page and does not grow it.
.theme-management__page {
    position: relative;
}

.theme-management__canvas {
    position: absolute;
    inset: 0;
}

.theme-management__name {
    max-width: 360px;
    gap: 8px;
    color: var(--kn-canvas-control-hover-color);
}

.theme-management__dirty-dot {
    flex: 0 0 auto;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--kn-color-fab);
}

.theme-management__empty {
    max-width: 640px;
    margin: 48px auto;
    padding: 0 16px;
}

:deep(.theme-management__panel) {
    box-shadow: -8px 0 24px -12px rgba(0, 0, 0, 0.25);
}
</style>
