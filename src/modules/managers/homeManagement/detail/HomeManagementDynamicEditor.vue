<template>
    <div class="de-root">

        <!-- ── Toolbar + Editors (single expander) ──────────────────── -->
        <q-card flat bordered class="de-editors-outer-card q-mb-md">

            <!-- Header (always visible) -->
            <q-card-section
                class="de-editors-outer-header row items-center q-py-sm q-px-md cursor-pointer"
                @click="editorsExpanded = !editorsExpanded"
            >
                <q-icon name="code" size="18px" color="primary" class="q-mr-sm" />
                <span class="text-subtitle2 text-weight-medium">{{ $t('managers.homeManagement.types.dynamic') }}</span>
                <q-space />

                <!-- Action buttons (stop propagation so they don't toggle the expander) -->
                <q-btn
                    unelevated dense
                    color="primary"
                    icon="fas fa-list"
                    :label="$t('managers.homeManagement.dynamic.insertPlaceholder')"
                    size="sm"
                    class="q-mr-sm"
                    @click.stop="insertMenuPlaceholder"
                />
                <q-btn
                    unelevated dense
                    color="secondary"
                    icon="fas fa-images"
                    :label="$t('managers.homeManagement.dynamic.loadFromGallery')"
                    size="sm"
                    class="q-mr-md"
                    @click.stop="openGallery"
                />

                <q-icon :name="editorsExpanded ? 'expand_less' : 'expand_more'" color="grey-6" />
            </q-card-section>

            <!-- Collapsible body: placeholders + editors -->
            <q-slide-transition>
                <div v-show="editorsExpanded">
                    <!-- Placeholder chips -->
                    <div class="de-placeholders row items-center q-px-md q-py-sm">
                        <transition-group name="ph-fade" tag="div" class="row items-center q-gutter-xs">
                            <q-chip
                                v-for="ph in menuPlaceholders"
                                :key="ph.index"
                                clickable
                                dense removable
                                color="primary"
                                text-color="white"
                                icon="menu"
                                @remove="removePlaceholder(ph.index)"
                                @click.stop="openPicker(ph.index)"
                            >
                                {{ $t('managers.homeManagement.dynamic.placeholder', { n: ph.index }) }}
                                <q-tooltip>{{ $t('managers.homeManagement.dynamic.itemsSelected', { n: ph.menuIds.length }) }}</q-tooltip>
                            </q-chip>
                            <span v-if="!menuPlaceholders.length" key="none" class="text-caption text-grey-5">
                                {{ $t('managers.homeManagement.dynamic.placeholderCount', { n: 0 }) }}
                            </span>
                        </transition-group>
                    </div>

                    <q-separator />

                    <!-- HTML + CSS editors -->
                    <div class="de-editors-row row q-col-gutter-none">
                        <div class="col-6">
                            <q-card flat class="de-editor-card">
                                <div class="de-editor-header row items-center">
                                    <q-icon name="o_code" size="16px" class="q-mr-xs" />
                                    <span>HTML</span>
                                </div>
                                <knMonaco
                                    ref="htmlEditorRef"
                                    v-model="localHtml"
                                    language="html"
                                    :options="{ theme: 'vs-dark', minimap: { enabled: false }, breadcrumbs: { enabled: false } }"
                                    class="de-monaco"
                                    @change="emitChange"
                                />
                            </q-card>
                        </div>
                        <div class="col-6">
                            <q-card flat class="de-editor-card de-editor-card--right">
                                <div class="de-editor-header row items-center">
                                    <q-icon name="o_style" size="16px" class="q-mr-xs" />
                                    <span>CSS</span>
                                </div>
                                <knMonaco
                                    v-model="localCss"
                                    language="css"
                                    :options="{ theme: 'vs-dark', minimap: { enabled: false }, breadcrumbs: { enabled: false } }"
                                    class="de-monaco"
                                    @change="emitChange"
                                />
                            </q-card>
                        </div>
                    </div>
                </div>
            </q-slide-transition>
        </q-card>

        <!-- ── Preview (full width) ──────────────────────────────────── -->
        <q-card flat bordered class="de-preview-card">
            <q-card-section class="de-preview-header row items-center q-py-sm q-px-md">
                <q-icon name="visibility" size="18px" color="primary" class="q-mr-sm" />
                <span class="text-subtitle2 text-weight-medium">{{ $t('managers.homeManagement.dynamic.preview') }}</span>
                <q-space />
                <q-select
                    v-model="viewAsRoleId"
                    :options="roleOptions"
                    :label="$t('managers.homeManagement.dynamic.viewAs')"
                    emit-value map-options
                    dense outlined
                    options-dense
                    style="min-width: 200px"
                />
            </q-card-section>
            <q-separator />
            <div class="de-preview-body">
                <q-linear-progress v-if="previewLoading" indeterminate color="primary" class="de-preview-loader" />
                <iframe class="de-preview-iframe" :srcdoc="previewSrc" />
            </div>
        </q-card>

        <!-- ── Gallery dialog ────────────────────────────────────────── -->
        <q-dialog v-model="galleryVisible">
            <q-card style="min-width: 680px; max-width: 92vw">
                <q-bar class="bg-secondary text-white">
                    <q-icon name="photo_library" class="q-mr-sm" />
                    <span class="text-subtitle1">{{ $t('managers.homeManagement.dynamic.selectFromGallery') }}</span>
                    <q-space />
                    <q-btn flat dense round icon="close" v-close-popup />
                </q-bar>
                <q-card-section>
                    <q-linear-progress v-if="galleryLoading" indeterminate color="secondary" class="q-mb-sm" />
                    <div class="row q-col-gutter-md">
                        <div v-for="tpl in galleryTemplates" :key="tpl.id" class="col-4">
                            <q-card bordered flat class="de-gallery-card cursor-pointer" @click="applyGalleryTemplate(tpl)">
                                <q-img v-if="tpl.image" :src="tpl.image" height="90px" fit="cover" />
                                <div v-else class="row items-center justify-center bg-grey-2" style="height: 90px">
                                    <q-icon name="home" size="44px" color="grey-5" />
                                </div>
                                <q-card-section class="q-pa-sm text-caption text-weight-medium">{{ tpl.label || tpl.name }}</q-card-section>
                            </q-card>
                        </div>
                        <div v-if="!galleryLoading && !galleryTemplates.length" class="col-12 text-grey-5 text-center q-pa-lg">
                            <q-icon name="search_off" size="40px" class="q-mb-sm" />
                            <div>{{ $t('common.info.noDataFound') }}</div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- ── Menu picker dialog ────────────────────────────────────── -->
        <HomeManagementMenuPickerDialog
            v-if="pickerVisible"
            :visible="pickerVisible"
            :selected-ids="activePlaceholderIndex !== null ? (getDynamicHomePlaceholderConfig(menuPlaceholders, activePlaceholderIndex)?.menuIds ?? []) : []"
            :role-id="props.currentRoleId"
            @update:visible="pickerVisible = $event"
            @confirm="onPickerConfirm"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.js'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import { getDynamicHomePlaceholderConfig, getNextDynamicHomePlaceholderIndex, normalizeDynamicHomeTemplate, removeDynamicHomePlaceholderFromHtml, renderDynamicHomeSrcdoc } from '@/helpers/commons/dynamicHomeHelper'
import HomeManagementMenuPickerDialog from './HomeManagementMenuPickerDialog.vue'
import { IDynamicHomeTemplate, IMenuPlaceholderConfig, IMenuNode } from '../HomeManagement'

const props = defineProps<{
    modelValue: IDynamicHomeTemplate
    roles: { id: number; name: string }[]
    currentRoleId: number | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', val: IDynamicHomeTemplate): void
}>()

const { t } = useI18n()

const EMPTY_TEMPLATE: IDynamicHomeTemplate = { html: '', css: '', menuPlaceholders: [] }
const initialTemplate = normalizeDynamicHomeTemplate(props.modelValue ?? EMPTY_TEMPLATE)

const localHtml = ref(initialTemplate.html)
const localCss = ref(initialTemplate.css)
const menuPlaceholders = ref<IMenuPlaceholderConfig[]>(initialTemplate.menuPlaceholders)

const galleryVisible = ref(false)
const galleryLoading = ref(false)
const galleryTemplates = ref<any[]>([])
const pickerVisible = ref(false)
const activePlaceholderIndex = ref<number | null>(null)
const viewAsRoleId = ref<number | null>(props.currentRoleId)
const editorsExpanded = ref(true)

const allMenuNodes = ref<IMenuNode[]>([])
const previewLoading = ref(false)

const roleOptions = computed(() => [
    { label: t('managers.homeManagement.defaultRole'), value: null },
    ...props.roles.map((r) => ({ label: r.name, value: r.id }))
])

const selectedPlaceholderSignature = computed(() =>
    menuPlaceholders.value
        .filter((placeholder) => placeholder.menuIds.length > 0)
        .map((placeholder) => `${placeholder.index}:${placeholder.menuIds.join(',')}`)
        .join('|')
)

function syncTemplateState(): IDynamicHomeTemplate {
    const normalizedTemplate = normalizeDynamicHomeTemplate({
        html: localHtml.value,
        css: localCss.value,
        menuPlaceholders: menuPlaceholders.value
    })

    menuPlaceholders.value = normalizedTemplate.menuPlaceholders
    return normalizedTemplate
}

function applyIncomingTemplate(template?: IDynamicHomeTemplate) {
    const normalizedTemplate = normalizeDynamicHomeTemplate(template ?? EMPTY_TEMPLATE)
    localHtml.value = normalizedTemplate.html
    localCss.value = normalizedTemplate.css
    menuPlaceholders.value = normalizedTemplate.menuPlaceholders
}

async function loadMenuAndFilter(roleId: number | null) {
    previewLoading.value = true
    try {
        const roleSegment = roleId ?? 'default'
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/preview/' + roleSegment)
        allMenuNodes.value = res.data
    } catch { /* no-op */ }
    finally {
        previewLoading.value = false
    }
}

const previewSrc = computed(() => renderDynamicHomeSrcdoc({
    html: localHtml.value,
    css: localCss.value,
    menuPlaceholders: menuPlaceholders.value
}, allMenuNodes.value, import.meta.env.VITE_PUBLIC_PATH || ''))

function emitChange() {
    emit('update:modelValue', syncTemplateState())
}

const htmlEditorRef = ref<any>(null)

function insertMenuPlaceholder() {
    const nextPlaceholderIndex = getNextDynamicHomePlaceholderIndex(menuPlaceholders.value)
    const placeholderSnippet = `<a data-kn-menu="${nextPlaceholderIndex}" href="#">Menu Item</a>`
    const editor = htmlEditorRef.value?.editor
    if (editor) {
        const pos = editor.getPosition()
        editor.executeEdits('', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column }, text: placeholderSnippet }])
        localHtml.value = editor.getValue()
    } else {
        localHtml.value += '\n' + placeholderSnippet
    }
    menuPlaceholders.value = [...menuPlaceholders.value, { index: nextPlaceholderIndex, menuIds: [] }]
    activePlaceholderIndex.value = nextPlaceholderIndex
    pickerVisible.value = true
    emitChange()
}

