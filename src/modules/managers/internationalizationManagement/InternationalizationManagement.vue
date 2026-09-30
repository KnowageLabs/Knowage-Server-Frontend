<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="300" :breakpoint="0" show-if-above bordered class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title>{{ $t('managers.internationalizationManagement.title') }}</q-toolbar-title>
                    </q-toolbar>
                    <q-linear-progress v-if="loading" indeterminate color="primary" />
                    <q-scroll-area class="col">
                        <q-list separator data-test="language-list">
                        <q-item v-for="language in languages" :key="language.languageTag" clickable :active="selectedLanguage?.languageTag === language.languageTag" active-class="i18n-list__item--active" @click="onLanguageClick(language)">
                            <q-item-section avatar>
                                <q-avatar size="28px" bordered>
                                    <img :src="getFlag(language.languageTag)" class="i18n-flag i18n-flag--list" />
                                </q-avatar>
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ language.language }}</q-item-label>
                                <q-item-label caption>{{ language.languageTag }}</q-item-label>
                            </q-item-section>
                            <q-item-section v-if="language.defaultLanguage" side>
                                <q-badge outline color="primary" :label="$t('managers.internationalizationManagement.defaultLanguage')" />
                            </q-item-section>
                        </q-item>
                        </q-list>
                    </q-scroll-area>
                </q-drawer>

                <!-- Absolute, so the content gets the height of the page instead of growing it: the list inside can then scroll. -->
                <div class="col relative-position">
                    <div v-if="selectedLanguage" class="absolute-full column no-wrap">
                        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                            <q-btn flat round dense :icon="drawerVisible ? 'menu_open' : 'menu'" @click="drawerVisible = !drawerVisible">
                                <q-tooltip :delay="500">{{ $t('common.toggle') }}</q-tooltip>
                            </q-btn>
                            <q-toolbar-title class="row items-center no-wrap">
                                <img :src="getFlag(selectedLanguage.languageTag)" class="i18n-flag" />
                                <span class="ellipsis">{{ selectedLanguage.language }}</span>
                            </q-toolbar-title>
                        </q-toolbar>
                        <q-linear-progress v-if="loading" indeterminate color="primary" />

                        <div class="col i18n-main">
                            <div class="i18n-container">
                                <q-card class="i18n-toolbar row items-center no-wrap">
                                    <q-input v-model="filter" outlined dense clearable debounce="300" bg-color="white" class="i18n-search" :placeholder="$t('common.search')" data-test="search-input">
                                        <template #append><q-icon name="search" /></template>
                                    </q-input>
                                    <q-toggle v-model="showOnlyEmptyFields" dense :label="$t('managers.internationalizationManagement.showBlankMessages')" />
                                    <q-space />
                                    <q-btn v-if="selectedLanguage.defaultLanguage" unelevated no-caps color="primary" icon="add" :label="$t('managers.internationalizationManagement.table.addEntry')" :disable="loading" data-test="add-button" @click="addEmptyLabel" />
                                </q-card>
                                <q-card class="i18n-card column no-wrap">
                                    <div class="i18n-row i18n-row--head" :class="rowClass">
                                        <button type="button" class="i18n-sort" @click="toggleSort('label')">
                                            <span>{{ selectedLanguage.defaultLanguage ? $t('common.label') : $t('common.label') + ' / ' + $t('managers.internationalizationManagement.table.defaultMessage') }}</span>
                                            <q-icon :name="sortIcon('label')" size="14px" :class="{ 'i18n-sort__icon--idle': sortKey !== 'label' }" />
                                        </button>
                                        <button type="button" class="i18n-sort" @click="toggleSort('message')">
                                            <span>{{ $t('managers.internationalizationManagement.table.messageCode') }}</span>
                                            <q-icon :name="sortIcon('message')" size="14px" :class="{ 'i18n-sort__icon--idle': sortKey !== 'message' }" />
                                        </button>
                                        <span class="i18n-row__actions"></span>
                                    </div>
                                    <q-separator />

                                    <q-scroll-area v-if="visibleMessages.length > 0" :ref="setScrollArea" class="col">
                                        <q-virtual-scroll v-if="scrollTarget" :scroll-target="scrollTarget" :items="visibleMessages" :virtual-scroll-item-size="56">
                                        <template #default="{ item: row }">
                                            <div :key="row.rowKey" class="i18n-row" :class="[rowClass, { 'i18n-row--changed': isRowChanged(row) }]">
                                                <div v-if="selectedLanguage.defaultLanguage" class="i18n-cell" :class="{ 'i18n-cell--empty': !row.label }" tabindex="0">
                                                    <span class="i18n-cell__text">{{ row.label }}</span>
                                                    <q-popup-edit v-slot="scope" :model-value="row.label" auto-save :content-style="popupStyle" @save="updateRow(row, 'label', $event)">
                                                        <div class="i18n-popup">
                                                            <q-input v-model="scope.value" type="textarea" borderless dense autofocus autogrow class="i18n-popup__input" @keydown.enter.exact.prevent="scope.set" />
                                                            <q-separator />
                                                            <div class="i18n-popup__actions">
                                                                <q-btn flat round dense size="sm" color="grey-7" icon="close" @click="scope.cancel" />
                                                                <q-btn flat round dense size="sm" color="primary" icon="check" @click="scope.set" />
                                                            </div>
                                                        </div>
                                                    </q-popup-edit>
                                                </div>
                                                <div v-else class="i18n-row__key">
                                                    <div class="i18n-row__label">{{ row.label }}</div>
                                                    <div class="i18n-row__default">{{ row.defaultMessageCode }}</div>
                                                </div>
                                                <div class="i18n-cell" :class="{ 'i18n-cell--empty': !row.message }" tabindex="0">
                                                    <span class="i18n-cell__text">{{ row.message }}</span>
                                                    <q-popup-edit v-slot="scope" :model-value="row.message" auto-save :content-style="popupStyle" @save="updateRow(row, 'message', $event)">
                                                        <div class="i18n-popup">
                                                            <q-input v-model="scope.value" type="textarea" borderless dense autofocus autogrow class="i18n-popup__input" @keydown.enter.exact.prevent="scope.set" />
                                                            <q-separator />
                                                            <div class="i18n-popup__actions">
                                                                <q-btn flat round dense size="sm" color="grey-7" icon="close" @click="scope.cancel" />
                                                                <q-btn flat round dense size="sm" color="primary" icon="check" @click="scope.set" />
                                                            </div>
                                                        </div>
                                                    </q-popup-edit>
                                                </div>
                                                <span class="i18n-row__actions">
                                                    <q-btn flat round dense size="sm" :color="isRowDirty(row) ? 'primary' : 'grey-6'" icon="save" :disable="loading || !isRowDirty(row)" data-test="submit-button" @click="saveLabel(selectedLanguage, row)">
                                                        <q-tooltip :delay="500">{{ $t('common.save') }}</q-tooltip>
                                                    </q-btn>
                                                    <q-btn flat round dense size="sm" color="grey-7" :icon="selectedLanguage.defaultLanguage ? 'delete' : 'cancel'" data-test="delete-button" @click="deleteLabelConfirm(selectedLanguage, row)">
                                                        <q-tooltip :delay="500">{{ selectedLanguage.defaultLanguage ? $t('common.delete') : $t('common.cancel') }}</q-tooltip>
                                                    </q-btn>
                                                </span>
                                            </div>
                                        </template>
                                        </q-virtual-scroll>
                                    </q-scroll-area>
                                    <div v-else class="col i18n-empty column items-center justify-center">
                                        <q-icon name="inbox" size="2.5rem" color="grey-5" class="q-mb-sm" />
                                        <span>{{ $t('common.info.noDataFound') }}</span>
                                    </div>
                                </q-card>
                            </div>
                        </div>
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import mainStore from '@/App.store'
import { iLanguage, iMessage } from './InternationalizationManagement'

