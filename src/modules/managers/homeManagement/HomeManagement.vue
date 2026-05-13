<template>
    <div class="kn-page hm-page">
        <!-- ── Toolbar ─────────────────────────────────────────────────── -->
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.homeManagement.title') }}</q-toolbar-title>
            <q-btn
                v-if="!isDefaultRole"
                flat dense round
                icon="fas fa-undo"
                :title="$t('managers.homeManagement.resetToDefault')"
                class="q-mr-sm"
                @click="resetToDefault"
            />
            <q-btn
                flat dense round
                icon="save"
                :disable="!dirty"
                :title="$t('common.save')"
                @click="save"
            />
        </q-toolbar>

        <q-linear-progress v-if="loading" indeterminate color="primary" />

        <div class="q-pa-lg hm-body">

            <!-- ── Settings card ──────────────────────────────────────── -->
            <q-card flat bordered class="hm-settings-card q-mb-lg">
                <q-card-section class="hm-settings-card__header row items-center q-pb-sm">
                    <q-icon name="tune" size="20px" color="primary" class="q-mr-sm" />
                    <span class="text-subtitle1 text-weight-medium">{{ $t('managers.homeManagement.configuration') }}</span>
                    <q-chip
                        v-if="dirty"
                        dense
                        color="orange-2"
                        text-color="orange-9"
                        icon="edit"
                        class="q-ml-md"
                        style="font-size:11px"
                    >
                        {{ $t('common.toast.unsavedChangesHeader') }}
                    </q-chip>
                </q-card-section>

                <q-separator />

                <q-card-section>
                    <div class="row q-col-gutter-md">
                        <!-- Role selector -->
                        <div class="col-12 col-sm-6">
                            <q-select
                                v-model="selectedRoleName"
                                :options="roleOptions"
                                :label="$t('managers.homeManagement.role')"
                                emit-value map-options
                                outlined dense
                                options-dense
                                :loading="loading"
                                @update:model-value="onRoleChange"
                            >
                                <template #prepend><q-icon name="person" color="grey-6" /></template>
                            </q-select>
                        </div>

                        <!-- Home type selector (chips) -->
                        <div class="col-12 col-sm-6">
                            <div class="text-caption text-grey-6 q-mb-xs">{{ $t('managers.homeManagement.homeType') }}</div>
                            <div class="row q-gutter-sm">
                                <q-chip
                                    v-for="opt in homeTypeOptions"
                                    :key="opt.value"
                                    clickable
                                    :selected="config.type === opt.value"
                                    :color="config.type === opt.value ? 'primary' : 'grey-3'"
                                    :text-color="config.type === opt.value ? 'white' : 'grey-8'"
                                    :icon="homeTypeIcons[opt.value]"
                                    dense
                                    @click="selectType(opt.value)"
                                >
                                    {{ opt.label }}
                                </q-chip>
                            </div>
                        </div>
                    </div>

                    <!-- Type-specific inputs -->
                    <transition name="fade-slide" mode="out-in">
                        <div :key="config.type" class="q-mt-md">
                            <!-- default -->
                            <q-banner v-if="config.type === 'default'" rounded class="bg-blue-1 text-blue-9 q-mt-xs">
                                <template #avatar><q-icon name="info" color="primary" /></template>
                                {{ $t('managers.homeManagement.defaultDescription') }}
                            </q-banner>

                            <!-- static -->
                            <q-select
                                v-else-if="config.type === 'static'"
                                v-model="config.staticPage"
                                :options="staticPages"
                                :loading="staticPagesLoading"
                                option-label="name"
                                option-value="name"
                                emit-value map-options
                                :label="$t('managers.homeManagement.staticPage')"
                                outlined dense
                                options-dense
                                @update:model-value="dirty = true"
                            >
                                <template #prepend><q-icon name="article" color="grey-6" /></template>
                            </q-select>

                            <!-- document -->
                            <div v-else-if="config.type === 'document'" class="row items-center q-col-gutter-sm">
                                <div class="col">
                                    <q-input
                                        v-model="config.documentLabel"
                                        :label="$t('managers.homeManagement.document')"
                                        outlined dense readonly
                                        :placeholder="$t('managers.homeManagement.selectDocument')"
                                    >
                                        <template #prepend><q-icon name="description" color="grey-6" /></template>
                                    </q-input>
                                </div>
                                <div class="col-auto">
                                    <q-btn
                                        unelevated color="primary"
                                        icon="search"
                                        :label="$t('common.search')"
                                        dense
                                        @click="documentDialogVisible = true"
                                    />
                                </div>
                            </div>

                            <!-- image -->
                            <q-input
                                v-else-if="config.type === 'image'"
                                v-model="config.imageUrl"
                                :label="$t('managers.homeManagement.imageUrl')"
                                :placeholder="$t('managers.homeManagement.imageUrlPlaceholder')"
                                outlined dense clearable
                                @update:model-value="dirty = true"
                            >
                                <template #prepend><q-icon name="image" color="grey-6" /></template>
                            </q-input>
                        </div>
                    </transition>
                </q-card-section>
            </q-card>

            <!-- ── Dynamic editor (full width) ───────────────────────── -->
            <HomeManagementDynamicEditor
                v-if="config.type === 'dynamic'"
                :model-value="config.template ?? EMPTY_TEMPLATE"
                :roles="roles"
                :current-role-name="selectedRoleName"
                @update:model-value="(val) => { config.template = val; dirty = true }"
            />

            <!-- ── Preview (full width) ───────────────────────────────── -->
            <q-card v-if="config.type !== 'dynamic'" flat bordered class="hm-preview-card">
                <q-card-section class="row items-center q-py-sm">
                    <q-icon name="visibility" size="18px" color="primary" class="q-mr-sm" />
                    <span class="text-subtitle2 text-weight-medium">{{ $t('managers.homeManagement.preview') }}</span>
                    <q-space />
                    <q-badge v-if="config.type !== 'default'" color="primary" outline :label="config.type" />
                </q-card-section>
                <q-separator />

                <div class="hm-preview-content">
                    <!-- default -->
                    <img v-if="config.type === 'default'" :src="defaultImage()" alt="Default Home Preview" class="hm-preview-img" />

                    <!-- static: preview -->
                    <iframe v-else-if="config.type === 'static' && staticPagePreviewUrl" :src="staticPagePreviewUrl" class="hm-preview-iframe" />
                    <div v-else-if="config.type === 'static'" class="hm-preview-empty column items-center justify-center text-grey-5">
                        <q-icon name="article" size="56px" />
                        <div class="q-mt-sm text-body2">{{ $t('managers.homeManagement.selectStaticPage') }}</div>
                    </div>

                    <!-- image: preview -->
                    <img v-else-if="config.type === 'image' && config.imageUrl" :src="config.imageUrl" class="hm-preview-img" />
                    <div v-else-if="config.type === 'image'" class="hm-preview-empty column items-center justify-center text-grey-5">
                        <q-icon name="image" size="56px" />
                        <div class="q-mt-sm text-body2">{{ $t('managers.homeManagement.imageUrlPlaceholder') }}</div>
                    </div>

                    <!-- document: preview -->
                    <iframe v-else-if="config.type === 'document' && documentPreviewUrl" :src="documentPreviewUrl" class="hm-preview-iframe" />
                    <div v-else-if="config.type === 'document'" class="hm-preview-empty column items-center justify-center text-grey-5">
                        <q-icon name="description" size="56px" />
                        <div class="q-mt-sm text-body2">{{ $t('managers.homeManagement.selectDocument') }}</div>
                    </div>
                </div>
            </q-card>
        </div>

        <!-- ── Document picker dialog ─────────────────────────────────── -->
        <q-dialog v-model="documentDialogVisible" persistent>
            <q-card style="min-width: 720px; max-width: 92vw">
                <q-bar class="bg-primary text-white">
                    <q-icon name="description" class="q-mr-sm" />
                    <span class="text-subtitle1">{{ $t('managers.homeManagement.selectDocument') }}</span>
                    <q-space />
                    <q-btn flat dense round icon="close" v-close-popup />
                </q-bar>
                <q-card-section>
                    <q-linear-progress v-if="docsLoading" indeterminate color="primary" class="q-mb-sm" />
                    <q-input v-model="docFilter" :label="$t('common.search')" outlined dense clearable class="q-mb-md">
                        <template #prepend><q-icon name="search" /></template>
                    </q-input>
                    <q-table
                        :rows="filteredDocuments"
                        :columns="docColumns"
                        row-key="DOCUMENT_ID"
                        dense flat bordered
                        :rows-per-page-options="[15, 30, 0]"
                        class="hm-doc-table"
                        @row-click="onDocumentSelect"
                    />
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.js'
import mainStore from '@/App.store'
import { addDefaultHrefToDynamicHomePlaceholders, normalizeDynamicHomeTemplate, stripHrefFromDynamicHomePlaceholders } from '@/helpers/commons/dynamicHomeHelper'
import { getRouteDocumentType } from '@/helpers/commons/documentRouteHelper'
import HomeManagementDynamicEditor from './detail/HomeManagementDynamicEditor.vue'
import { IHomeConfig, IDynamicHomeTemplate } from './HomeManagement'
import deepcopy from 'deepcopy'

