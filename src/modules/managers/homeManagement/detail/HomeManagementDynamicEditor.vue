<template>
    <div class="dynamic-editor">
        <!-- Toolbar -->
        <div class="dynamic-editor__bar row items-center q-pa-sm q-col-gutter-sm">
            <div class="col-auto">
                <q-btn flat dense icon="fas fa-list" :title="$t('managers.homeManagement.dynamic.insertPlaceholder')" @click="insertMenuPlaceholder" />
                <q-btn flat dense icon="fas fa-images" :title="$t('managers.homeManagement.dynamic.loadFromGallery')" @click="openGallery" />
            </div>
            <q-space />
            <div class="col-auto text-caption text-grey-6">
                {{ $t('managers.homeManagement.dynamic.placeholderCount', { n: menuPlaceholders.length }) }}
            </div>
        </div>

        <!-- Placeholder list -->
        <div v-if="menuPlaceholders.length" class="q-px-md q-pb-sm">
            <div v-for="(ph, idx) in menuPlaceholders" :key="idx" class="row items-center q-col-gutter-sm q-mb-xs">
                <div class="col-auto text-caption text-grey-7">{{ $t('managers.homeManagement.dynamic.placeholder', { n: idx + 1 }) }}</div>
                <div class="col-auto">
                    <q-chip dense color="primary" text-color="white" :label="$t('managers.homeManagement.dynamic.itemsSelected', { n: ph.menuIds.length })" />
                </div>
                <div class="col-auto">
                    <q-btn flat dense round icon="edit" size="sm" @click="openPicker(idx)" />
                    <q-btn flat dense round icon="delete" size="sm" color="negative" @click="removePlaceholder(idx)" />
                </div>
            </div>
        </div>

        <!-- Editors + Preview (3 columns) -->
        <div class="dynamic-editor__content row">
            <!-- HTML editor -->
            <div class="col-3 dynamic-editor__col">
                <div class="editor-header">HTML</div>
                <knMonaco ref="htmlEditorRef" v-model="localHtml" language="html" :options="{ theme: 'vs-dark' }" class="editor-monaco" @change="emitChange" />
            </div>
            <!-- CSS editor -->
            <div class="col-3 dynamic-editor__col">
                <div class="editor-header">CSS</div>
                <knMonaco v-model="localCss" language="css" :options="{ theme: 'vs-dark' }" class="editor-monaco" @change="emitChange" />
            </div>
            <!-- Preview (wider) -->
            <div class="col-6 dynamic-editor__col">
                <div class="editor-header row items-center">
                    <span>{{ $t('managers.homeManagement.dynamic.preview') }}</span>
                    <q-space />
                    <q-select
                        v-model="viewAsRoleId"
                        :options="roleOptions"
                        :label="$t('managers.homeManagement.dynamic.viewAs')"
                        emit-value
                        map-options
                        dense
                        borderless
                        style="min-width: 160px; color: #aaaebc"
                        dark
                    />
                </div>
                <div class="preview-wrapper">
                    <q-linear-progress v-if="previewLoading" indeterminate color="primary" class="preview-loader" />
                    <iframe class="preview-iframe" :srcdoc="previewSrc" />
                </div>
            </div>
        </div>

        <!-- Gallery dialog -->
        <q-dialog v-model="galleryVisible">
            <q-card style="min-width: 640px; max-width: 90vw">
                <q-card-section class="row items-center">
                    <div class="text-h6">{{ $t('managers.homeManagement.dynamic.selectFromGallery') }}</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section>
                    <q-linear-progress v-if="galleryLoading" indeterminate color="primary" />
                    <div class="row q-col-gutter-md">
                        <div v-for="tpl in galleryTemplates" :key="tpl.id" class="col-4">
                            <q-card bordered flat class="gallery-card cursor-pointer" @click="applyGalleryTemplate(tpl)">
                                <q-img v-if="tpl.image" :src="tpl.image" height="80px" fit="cover" />
                                <div v-else class="row items-center justify-center bg-grey-2" style="height: 80px">
                                    <q-icon name="home" size="40px" color="grey-5" />
                                </div>
                                <q-card-section class="q-pa-sm text-caption">{{ tpl.label || tpl.name }}</q-card-section>
                            </q-card>
                        </div>
                        <div v-if="!galleryLoading && !galleryTemplates.length" class="col-12 text-grey-5 text-center q-pa-md">
                            {{ $t('common.info.noDataFound') }}
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Menu picker dialog -->
        <HomeManagementMenuPickerDialog
            v-if="pickerVisible"
            :visible="pickerVisible"
            :selected-ids="menuPlaceholders[activePlaceholderIdx]?.menuIds ?? []"
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

