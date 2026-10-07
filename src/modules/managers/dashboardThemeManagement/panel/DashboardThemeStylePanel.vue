<template>
    <div class="theme-panel column no-wrap">
        <div class="theme-panel__header row items-center no-wrap">
            <div class="col">
                <div class="theme-panel__title">{{ title }}</div>
                <div class="theme-panel__caption">{{ caption }}</div>
            </div>
            <q-btn flat round dense icon="close" :aria-label="$t('common.close')" @click="emit('close')">
                <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </div>

        <div class="col theme-panel__body">
            <q-card v-for="group in groups" :key="group.key" flat bordered class="theme-panel__card">
                <q-card-section class="q-py-sm">
                    <div class="theme-panel__card-label">{{ group.label }}</div>
                </q-card-section>
                <q-separator />
                <q-list separator>
                    <q-expansion-item v-for="section in group.sections" :key="section" group="theme-sections" hide-expand-icon :model-value="openSection === section" header-class="theme-panel__section-header" @update:model-value="(open) => onSectionToggle(section, open)">
                        <template #header>
                            <q-item-section>
                                <q-item-label>{{ $t(`managers.dashboardThemeManager.styleTypes.${section}`) }}</q-item-label>
                                <q-item-label v-if="allWidgets && notInheritingLabel(section)" caption>{{ notInheritingLabel(section) }}</q-item-label>
                            </q-item-section>
                            <q-item-section v-if="allWidgets && notInheritingLabel(section)" side @click.stop>
                                <q-btn flat dense no-caps size="sm" color="primary" :label="$t('managers.dashboardThemeManager.applyToAll')" @click="confirmApplyToAll([section])">
                                    <q-tooltip :delay="500">{{ $t('managers.dashboardThemeManager.applyToAllSectionHint') }}</q-tooltip>
                                </q-btn>
                            </q-item-section>
                            <q-item-section v-if="hasHeaderEnabled(section) || isInheritable(section)" side @click.stop>
                                <div class="row items-center no-wrap q-gutter-x-md">
                                    <q-toggle v-if="hasHeaderEnabled(section)" v-model="sectionStyle(section).enabled" dense size="sm" :disable="isInheritable(section) && isInheriting(section)" :label="$t('common.enabled')" left-label />
                                    <q-toggle v-if="isInheritable(section)" :data-tour-id="section === 'borders' ? 'theme-inherit' : undefined" :model-value="isInheriting(section)" dense size="sm" :label="$t('managers.dashboardThemeManager.inheritShared')" left-label @update:model-value="(value) => onInheritChange(section, value)" />
                                </div>
                            </q-item-section>
                        </template>
                        <div v-if="openSection === section" class="theme-panel__form">
                            <q-banner v-if="isInheritable(section) && isInheriting(section)" dense class="theme-panel__inherit-banner q-mx-md q-mb-sm">
                                <template #avatar><q-icon name="link" size="xs" /></template>
                                {{ $t('managers.dashboardThemeManager.inheritBanner') }}
                            </q-banner>
                            <component :is="THEME_SECTIONS[section].component" :key="formKey(section)" :widget-model="null" :theme-style="sectionStyle(section)" :read-only="isInheritable(section) && isInheriting(section)" v-bind="THEME_SECTIONS[section].props ?? {}" @vue:before-mount="emit('formMounting')" @vue:mounted="emit('formMounted')" />
                        </div>
                    </q-expansion-item>
                </q-list>
            </q-card>
        </div>

        <div class="theme-panel__footer row items-center">
            <q-btn v-if="allWidgets" unelevated no-caps color="primary" icon="link" :label="$t('managers.dashboardThemeManager.applyToAllWidgets')" :disable="!anyNotInheriting" @click="confirmApplyToAll(SHARED_STYLE_SECTIONS)" />
            <q-space />
            <q-btn flat no-caps color="primary" :label="$t('managers.dashboardThemeManager.discardChanges')" :disable="!dirty" @click="emit('discard')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import deepcopy from 'deepcopy'
import { IDashboardTheme, IDashboardThemeSharedSection } from '../DashboardThememanagement'
import { getTypesNotInheriting, IEditorWidgetType, inheritSharedInAllTypes, isSameSectionStyle, SHARED_STYLE_SECTIONS } from '../DashboardThemeHelper'
import { THEME_SECTIONS } from './DashboardThemeSections'

const props = defineProps<{
    theme: IDashboardTheme
    // null with allWidgets = shared mode.
    widgetType: IEditorWidgetType | null
    allWidgets: boolean
    // The section to open, for example after a click on a widget title.
    focusSection: string | null
    dirty: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'discard'): void
    (e: 'sectionOpened', section: string): void
    // Some forms fill in missing defaults when they mount. The page uses these to keep that out of the dirty state.
    (e: 'formMounting'): void
    (e: 'formMounted'): void
}>()

const { t } = useI18n()
const $q = useQuasar()
const openSection = ref<string | null>(props.focusSection)
// Forms read their model once, when they mount. Bumping this remounts them after an inherit change.
const formVersion = ref(0)

watch(
    () => props.focusSection,
    (section) => (openSection.value = section)
)

watch(
    () => [props.widgetType, props.allWidgets],
    () => (openSection.value = props.focusSection)
)

const typeName = computed(() => (props.widgetType ? t(`managers.dashboardThemeManager.widgetNames.${props.widgetType}`) : ''))