const { t } = useI18n()
const store = mainStore()

const EMPTY_TEMPLATE: IDynamicHomeTemplate = { html: '', css: '', menuPlaceholders: [] }
const EMPTY_CONFIG: IHomeConfig = { roleName: null, type: 'default', template: deepcopy(EMPTY_TEMPLATE) }

const loading = ref(false)
const dirty = ref(false)
const roles = ref<{ name: string }[]>([])
const selectedRoleName = ref<string | null>(null)
const config = ref<IHomeConfig>(deepcopy(EMPTY_CONFIG))
const staticPages = ref<{ id: number; name: string }[]>([])
const staticPagesLoading = ref(false)
const documents = ref<any[]>([])
const docsLoading = ref(false)
const documentRouteType = ref('')
const documentDialogVisible = ref(false)
const docFilter = ref('')

const homeTypeIcons: Record<string, string> = {
    default: 'home',
    static: 'article',
    document: 'description',
    image: 'image',
    dynamic: 'code'
}

function selectType(value: string) {
    config.value.type = value as any
    dirty.value = true
}

function defaultImage(){
    return import.meta.env.VITE_PUBLIC_PATH + '/images/commons/knowage-homepage-default.png'
}

const homeTypeOptions = computed(() => [
    { label: t('managers.homeManagement.types.default'), value: 'default' },
    { label: t('managers.homeManagement.types.static'), value: 'static' },
    { label: t('managers.homeManagement.types.document'), value: 'document' },
    { label: t('managers.homeManagement.types.image'), value: 'image' },
    { label: t('managers.homeManagement.types.dynamic'), value: 'dynamic' }
])