// Rows keep the original value of an edited field in `<field>_default`, which also marks the row as changed.
type IRow = iMessage & { rowKey: number; defaultMessageCode?: string; label_default?: string; message_default?: string; language?: string }
type IField = 'label' | 'message'

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()

const apiUrl = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/'

const loading = ref(false)
const drawerVisible = ref(true)
const languages = ref<iLanguage[]>([])
const selectedLanguage = ref<iLanguage | null>(null)
const messages = ref<IRow[]>([])
const defaultLangMessages = ref<IRow[]>([])
const showOnlyEmptyFields = ref(false)
const filter = ref<string | null>('')

let rowKeyCounter = 0
const nextRowKey = () => ++rowKeyCounter

// The blank rows are fixed when the filter is turned on, so a row does not disappear while its first character is typed.
const blankRowKeys = ref<Set<number>>(new Set())
const scrollTarget = ref<Element | undefined>()
const sortKey = ref<IField | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')
const popupStyle = { border: '2px solid var(--q-primary)' }

// The virtual list scrolls inside the Quasar scroll area.
function setScrollArea(area: any) {
    scrollTarget.value = area?.getScrollTarget?.()
}

// A header click sorts ascending, then descending, then back to the original order.
function toggleSort(key: IField) {
    if (sortKey.value !== key) {
        sortKey.value = key
        sortDir.value = 'asc'
    } else if (sortDir.value === 'asc') {
        sortDir.value = 'desc'
    } else {
        sortKey.value = null
    }
}