function openPicker(index: number) {
    activePlaceholderIndex.value = index
    pickerVisible.value = true
}

function onPickerConfirm(ids: number[]) {
    if (activePlaceholderIndex.value === null) return

    const selectedPlaceholder = getDynamicHomePlaceholderConfig(menuPlaceholders.value, activePlaceholderIndex.value)
    menuPlaceholders.value = selectedPlaceholder
        ? menuPlaceholders.value.map((placeholder) => (placeholder.index === activePlaceholderIndex.value ? { ...placeholder, menuIds: ids } : placeholder))
        : [...menuPlaceholders.value, { index: activePlaceholderIndex.value, menuIds: ids }]
    emitChange()
    loadMenuAndFilter(viewAsRoleId.value)
}

function removePlaceholder(index: number) {
    localHtml.value = removeDynamicHomePlaceholderFromHtml(localHtml.value, index)
    menuPlaceholders.value = menuPlaceholders.value.filter((placeholder) => placeholder.index !== index)
    if (activePlaceholderIndex.value === index) activePlaceholderIndex.value = null
    emit('update:modelValue', {
        html: localHtml.value,
        css: localCss.value,
        menuPlaceholders: menuPlaceholders.value
    })
}

async function openGallery() {
    galleryVisible.value = true
    if (galleryTemplates.value.length > 0) return
    galleryLoading.value = true
    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/widgetgallery/widgets/home')
        galleryTemplates.value = res.data
    } finally {
        galleryLoading.value = false
    }
}