const roleOptions = computed(() => [
    { label: t('managers.homeManagement.defaultRole'), value: null },
    ...roles.value.map((r) => ({ label: r.name, value: r.name }))
])

const isDefaultRole = computed(() => selectedRoleName.value === null)

const docColumns = computed(() => [
    { name: 'DOCUMENT_LABEL', field: 'DOCUMENT_LABEL', label: t('common.label'), sortable: true, align: 'left' as const },
    { name: 'DOCUMENT_NAME', field: 'DOCUMENT_NAME', label: t('common.name'), sortable: true, align: 'left' as const }
])

const filteredDocuments = computed(() => {
    if (!docFilter.value) return documents.value
    const q = docFilter.value.toLowerCase()
    return documents.value.filter((d) => (d.DOCUMENT_LABEL ?? '').toLowerCase().includes(q) || (d.DOCUMENT_NAME ?? '').toLowerCase().includes(q))
})

const staticPagePreviewUrl = computed(() => {
    if (!config.value.staticPage) return ''
    return import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/htmls/' + encodeURIComponent(config.value.staticPage)
})

const documentPreviewUrl = computed(() => {
    if (!config.value.documentLabel || !documentRouteType.value) return ''
    return import.meta.env.VITE_KNOWAGE_VUE_CONTEXT + '/' + documentRouteType.value + '/' + encodeURIComponent(config.value.documentLabel) + '?menu=false'
})

async function loadRoles() {
    loading.value = true
    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles')
        roles.value = res.data
    } finally {
        loading.value = false
    }
}

async function loadConfig(roleName: string | null) {
    loading.value = true
    dirty.value = false
    try {
        const id = roleName === null ? 'default' : encodeURIComponent(roleName)
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/homepage/' + id)
        config.value = { ...deepcopy(EMPTY_CONFIG), ...res.data }
        if (!config.value.template) config.value.template = deepcopy(EMPTY_TEMPLATE)
        else {
            config.value.template = normalizeDynamicHomeTemplate(config.value.template)
            if (config.value.template.html) {
                // Re-add href="#" to data-kn-menu anchors stripped before saving
                config.value.template.html = addDefaultHrefToDynamicHomePlaceholders(config.value.template.html)
            }
        }
    } catch {
        config.value = deepcopy(EMPTY_CONFIG)
        config.value.roleName = roleName
    } finally {
        loading.value = false
    }
}