function sortIcon(key: IField): string {
    if (sortKey.value !== key) return 'arrow_upward'
    return sortDir.value === 'asc' ? 'arrow_upward' : 'arrow_downward'
}

const rowClass = computed(() => (selectedLanguage.value?.defaultLanguage ? 'i18n-row--default' : 'i18n-row--translation'))
const visibleMessages = computed(() => {
    const term = (filter.value ?? '').trim().toLowerCase()
    const filtered = messages.value.filter((message) => {
        if (showOnlyEmptyFields.value && !blankRowKeys.value.has(message.rowKey)) return false
        return !term || `${message.label} ${message.message} ${message.defaultMessageCode ?? ''}`.toLowerCase().includes(term)
    })
    const key = sortKey.value
    if (!key) return filtered
    const direction = sortDir.value === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => (a[key] ?? '').localeCompare(b[key] ?? '', undefined, { sensitivity: 'base', numeric: true }) * direction)
})
const hasUnsavedChanges = computed(() => messages.value.some((message) => isChanged(message, 'label') || isChanged(message, 'message')))

function isChanged(row: IRow, field: IField): boolean {
    const original = row[`${field}_default`]
    return original !== undefined && original !== row[field]
}

function isRowChanged(row: IRow): boolean {
    return isChanged(row, 'label') || isChanged(row, 'message')
}

function isRowDirty(row: IRow): boolean {
    return !row.id || isRowChanged(row)
}

function updateRow(row: IRow, field: IField, value: string | number | null) {
    if (row[`${field}_default`] === undefined) row[`${field}_default`] = row[field]
    row[field] = String(value ?? '')
}

function getFlag(locale: string): string {
    return `${import.meta.env.VITE_PUBLIC_PATH}images/flags/${locale.toLowerCase().substring(locale.length - 2)}.svg`
}

// ── Languages ─────────────────────────────────────────────

async function loadLanguages() {
    loading.value = true
    try {
        const response = await axios.get(apiUrl + 'internationalization/languages')
        const all: iLanguage[] = response.data ?? []
        languages.value = [...all.filter((language) => language.defaultLanguage), ...all.filter((language) => !language.defaultLanguage)]
    } finally {
        loading.value = false
    }
}

// Leaving a language with unsaved changes asks first.
function onLanguageClick(language: iLanguage) {
    if (language.languageTag === selectedLanguage.value?.languageTag) return
    if (!hasUnsavedChanges.value) return void selectLanguage(language)
    $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true }).onOk(() => selectLanguage(language))
}

function selectLanguage(language: iLanguage) {
    selectedLanguage.value = language
    showOnlyEmptyFields.value = false
    loadMessages(language)
}

// ── Messages ──────────────────────────────────────────────

async function loadMessages(language: iLanguage) {
    messages.value = []
    loading.value = true
    try {
        const response = await axios.get(apiUrl + 'i18nMessages/internationalization/?currLanguage=' + language.languageTag)
        // A faster response for a language that is no longer selected is ignored.
        if (selectedLanguage.value?.languageTag !== language.languageTag) return
        const data: IRow[] = (response.data ?? []).map((message: IRow) => ({ ...message, rowKey: nextRowKey() }))
        if (language.defaultLanguage) {
            defaultLangMessages.value = data
            messages.value = data
            if (data.length === 0) addEmptyLabel()
        } else {
            messages.value = defaultLangMessages.value.map((defaultMessage) => {
                const translated = data.find((item) => item.label === defaultMessage.label)
                if (translated) return { ...translated, defaultMessageCode: defaultMessage.message }
                return { rowKey: nextRowKey(), language: language.languageTag, label: defaultMessage.label, defaultMessageCode: defaultMessage.message, message: '' }
            })
        }
    } finally {
        loading.value = false
    }
}

function addEmptyLabel() {
    showOnlyEmptyFields.value = false
    messages.value = [{ rowKey: nextRowKey(), language: '', label: '', message: '' }, ...messages.value]
}

async function saveLabel(language: iLanguage, row: IRow) {
    const toSave: Record<string, any> = { ...row }
    ;['rowKey', 'label_default', 'message_default', 'defaultMessageCode'].forEach((key) => delete toSave[key])
    loading.value = true
    try {
        let response: any
        if (row.id) {
            response = await axios.put(apiUrl + 'i18nMessages', toSave)
        } else {
            toSave.language = language.languageTag
            response = await axios.post(apiUrl + 'i18nMessages', toSave)
        }
        if (response.data?.errors) {
            store.setError({ msg: response.data.errors })
        } else {
            store.setInfo({ msg: t('common.toast.updateSuccess') })
            showOnlyEmptyFields.value = false
            // The default messages are the source of the other languages' rows.
            await loadMessages(language)
        }
    } finally {
        loading.value = false
    }
}

