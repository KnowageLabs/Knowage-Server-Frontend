<template>
    <q-dialog :model-value="visible" persistent @update:model-value="!$event && emit('close')">
        <q-card class="dossier-doc-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.crossNavigationManagement.selectDocument') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" data-test="close-button" @click="emit('close')">
                    <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
            <q-tabs v-if="tabs.length > 1" v-model="tab" dense no-caps align="left" class="dossier-doc-dialog__tabs">
                <q-tab v-for="item in tabs" :key="item.name" :name="item.name" :label="$t(item.label)" />
            </q-tabs>
            <q-separator />

            <q-tab-panels v-model="tab" class="col">
                <q-tab-panel name="documents" class="column no-wrap q-gutter-y-sm">
                    <q-input v-model="filter" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="kn-field-compact" data-test="document-search">
                        <template #prepend>
                            <q-icon name="search" size="16px" />
                        </template>
                    </q-input>
                    <q-table class="col dossier-doc-dialog__table" flat bordered dense virtual-scroll :rows="documents" :columns="documentColumns" row-key="DOCUMENT_ID" :filter="filter" :loading="documentsLoading" :pagination="{ rowsPerPage: 0 }" hide-pagination @row-click="(_event, row) => emit('apply', row)" />
                </q-tab-panel>

                <q-tab-panel name="views" class="q-pa-none">
                    <q-splitter v-model="splitter" class="fit">
                        <template #before>
                            <q-scroll-area class="fit">
                                <q-tree v-model:selected="selectedFolder" :nodes="folders" node-key="id" label-key="name" selected-color="primary" default-expand-all class="q-pa-sm" @update:selected="loadFolderViews" />
                            </q-scroll-area>
                        </template>
                        <template #after>
                            <div class="column no-wrap fit q-pa-md q-gutter-y-sm">
                                <q-input v-model="filter" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="kn-field-compact">
                                    <template #prepend>
                                        <q-icon name="search" size="16px" />
                                    </template>
                                </q-input>
                                <q-table class="col dossier-doc-dialog__table" flat bordered dense virtual-scroll :rows="views" :columns="viewColumns" row-key="id" :filter="filter" :loading="viewsLoading" :pagination="{ rowsPerPage: 0 }" hide-pagination @row-click="(_event, row) => emit('apply', row)" />
                            </div>
                        </template>
                    </q-splitter>
                </q-tab-panel>
            </q-tab-panels>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axios.js'

const props = defineProps<{ visible: boolean; workspace?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'apply', row: any): void }>()
const { t } = useI18n()

// The workspace links only saved views; document details links documents and views
const tabs = computed(() => (props.workspace ? [{ name: 'views', label: 'common.view' }] : [{ name: 'documents', label: 'common.document' }, { name: 'views', label: 'common.view' }]))
const tab = ref(props.workspace ? 'views' : 'documents')
const filter = ref('')
const splitter = ref(30)

const documents = ref<any[]>([])
const documentsLoading = ref(false)
const documentColumns = computed(() => [
    { name: 'label', label: t('common.label'), field: 'DOCUMENT_LABEL', align: 'left', sortable: true },
    { name: 'name', label: t('common.name'), field: 'DOCUMENT_NAME', align: 'left', sortable: true },
    { name: 'description', label: t('common.description'), field: 'DOCUMENT_DESCR', align: 'left', sortable: true }
])

const folders = ref<any[]>([])
const selectedFolder = ref<number | null>(null)
const views = ref<any[]>([])
const viewsLoading = ref(false)
const viewColumns = computed(() => [
    { name: 'label', label: t('common.label'), field: 'label', align: 'left', sortable: true },
    { name: 'description', label: t('common.description'), field: 'description', align: 'left', sortable: true }
])

onMounted(async () => {
    if (!props.workspace) loadDocuments()
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/repository').then((response) => {
        if (!response.data.id) response.data.id = 1
        folders.value = [response.data]
    })
})

async function loadDocuments() {
    documentsLoading.value = true
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/listDocument')
        .then((response) => (documents.value = response.data.item ?? []))
        .finally(() => (documentsLoading.value = false))
}

async function loadFolderViews(folderId: number | null) {
    if (!folderId || folderId == 1) return
    viewsLoading.value = true
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/repository/' + folderId)
        .then((response) => (views.value = response.data.content ?? []))
        .finally(() => (viewsLoading.value = false))
}
</script>

<style lang="scss" scoped>
.dossier-doc-dialog {
    width: 900px;
    max-width: 90vw;
    height: 560px;
    max-height: 85vh;
}

.dossier-doc-dialog__tabs {
    background-color: #fff;
}

.dossier-doc-dialog__table {
    min-height: 0;
}
</style>
