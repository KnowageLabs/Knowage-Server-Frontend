<template>
    <Dialog :visible="dialogVisible" :header="$t('managers.crossNavigationManagement.selectDocument')" :modal="true" :closable="false" class="p-fluid dossierDocDialog kn-dialog--toolbar--primary q-pa-none" style="width: 60%">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('managers.crossNavigationManagement.selectDocument') }}
                </template>
                <template #end>
                    <Button icon="pi pi-times" class="kn-button p-button-text p-button-rounded" @click="closeDialog" />
                </template>
            </Toolbar>
        </template>
        <q-tabs v-model="tab" dense align="left" class="text-primary" :breakpoint="0">
            <q-tab v-for="tabLabel in tabLabels" :key="tabLabel.name" :name="tabLabel.name" :label="tabLabel.label" />
        </q-tabs>
        <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="views" style="height: 400px">
                <q-splitter v-model="splitterModel" style="height: 100%">
                    <template v-slot:before>
                        <div class="q-pa-md">
                            <q-tree :filter="docFilter" :nodes="folders" :default-expand-all="true" node-key="id" label-key="name" selected-color="primary" v-model:selected="selected" @update:selected="getFolderDocuments" default-expand-all />
                        </div>
                    </template>

                    <template v-slot:after>
                        <q-input v-model="docFilter" label="Search" :dense="true" class="q-mb-sm q-ml-xs">
                            <template v-slot:prepend>
                                <q-icon name="search" />
                            </template>
                        </q-input>
                        <q-table class="q-ml-xs" flat :loading="tableLoading" bordered dense :rows="rows" :columns="columns" row-key="name" :pagination="{ rowsPerPage: 0 }" style="height: 320px" @row-click="handleSelect" />
                    </template>
                </q-splitter>
            </q-tab-panel>
            <q-tab-panel name="documents" style="max-height: 400px">
                <q-input v-model="docFilter" label="Search" :dense="true" class="q-mb-sm">
                    <template v-slot:prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <q-table flat :filter="docFilter" :loading="docTableLoading" bordered dense :rows="documents" row-key="DOCUMENT_ID" :columns="docsColumns" :pagination="{ rowsPerPage: 0 }" style="height: 330px" @row-click="handleSelect"> </q-table>
            </q-tab-panel>
        </q-tab-panels>
    </Dialog>
</template>

<script lang="ts" setup>
import Dialog from 'primevue/dialog'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axios.js'

defineProps({
    dialogVisible: Boolean
})
const emit = defineEmits(['close', 'apply'])
const route = useRoute()

const tab = ref('')
const splitterModel = ref(30)
const folders = ref([{ id: 1, parentId: null, name: 'root', description: 'root', progr: -1, children: [] }])
const selected = ref([])
const selectedDoc = ref([])
const columns = [
    { name: 'label', required: true, label: 'Label', align: 'left', field: 'label', sortable: true },
    { name: 'description', label: 'Description', align: 'left', field: 'description', sortable: true }
]
const docFilter = ref('')
const docsColumns = [
    { name: 'label', required: true, label: 'Label', align: 'left', field: 'DOCUMENT_LABEL', sortable: true },
    { name: 'name', required: true, label: 'name', align: 'left', field: 'DOCUMENT_NAME', sortable: true },
    { name: 'descr', label: 'Description', align: 'left', field: 'DOCUMENT_DESCR', sortable: true }
]
const tabLabels = ref([{ name: 'views', label: 'View' }])
const rows = ref([])
const documents = ref([])

onMounted(async () => {
    await loadAllDocs()
    if (!route.matched.some((item) => item.path === '/workspace')) {
        tabLabels.value.unshift({ name: 'documents', label: 'Document' })
        tab.value = 'documents'
    } else tab.value = 'views'

    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/repository')
        .then((response) => {
            if (!response.data.id) response.data.id = 1
            folders.value = [response.data]
        })
        .finally(() => console.log('asd'))
})

const tableLoading = ref(false)
function getFolderDocuments(folderId) {
    if (folderId && folderId != 1) {
        tableLoading.value = true
        axios
            .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/repository/' + folderId)
            .then((response) => {
                rows.value = response.data.content
            })
            .finally(() => (tableLoading.value = false))
    }
}
const docTableLoading = ref(false)
async function loadAllDocs() {
    docTableLoading.value = true
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/listDocument')
        .then((response) => {
            documents.value = response.data.item
        })
        .finally(() => (docTableLoading.value = false))
}

function handleSelect(e, row) {
    emit('apply', row)
    selectedDoc.value = []
}

function closeDialog() {
    emit('close')
}
</script>
<style lang="scss">
.dossierDocDialog.p-dialog {
    .p-dialog-content {
        padding: 0 !important;
    }
}
</style>