function deleteLabelConfirm(language: iLanguage, row: IRow) {
    const isDefault = !!language.defaultLanguage
    if (!row.id) {
        if (isDefault) messages.value = messages.value.filter((message) => message.rowKey !== row.rowKey)
        else store.setError({ title: t('managers.internationalizationManagement.delete.deleteDefaultTitle'), msg: t('managers.internationalizationManagement.delete.cantDelete') })
        return
    }
    // Messages of other languages have a default message code; a default message does not.
    const isTranslation = !!row.defaultMessageCode
    $q.dialog({
        title: t(isTranslation ? 'managers.internationalizationManagement.delete.deleteMessageTitle' : 'managers.internationalizationManagement.delete.deleteDefaultTitle'),
        message: t(isTranslation ? 'managers.internationalizationManagement.delete.deleteMessage' : 'managers.internationalizationManagement.delete.deleteDefault'),
        cancel: true,
        persistent: true
    }).onOk(() => deleteLabel(isTranslation ? apiUrl + 'i18nMessages/' : apiUrl + 'i18nMessages/deletedefault/', row.id as number, language))
}

async function deleteLabel(url: string, id: number, language: iLanguage) {
    const response = await axios.delete(url + id)
    if (response.data?.errors) {
        store.setError({ title: 'Error', msg: response.data.errors })
        return
    }
    store.setInfo({ title: t('common.toast.deleteTitle'), msg: t('common.toast.deleteSuccess') })
    showOnlyEmptyFields.value = false
    await loadMessages(language)
}

watch(showOnlyEmptyFields, (value) => {
    if (value) blankRowKeys.value = new Set(messages.value.filter((message) => !message.message).map((message) => message.rowKey))
})

onMounted(async () => {
    await loadLanguages()
    if (languages.value.length > 0) selectLanguage(languages.value[0])
})
</script>

<style scoped lang="scss">
.i18n-list__item--active {
    background: var(--kn-list-item-selected-background-color, rgba(0, 0, 0, 0.06));
    color: inherit;
}

.i18n-flag {
    width: 24px;
    height: 24px;
    margin-right: 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 50%;
    object-fit: cover;

    &--list {
        margin: 0;
    }
}

.i18n-main {
    min-height: 0;
    background-color: #f3f3f3;
}

.i18n-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 16px;
}

.i18n-card {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.i18n-toolbar {
    flex-shrink: 0;
    gap: 16px;
    padding: 16px;
}

.i18n-search {
    width: 300px;
    max-width: 100%;
}

.i18n-row {
    display: grid;
    align-items: center;
    gap: 16px;
    padding: 6px 16px 6px 13px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    border-left: 3px solid transparent;

    &--default,
    &--translation {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 64px;
    }

    &--head {
        align-items: center;
        padding-top: 6px;
        padding-bottom: 6px;
        border-bottom: 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.54);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    &:not(&--head):hover {
        background: rgba(0, 0, 0, 0.02);
    }

    &--changed {
        border-left-color: var(--q-warning);
    }

    &__key {
        padding: 6px 8px;
    }

    &__label {
        font-weight: 500;
        word-break: break-word;
    }

    &__default {
        margin-top: 2px;
        font-size: 0.8rem;
        color: rgba(0, 0, 0, 0.54);
        word-break: break-word;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        min-height: 36px;
    }
}

// Cells look like plain text: one line, and a popup editor opens on click so long texts can be read and edited.
.i18n-cell {
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 0 8px;
    border-radius: 4px;
    cursor: text;
    transition: background 0.1s;

    &:hover,
    &:focus-visible {
        background: rgba(0, 0, 0, 0.05);
        outline: none;
    }

    &--empty {
        background: rgba(0, 0, 0, 0.03);
    }

    &__text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.i18n-popup {
    width: 480px;
    max-width: 80vw;

    &__input {
        padding: 4px 12px;

        :deep(textarea) {
            max-height: 40vh;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
        }
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        padding: 4px 8px;
    }
}

.i18n-sort {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: fit-content;
    padding: 0 8px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    cursor: pointer;

    &__icon--idle {
        opacity: 0;
    }

    &:hover &__icon--idle {
        opacity: 0.5;
    }
}

.i18n-empty {
    padding: 32px 16px;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.54);
}
</style>