async function applyGalleryTemplate(tpl: any) {
    galleryLoading.value = true
    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/widgetgallery/' + tpl.id)
        const full = res.data
        localHtml.value = full.code?.html ?? ''
        localCss.value = full.code?.css ?? ''
        galleryVisible.value = false
        emitChange()
    } finally {
        galleryLoading.value = false
    }
}

// When "view as" role changes → reload/refilter with spinner
watch(viewAsRoleId, (roleId) => {
    loadMenuAndFilter(roleId)
})

// Sync incoming modelValue changes
watch(
    () => props.modelValue,
    (val) => {
        applyIncomingTemplate(val)
    }
)

// Load menu lazily when placeholders have selected items
watch(
    selectedPlaceholderSignature,
    (signature) => {
        if (signature) loadMenuAndFilter(viewAsRoleId.value)
    },
    { immediate: true }
)
</script>

<style lang="scss" scoped>
.de-root {
    display: flex;
    flex-direction: column;
}

/* ── Placeholder chip transition */
.ph-fade-enter-active,
.ph-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.ph-fade-enter-from,
.ph-fade-leave-to {
    opacity: 0;
    transform: scale(0.85);
}

/* ── Editor cards ─────────────────────────────────────────────── */
.de-editors-row {
    min-height: 0;
}

.de-editor-card {
    border-radius: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 380px;
}

.de-editor-header {
    background: #1e1e1e;
    color: #9cdcfe;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 5px 10px;
    flex-shrink: 0;
    gap: 4px;

    .q-icon {
        color: #9cdcfe;
    }
}

.de-editor-icon {
    font-size: 16px;
    color: #9cdcfe;
    margin-right: 6px;
    line-height: 1;
}

.de-monaco {
    flex: 1;
    min-height: 0;
}

/* ── Preview card ─────────────────────────────────────────────── */
.de-preview-card {
    border-radius: 0;
    overflow: hidden;
}

.de-preview-header {
    background: linear-gradient(135deg, #f5f7ff 0%, #eef1fb 100%);
}

.de-preview-body {
    position: relative;
    height: 500px;
    background: #fff;
}

.de-preview-loader {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
}

.de-preview-iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
}

/* ── Gallery ──────────────────────────────────────────────────── */
.de-gallery-card {
    border-radius: 0;
    transition: box-shadow 0.2s, transform 0.15s;

    &:hover {
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
        transform: translateY(-2px);
    }
}
</style>
