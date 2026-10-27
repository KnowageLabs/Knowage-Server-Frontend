<template>
    <q-card data-tour-id="scheduler-documents">
        <q-card-section class="scheduler-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('common.documents') }}</div>
            <q-btn flat dense no-caps size="sm" color="accent" icon="add" :label="$t('managers.scheduler.addDocuments')" class="q-ma-none q-py-none q-px-xs" data-test="add-documents-button" @click="emit('add')" />
        </q-card-section>
        <q-separator />

        <q-card-section class="q-py-sm">
            <q-banner v-if="deletedDocuments.length > 0" dense rounded class="bg-warning q-mb-sm">
                <template #avatar><q-icon name="warning" /></template>
                {{ $t('managers.scheduler.deletedDocumentsWarning') }}
            </q-banner>
            <div v-if="documents.length === 0" class="text-grey-7 q-py-sm">{{ $t('managers.scheduler.noDocumentsInfo') }}</div>
            <div v-for="(document, index) in documents" :key="index" class="scheduler-documents__row row items-center no-wrap" data-test="document-row">
                <q-icon :name="document.deleted ? 'error' : 'description'" :class="document.deleted ? 'text-negative' : 'scheduler-documents__node-icon'" size="20px" class="q-mr-sm" />
                <div class="col scheduler-documents__name">
                    <div class="ellipsis">
                        <span class="text-weight-medium">{{ document.name }}</span>
                        <span v-if="folderPaths[document.name]" class="text-grey-7 text-caption q-ml-sm">{{ folderPaths[document.name] }}</span>
                    </div>
                    <div v-if="document.condensedParameters?.trim()" class="text-grey-7 text-caption ellipsis">{{ document.condensedParameters }}</div>
                </div>
                <q-icon v-if="document.parameters?.length > 0 && !parameterValuesSet(document.parameters)" name="warning" color="warning" size="20px" class="q-mr-sm" :data-test="'warning-icon-' + document.name">
                    <q-tooltip :delay="500">{{ $t('managers.scheduler.parametersWarningTooltip') }}</q-tooltip>
                </q-icon>
                <q-btn v-if="document.parameters?.length > 0" flat dense no-caps size="sm" icon="tune" :label="$t('managers.scheduler.parametersCount', { n: document.parameters.length })" class="kn-editor-action q-mr-xs" @click="openDocumentParameterDialog(document, index)" />
                <q-btn flat round dense size="sm" icon="delete" class="kn-editor-action" @click="removeDocumentConfirm(index)">
                    <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                </q-btn>
            </div>
        </q-card-section>

        <SchedulerDocumentParameterDialog :visible="documentParameterDialogVisible" :prop-parameters="selectedDocument?.parameters" :roles="roles" :deleted-params="deletedParams" :document-label="documentLabel" @close="closeDocumentParameterDialog" @set-parameters="onParametersSet" />
    </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { iFile } from '../Scheduler'
import { condensedParameters } from '../schedulerHelpers'
import { loadDocumentData } from './schedulerDocumentData'
import SchedulerDocumentParameterDialog from './SchedulerDocumentParameterDialog.vue'

const props = defineProps<{ documents: any[]; files: iFile[] }>()
const emit = defineEmits<{ (e: 'add'): void; (e: 'loading', value: boolean): void }>()

const { t } = useI18n()
const $q = useQuasar()

const selectedDocument = ref<any>(null)
const selectedIndex = ref(-1)
const documentParameterDialogVisible = ref(false)
const roles = ref<any[]>([])
const deletedParams = ref<any[]>([])
const documentLabel = ref('')

const deletedDocuments = computed(() => props.documents.filter((document: any) => document.deleted))

const folderPaths = computed(() => {
    const paths = {} as Record<string, string>
    props.files.forEach((file: any) => file.biObjects?.forEach((document: any) => (paths[document.label] = file.path)))
    return paths
})

function parameterValuesSet(parameters: any[]) {
    return parameters.every((parameter: any) => !!parameter.value)
}

function removeDocumentConfirm(documentIndex: number) {
    $q.dialog({ title: t('common.toast.deleteTitle'), message: t('common.toast.deleteMessage'), cancel: true, persistent: true }).onOk(() => props.documents.splice(documentIndex, 1))
}

async function loadParametersData(document: any) {
    emit('loading', true)
    try {
        if (document?.parametersTouched) return
        const data = await loadDocumentData(document)
        roles.value = data.roles
        deletedParams.value = data.deletedParams
        selectedDocument.value = { name: data.label, nameTitle: data.tempDocument.label, description: condensedParameters(document.parameters ?? data.apiParameters), parameters: document.parameters }
        selectedDocument.value.parameters?.forEach((el: any) => (el.role = roles.value[0]?.role))
    } finally {
        emit('loading', false)
    }
}

async function openDocumentParameterDialog(document: any, index: number) {
    selectedDocument.value = document
    selectedIndex.value = index
    await loadParametersData(document)
    documentLabel.value = selectedDocument.value.name
    documentParameterDialogVisible.value = true
}

function closeDocumentParameterDialog() {
    emit('loading', false)
    selectedDocument.value = null
    documentParameterDialogVisible.value = false
}

// The old table replaced the first row with the same name; with the same document twice it changed the wrong row
function onParametersSet(parameters: any[]) {
    selectedDocument.value.parameters = parameters
    selectedDocument.value.condensedParameters = condensedParameters(parameters)
    selectedDocument.value.parametersTouched = true
    if (selectedIndex.value !== -1) props.documents[selectedIndex.value] = selectedDocument.value
    documentParameterDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.scheduler-documents__node-icon {
    color: var(--kn-editor-list-icon-color);
}

.scheduler-documents__row {
    min-height: 44px;
    padding: 4px 0;
    border-bottom: 1px solid #eeeeee;

    &:last-child {
        border-bottom: 0;
    }
}

.scheduler-documents__name {
    min-width: 0;
}
</style>
