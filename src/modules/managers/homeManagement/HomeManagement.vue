<template>
    <div class="kn-page">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.homeManagement.title') }}</q-toolbar-title>
            <q-btn v-if="!isDefaultRole" flat dense round icon="fas fa-undo" :title="$t('managers.homeManagement.resetToDefault')" class="q-mr-sm" @click="resetToDefault" />
            <q-btn flat dense round icon="save" :disable="!dirty" :title="$t('common.save')" @click="save" />
        </q-toolbar>

        <q-linear-progress v-if="loading" indeterminate color="primary" />

        <div class="q-pa-md">
            <!-- Row 1: Role + Type -->
            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-6">
                    <q-select
                        v-model="selectedRoleId"
                        :options="roleOptions"
                        :label="$t('managers.homeManagement.role')"
                        emit-value
                        map-options
                        filled
                        @update:model-value="onRoleChange"
                    />
                </div>
                <div class="col-6">
                    <q-select
                        v-model="config.type"
                        :options="homeTypeOptions"
                        :label="$t('managers.homeManagement.homeType')"
                        emit-value
                        map-options
                        filled
                        @update:model-value="dirty = true"
                    />
                </div>
            </div>

            <!-- Row 2: Type-specific config + preview -->
            <div v-if="config.type !== 'dynamic'" class="row q-col-gutter-md">
                <!-- Config panel -->
                <div class="col-6">
                    <!-- default: nothing to configure -->
                    <div v-if="config.type === 'default'" class="text-grey-6 q-pa-md">
                        {{ $t('managers.homeManagement.defaultDescription') }}
                    </div>

                    <!-- static page -->
                    <q-select
                        v-if="config.type === 'static'"
                        v-model="config.staticPage"
                        :options="staticPages"
                        :loading="staticPagesLoading"
                        option-label="name"
                        option-value="name"
                        emit-value
                        map-options
                        :label="$t('managers.homeManagement.staticPage')"
                        filled
                        @update:model-value="dirty = true"
                    />

                    <!-- document -->
                    <div v-if="config.type === 'document'" class="row items-center q-col-gutter-sm">
                        <div class="col">
                            <q-input
                                v-model="config.documentLabel"
                                :label="$t('managers.homeManagement.document')"
                                filled
                                readonly
                                :placeholder="$t('managers.homeManagement.selectDocument')"
                            />
                        </div>
                        <div class="col-auto">
                            <q-btn flat round dense icon="search" @click="documentDialogVisible = true" />
                        </div>
                    </div>

                    <!-- image -->
                    <q-input
                        v-if="config.type === 'image'"
                        v-model="config.imageUrl"
                        :label="$t('managers.homeManagement.imageUrl')"
                        :placeholder="$t('managers.homeManagement.imageUrlPlaceholder')"
                        filled
                        clearable
                        @update:model-value="dirty = true"
                    />
                </div>

                <!-- Preview panel -->
                <div class="col-6">
                    <div class="preview-panel">
                        <div class="preview-panel__header text-caption text-uppercase text-grey-7 q-mb-sm">
                            {{ $t('managers.homeManagement.preview') }}
                        </div>
                        <div class="preview-panel__content">
                            <div v-if="config.type === 'default'" class="preview-default column items-center justify-center text-grey-5">
                                <q-icon name="home" size="64px" />
                                <div>{{ $t('managers.homeManagement.types.default') }}</div>
                            </div>
                            <iframe v-else-if="config.type === 'static' && staticPagePreviewUrl" :src="staticPagePreviewUrl" class="preview-iframe" />
                            <div v-else-if="config.type === 'static'" class="preview-empty column items-center justify-center text-grey-5">
                                <q-icon name="article" size="48px" />
                                <div>{{ $t('managers.homeManagement.selectStaticPage') }}</div>
                            </div>
                            <img v-else-if="config.type === 'image' && config.imageUrl" :src="config.imageUrl" class="preview-image" />
                            <div v-else-if="config.type === 'image'" class="preview-empty column items-center justify-center text-grey-5">
                                <q-icon name="image" size="48px" />
                                <div>{{ $t('managers.homeManagement.imageUrlPlaceholder') }}</div>
                            </div>
                            <iframe v-else-if="config.type === 'document' && documentPreviewUrl" :src="documentPreviewUrl" class="preview-iframe" />
                            <div v-else-if="config.type === 'document'" class="preview-empty column items-center justify-center text-grey-5">
                                <q-icon name="description" size="48px" />
                                <div>{{ $t('managers.homeManagement.selectDocument') }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dynamic editor (full width) -->
            <HomeManagementDynamicEditor
                v-if="config.type === 'dynamic'"
                v-model="config.template"
                :roles="roles"
                :current-role-id="selectedRoleId"
                @update:model-value="dirty = true"
            />
        </div>

        <!-- Document picker dialog -->
        <q-dialog v-model="documentDialogVisible" persistent>
            <q-card style="min-width: 700px; max-width: 90vw">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ $t('managers.homeManagement.selectDocument') }}</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section>
                    <q-linear-progress v-if="docsLoading" indeterminate color="primary" class="q-mb-sm" />
                    <q-input v-model="docFilter" :label="$t('common.search')" filled clearable class="q-mb-sm">
                        <template #prepend><q-icon name="search" /></template>
                    </q-input>
                    <q-table
                        :rows="filteredDocuments"
                        :columns="docColumns"
                        row-key="DOCUMENT_ID"
                        dense
                        flat
                        bordered
                        :rows-per-page-options="[15, 30, 0]"
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
import HomeManagementDynamicEditor from './detail/HomeManagementDynamicEditor.vue'
import { IHomeConfig, IDynamicHomeTemplate } from './HomeManagement'
import deepcopy from 'deepcopy'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const store = mainStore()