const title = computed(() => (props.allWidgets ? t('managers.dashboardThemeManager.allWidgets') : t('managers.dashboardThemeManager.widgetTitle', { type: typeName.value })))

const caption = computed(() => (props.allWidgets ? t('managers.dashboardThemeManager.allWidgetsCaption') : t('managers.dashboardThemeManager.typeCaption')))

const typeSections = computed(() => {
    if (props.allWidgets || !props.widgetType) return []
    const style = props.theme.config[props.widgetType]?.style ?? {}
    return Object.keys(style).filter((section) => !SHARED_STYLE_SECTIONS.includes(section as IDashboardThemeSharedSection) && THEME_SECTIONS[section])
})

const groups = computed(() => {
    const result = [{ key: 'shared', label: t('managers.dashboardThemeManager.sharedStyle'), sections: SHARED_STYLE_SECTIONS as string[] }]
    if (typeSections.value.length) result.push({ key: 'type', label: t('managers.dashboardThemeManager.typeStyle', { type: typeName.value }), sections: typeSections.value })
    return result
})

// The form's own "Enabled" toggle is hidden (CSS); this header toggle edits the same value.
function hasHeaderEnabled(section: string) {
    return !!THEME_SECTIONS[section]?.enabledInHeader && typeof sectionStyle(section)?.enabled === 'boolean'
}

function isInheritable(section: string) {
    return !props.allWidgets && !!props.widgetType && SHARED_STYLE_SECTIONS.includes(section as IDashboardThemeSharedSection)
}

function isInheriting(section: string) {
    if (!props.widgetType) return false
    return props.theme.config[props.widgetType]?.inherit?.[section] !== false
}

function sectionStyle(section: string) {
    const config = props.theme.config
    if (props.allWidgets) return config.shared?.style[section]
    if (!props.widgetType) return null
    if (isInheritable(section) && isInheriting(section)) return config.shared?.style[section]
    return config[props.widgetType].style[section]
}

function formKey(section: string) {
    return `${props.theme.id ?? 'new'}-${props.allWidgets ? 'all' : props.widgetType}-${section}-${isInheriting(section)}-${formVersion.value}`
}

function notInheritingLabel(section: string) {
    const types = getTypesNotInheriting(props.theme.config, section as IDashboardThemeSharedSection)
    if (!types.length) return ''
    return t('managers.dashboardThemeManager.notInherited', { types: types.map((type) => t(`managers.dashboardThemeManager.widgetNames.${type}`)).join(', ') })
}

const anyNotInheriting = computed(() => SHARED_STYLE_SECTIONS.some((section) => getTypesNotInheriting(props.theme.config, section).length > 0))

// Every widget type inherits the given shared sections again. Their own values for these sections are lost, so ask first.
function confirmApplyToAll(sections: IDashboardThemeSharedSection[]) {
    const message = sections.length === 1 ? t('managers.dashboardThemeManager.applyToAllSectionMessage', { section: t(`managers.dashboardThemeManager.styleTypes.${sections[0]}`) }) : t('managers.dashboardThemeManager.applyToAllWidgetsMessage')
    $q.dialog({ title: t('managers.dashboardThemeManager.applyToAllTitle'), message, cancel: true, persistent: true }).onOk(() => {
        inheritSharedInAllTypes(props.theme.config, sections)
        formVersion.value++
    })
}

function onSectionToggle(section: string, open: boolean) {
    openSection.value = open ? section : openSection.value === section ? null : openSection.value
    if (open) emit('sectionOpened', section)
}

function onInheritChange(section: string, inherit: boolean) {
    const type = props.widgetType
    if (!type) return
    const sharedSection = section as IDashboardThemeSharedSection
    const typeConfig = props.theme.config[type]
    const apply = () => {
        typeConfig.inherit = { ...(typeConfig.inherit ?? {}), [sharedSection]: inherit }
        if (inherit) typeConfig.style[sharedSection] = deepcopy(props.theme.config.shared?.style[sharedSection])
        formVersion.value++
    }
    if (inherit && !isSameSectionStyle(sharedSection, typeConfig.style[sharedSection], props.theme.config.shared?.style[sharedSection])) {
        $q.dialog({ title: t('managers.dashboardThemeManager.inheritConfirmTitle'), message: t('managers.dashboardThemeManager.inheritConfirmMessage', { type: typeName.value }), cancel: true, persistent: true }).onOk(apply)
    } else apply()
}
</script>

<style lang="scss" scoped>
.theme-panel {
    height: 100%;
    background-color: #ffffff;
}

.theme-panel__header {
    padding: 12px 8px 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.theme-panel__title {
    font-size: 1rem;
    font-weight: 500;
}

.theme-panel__caption {
    font-size: 0.75rem;
    color: #6b6b6b;
    margin-top: 2px;
}

.theme-panel__body {
    overflow-y: auto;
    min-height: 0;
    padding: 12px;
    background-color: #f3f3f3;
}

.theme-panel__card {
    margin-bottom: 12px;
}

// The document details section label.
.theme-panel__card-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9e9e9e;
}

.theme-panel__form {
    padding-top: 4px;

    // The section header shows this toggle.
    :deep(.kn-theme-enabled-toggle) {
        display: none !important;
    }
}

.theme-panel__inherit-banner {
    background-color: #eef4fb;
    color: #35506b;
    font-size: 0.75rem;
    border-radius: 4px;
}

.theme-panel__footer {
    padding: 8px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
}

:deep(.theme-panel__section-header) {
    min-height: 44px;
}
</style>