const PLACEHOLDER_SNIPPET = `<a data-kn-menu>Menu Item</a>`

const localHtml = ref(props.modelValue?.html ?? '')
const localCss = ref(props.modelValue?.css ?? '')
const menuPlaceholders = ref<IMenuPlaceholderConfig[]>(props.modelValue?.menuPlaceholders ?? [])

const galleryVisible = ref(false)
const galleryLoading = ref(false)
const galleryTemplates = ref<any[]>([])
const pickerVisible = ref(false)
const activePlaceholderIdx = ref(0)
const viewAsRoleId = ref<number | null>(props.currentRoleId)

// Full menu tree loaded once; per-role visible flat list computed on demand
const allMenuNodes = ref<IMenuNode[]>([])
const menuLoaded = ref(false)
const previewLoading = ref(false)
// Flat list filtered for the currently selected "view as" role
const visibleMenuNodes = ref<IMenuNode[]>([])

const roleOptions = computed(() => [
    { label: t('managers.homeManagement.defaultRole'), value: null },
    ...props.roles.map((r) => ({ label: r.name, value: r.id }))
])

function flattenNodes(nodes: IMenuNode[]): IMenuNode[] {
    const result: IMenuNode[] = []
    const walk = (items: IMenuNode[]) => {
        for (const n of items) {
            result.push(n)
            const children = n.lstChildren?.length ? n.lstChildren : (n.children ?? [])
            if (children.length) walk(children)
        }
    }
    walk(nodes)
    return result
}

function resolveUrl(node: IMenuNode): string {
    if (node.to) return (import.meta.env.VITE_PUBLIC_PATH || '') + node.to.replace(/\\\//g, '/')
    if (node.url) return node.url
    return '#'
}

async function loadMenuAndFilter(roleId: number | null) {
    previewLoading.value = true
    try {
        const roleSegment = roleId ?? 'default'
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/preview/' + roleSegment)
        allMenuNodes.value = res.data
        menuLoaded.value = true
        visibleMenuNodes.value = flattenNodes(allMenuNodes.value)
    } catch { /* no-op */ }
    finally {
        previewLoading.value = false
    }
}

const previewSrc = computed(() => {
    const allFlat = flattenNodes(allMenuNodes.value)

    let html = localHtml.value
    let phIdx = 0
    html = html.replace(/(<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?\sdata-kn-menu(\s[^>]*)?>)([\s\S]*?)(<\/\2>)/g, (_m, openFull, _tag, _pre, _post, inner, close) => {
        const ph = menuPlaceholders.value[phIdx]
        phIdx++

        if (!allFlat.length) {
            return ''
        }

        const selectedNodes = allFlat.filter((n) => ph?.menuIds?.includes(n.menuId))
        // Intersect selected with what this role can see
        const displayNodes = visibleMenuNodes.value.length
            ? selectedNodes.filter((n) => visibleMenuNodes.value.some((v) => v.menuId === n.menuId))
            : selectedNodes

        if (!displayNodes.length) return ''
        return displayNodes
            .map((node) => {
                let cloneOpen = openFull.replace(/\sdata-kn-menu(\s|=|>)/, ' ')
                cloneOpen = cloneOpen.replace(/href="[^"]*"/, `href="${resolveUrl(node)}"`)
                let cloneInner = inner.replace(/data-kn-label[^<]*/, `data-kn-label>${node.descr || node.name}`)
                if (!cloneInner.includes('data-kn-label') && cloneInner.trim()) cloneInner = node.descr || node.name || ''
                return `${cloneOpen}${cloneInner}${close}`
            })
            .join('\n')
    })

    return `<style>${localCss.value}</style>\n${html}`
})

function emitChange() {
    emit('update:modelValue', {
        html: localHtml.value,
        css: localCss.value,
        menuPlaceholders: menuPlaceholders.value
    })
}

const htmlEditorRef = ref<any>(null)

function insertMenuPlaceholder() {
    const editor = htmlEditorRef.value?.editor
    if (editor) {
        const pos = editor.getPosition()
        editor.executeEdits('', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column }, text: PLACEHOLDER_SNIPPET }])
        localHtml.value = editor.getValue()
    } else {
        localHtml.value += '\n' + PLACEHOLDER_SNIPPET
    }
    const idx = menuPlaceholders.value.length
    menuPlaceholders.value = [...menuPlaceholders.value, { index: idx, menuIds: [] }]
    activePlaceholderIdx.value = idx
    pickerVisible.value = true
    emitChange()
}