const EMPTY_TEMPLATE: IDynamicHomeTemplate = { html: '', css: '', menuPlaceholders: [] }
const EMPTY_CONFIG: IHomeConfig = { roleId: null, type: 'default', template: deepcopy(EMPTY_TEMPLATE) }

const loading = ref(false)
const dirty = ref(false)
const roles = ref<{ id: number; name: string }[]>([])
const selectedRoleId = ref<number | null>(null)
const config = ref<IHomeConfig>(deepcopy(EMPTY_CONFIG))
const staticPages = ref<{ id: number; name: string }[]>([])
const staticPagesLoading = ref(false)
const documents = ref<any[]>([])
const docsLoading = ref(false)
const documentDialogVisible = ref(false)
const docFilter = ref('')
const router = useRouter();

const homeTypeOptions = computed(() => [
    { label: t('managers.homeManagement.types.default'), value: 'default' },
    { label: t('managers.homeManagement.types.static'), value: 'static' },
    { label: t('managers.homeManagement.types.document'), value: 'document' },
    { label: t('managers.homeManagement.types.image'), value: 'image' },
    { label: t('managers.homeManagement.types.dynamic'), value: 'dynamic' }
])

const roleOptions = computed(() => [
    { label: t('managers.homeManagement.defaultRole'), value: null },
    ...roles.value.map((r) => ({ label: r.name, value: r.id }))
])

const isDefaultRole = computed(() => selectedRoleId.value === null)

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
    if (!config.value.documentLabel) return ''
    return import.meta.env.VITE_KNOWAGE_VUE_CONTEXT + '/dashboard/' + encodeURIComponent(config.value.documentLabel) + "&menu=false"
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

async function loadConfig(roleId: number | null) {
    loading.value = true
    dirty.value = false
    try {
        const id = roleId === null ? 'default' : roleId
        const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/homepage/' + id)
        config.value = { ...deepcopy(EMPTY_CONFIG), ...res.data }
        if (!config.value.template) config.value.template = deepcopy(EMPTY_TEMPLATE)
        else if (config.value.template.html) {
            // Re-add href="#" to data-kn-menu anchors stripped before saving
            config.value.template.html = config.value.template.html.replace(/(<[a-zA-Z][a-zA-Z0-9]*\s[^>]*data-kn-menu(?![^>]*\shref=)[^>]*)>/g, '$1 href="#">')
        }
    } catch {
        config.value = deepcopy(EMPTY_CONFIG)
        config.value.roleId = roleId
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

function onRoleChange(val: number | null) {
    loadConfig(val)
}

function onDocumentSelect(_evt: any, row: any) {
    config.value.documentId = row.DOCUMENT_ID
    config.value.documentLabel = row.DOCUMENT_LABEL || row.DOCUMENT_NAME
    documentDialogVisible.value = false
    dirty.value = true
}

async function save() {
    try {
        config.value.roleId = selectedRoleId.value
        const payload = deepcopy(config.value)
        if (payload.type !== 'dynamic') delete payload.template
        else if (payload.template?.html) {
            // Strip href from data-kn-menu anchors to avoid backend XSS URL validation
            payload.template.html = payload.template.html.replace(/(<[a-zA-Z][a-zA-Z0-9]*\s[^>]*data-kn-menu[^>]*)\shref="[^"]*"/g, '$1')
        }
        if (payload.type !== 'static') delete payload.staticPage
        if (payload.type !== 'document') { delete payload.documentId; delete payload.documentLabel }
        if (payload.type !== 'image') delete payload.imageUrl
        await axios.post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/homepage', payload)
        store.setInfo({ title: t('managers.homeManagement.saveTitle'), msg: t('managers.homeManagement.saveSuccess') })
        dirty.value = false
    } catch {
        /* handled by interceptor */
    }
}

async function resetToDefault() {
    if (selectedRoleId.value === null) return
    config.value = deepcopy(EMPTY_CONFIG)
    config.value.roleId = selectedRoleId.value
    dirty.value = true
}

watch(
    () => config.value.type,
    (newType) => {
        if (newType === 'static' && staticPages.value.length === 0) loadStaticPages()
        if (newType === 'document' && documents.value.length === 0) loadDocuments()
    }
)

onMounted(async () => {
    await loadRoles()
    await loadConfig(null)
})
</script>

<style lang="scss" scoped>
.preview-panel {
    &__header {
        font-weight: 600;
    }
    &__content {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        height: 380px;
        overflow: hidden;
        background: #fafafa;
    }
    .preview-iframe {
        width: 100%;
        height: 100%;
        border: 0;
    }
    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .preview-default,
    .preview-empty {
        height: 100%;
    }
}
</style>