async function loadStaticPages() {
    staticPagesLoading.value = true
    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/htmls')
        staticPages.value = res.data
    } finally {
        staticPagesLoading.value = false
    }
}

async function loadDocuments() {
    docsLoading.value = true
    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/listDocument')
        documents.value = res.data?.item ?? []
    } finally {
        docsLoading.value = false
    }
}

async function resolveDocumentRouteType() {
    const persistedRouteType = getRouteDocumentType(config.value)
    if (persistedRouteType) {
        documentRouteType.value = persistedRouteType
        config.value.documentRouteType = persistedRouteType
        return
    }

    documentRouteType.value = ''
    const documentIdentifier = config.value.documentId ?? config.value.documentLabel
    if (!documentIdentifier) return

    try {
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/' + documentIdentifier, { headers: { 'X-Disable-Errors': 'true' } })
        const resolvedRouteType = getRouteDocumentType(res.data)
        documentRouteType.value = resolvedRouteType
        if (resolvedRouteType) config.value.documentRouteType = resolvedRouteType
    } catch {
        documentRouteType.value = ''
    }
}

function onRoleChange(val: string | null) {
    loadConfig(val)
}

async function onDocumentSelect(_evt: any, row: any) {
    config.value.documentId = row.DOCUMENT_ID
    config.value.documentLabel = row.DOCUMENT_LABEL || row.DOCUMENT_NAME
    config.value.documentRouteType = ''
    await resolveDocumentRouteType()
    documentDialogVisible.value = false
    dirty.value = true
}

async function save() {
    try {
        config.value.roleName = selectedRoleName.value
        const payload = deepcopy(config.value)
        if (payload.type !== 'dynamic') delete payload.template
        else if (payload.template) {
            payload.template = normalizeDynamicHomeTemplate(payload.template)
            if (payload.template.html) {
                // Strip href from data-kn-menu anchors to avoid backend XSS URL validation
                payload.template.html = stripHrefFromDynamicHomePlaceholders(payload.template.html)
            }
        }
        if (payload.type !== 'static') delete payload.staticPage
        if (payload.type !== 'document') { delete payload.documentId; delete payload.documentLabel; delete payload.documentRouteType }
        if (payload.type !== 'image') delete payload.imageUrl
        await axios.post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/homepage', payload)
        store.setInfo({ title: t('managers.homeManagement.saveTitle'), msg: t('managers.homeManagement.saveSuccess') })
        dirty.value = false
    } catch {
        /* handled by interceptor */
    }
}

async function resetToDefault() {
    if (selectedRoleName.value === null) return
    config.value = deepcopy(EMPTY_CONFIG)
    config.value.roleName = selectedRoleName.value
    dirty.value = true
}

watch(
    () => config.value.type,
    (newType) => {
        if (newType === 'static' && staticPages.value.length === 0) loadStaticPages()
        if (newType === 'document' && documents.value.length === 0) loadDocuments()
    }
)

watch(
    () => [config.value.type, config.value.documentId, config.value.documentLabel, config.value.documentRouteType],
    ([type, documentId, documentLabel, persistedRouteType]) => {
        if (type !== 'document' || (!documentId && !documentLabel && !persistedRouteType)) {
            documentRouteType.value = ''
            return
        }

        void resolveDocumentRouteType()
    }
)

onMounted(async () => {
    await loadRoles()
    await loadConfig(null)
})
</script>

<style lang="scss" scoped>
.hm-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.hm-body {
    flex: 1;
    overflow-y: auto;
}

/* Settings card */
.hm-settings-card {
    border-radius: 0;

    &__header {
        background: linear-gradient(135deg, #f5f7ff 0%, #eef1fb 100%);
    }
}

/* Type-chip transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(6px);
}

/* Preview card */
.hm-preview-card {
    border-radius: 0;
}

.hm-preview-content {
    height: 480px;
    overflow: hidden;
    background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
    position: relative;
}

.hm-preview-iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
}

.hm-preview-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.hm-preview-empty {
    height: 100%;
    gap: 8px;
    opacity: 0.5;
}

/* Document table hover */
.hm-doc-table :deep(tbody tr) {
    cursor: pointer;

    &:hover td {
        background: rgba(33, 150, 243, 0.06);
    }
}
</style>