function openPicker(idx: number) {
    activePlaceholderIdx.value = idx
    pickerVisible.value = true
}

function onPickerConfirm(ids: number[]) {
    const phs = [...menuPlaceholders.value]
    phs[activePlaceholderIdx.value] = { ...phs[activePlaceholderIdx.value], menuIds: ids }
    menuPlaceholders.value = phs
    emitChange()
    loadMenuAndFilter(viewAsRoleId.value)
}

function removePlaceholder(idx: number) {
    menuPlaceholders.value = menuPlaceholders.value.filter((_, i) => i !== idx).map((ph, i) => ({ ...ph, index: i }))
    emitChange()
}

async function openGallery() {
    galleryVisible.value = true
    if (galleryTemplates.value.length > 0) return
    galleryLoading.value = true
    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/widgetgallery?type=home')
        galleryTemplates.value = res.data
    } finally {
        galleryLoading.value = false
    }
}

async function applyGalleryTemplate(tpl: any) {
    galleryLoading.value = true
    try {
        // List endpoint returns metadata only — fetch full template to get code
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
        if (val) {
            localHtml.value = val.html ?? ''
            localCss.value = val.css ?? ''
            menuPlaceholders.value = val.menuPlaceholders ?? []
        }
    }
)

// Load menu lazily when placeholders have selected items
watch(
    menuPlaceholders,
    (phs) => {
        if (phs.some((p) => p.menuIds.length > 0)) loadMenuAndFilter(viewAsRoleId.value)
    },
    { immediate: true }
)
</script>

<style lang="scss" scoped>
.dynamic-editor {
    display: flex;
    flex-direction: column;
    height: 600px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;

    &__bar {
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;
    }

    &__content {
        flex: 1;
        min-height: 0;
        display: flex;
    }

    &__col {
        display: flex;
        flex-direction: column;
        height: 100%;
        border-right: 1px solid #333;

        &:last-child {
            border-right: 0;
        }
    }

    .editor-header {
        background: #1a1b1f;
        color: #aaaebc;
        font-weight: 600;
        padding: 4px 10px;
        font-size: 0.75rem;
        text-transform: uppercase;
        flex-shrink: 0;
    }

    .editor-monaco {
        flex: 1;
        min-height: 0;
    }

    .preview-wrapper {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        position: relative;

        .preview-loader {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1;
        }
    }

    .preview-iframe {
        flex: 1;
        border: 0;
        width: 100%;
        background: white;
        min-height: 0;
    }

    .gallery-card {
        transition: box-shadow 0.2s;
        &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
    }
}
</style>
