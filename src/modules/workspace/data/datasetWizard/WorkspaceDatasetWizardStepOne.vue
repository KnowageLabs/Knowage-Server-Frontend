<template>
    <div class="kn-ws-wizard-step">
        <div class="row items-center no-wrap kn-ws-wizard-file">
            <q-input :model-value="dataset.fileName" outlined dense readonly hide-bottom-space class="col" :label="$t('downloadsDialog.columns.fileName')" />
            <q-btn flat round icon="sym_o_upload_file" :aria-label="$t('workspace.uploadFile')" data-ws-wizard-upload @click="pickFile">
                <q-tooltip>{{ $t('workspace.uploadFile') }}</q-tooltip>
            </q-btn>
            <q-btn flat round icon="sym_o_download" :disable="!dataset.label" :aria-label="$t('workspace.downloadFile')" @click="downloadDatasetFile">
                <q-tooltip>{{ $t('workspace.downloadFile') }}</q-tooltip>
            </q-btn>
            <input ref="fileInput" type="file" accept=".csv, .xls, .xlsx" class="hidden" data-ws-wizard-file @change="uploadDatasetFile" />
        </div>

        <template v-if="dataset.fileType && dataset.fileType == 'CSV'">
            <div class="kn-ws-dialog-section-title">{{ $t('workspace.wizard.csvOptions') }}</div>
            <div class="kn-ws-wizard-grid">
                <q-select v-model="dataset.csvDelimiter" outlined dense emit-value map-options hide-bottom-space :options="descriptor.csvDelimiterCharacterTypes" option-label="name" option-value="value" :label="$t('managers.datasetManagement.ckanCsvDelimiter')" />
                <q-select v-model="dataset.csvQuote" outlined dense emit-value map-options hide-bottom-space :options="descriptor.csvQuoteCharacterTypes" option-label="name" option-value="value" :label="$t('managers.datasetManagement.ckanCsvQuote')" />
                <q-select v-model="dataset.csvEncoding" outlined dense emit-value map-options hide-bottom-space :options="descriptor.csvEncodingTypes" option-label="name" option-value="value" :label="$t('managers.datasetManagement.ckanCsvEncoding')" />
                <q-select v-model="dataset.dateFormat" outlined dense emit-value map-options hide-bottom-space :options="descriptor.dateFormatTypes" option-label="name" option-value="value" :label="$t('managers.datasetManagement.ckanDateFormat')" />
                <q-select v-model="dataset.timestampFormat" outlined dense emit-value map-options hide-bottom-space :options="descriptor.timestampFormatTypes" option-label="name" option-value="value" :label="$t('managers.datasetManagement.timestampFormat')" />
            </div>
        </template>
        <template v-if="dataset.fileType == 'XLS' || dataset.fileType == 'XLSX'">
            <div class="kn-ws-dialog-section-title">{{ $t('workspace.wizard.excelOptions') }}</div>
            <div class="kn-ws-wizard-grid">
                <q-input v-model.trim="dataset.skipRows" outlined dense hide-bottom-space type="number" :label="$t('managers.datasetManagement.ckanSkipRows')" />
                <q-input v-model.trim="dataset.limitRows" outlined dense hide-bottom-space type="number" :label="$t('managers.datasetManagement.ckanLimitRows')" />
                <q-input v-model.trim="dataset.xslSheetNumber" outlined dense hide-bottom-space type="number" :label="$t('managers.datasetManagement.ckanXslSheetNumber')" />
            </div>
        </template>
        <div v-if="!dataset.fileType" class="kn-ws-muted">{{ $t('workspace.wizard.uploadHint') }}</div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import axios, { AxiosResponse } from 'axios'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import descriptor from './WorkspaceDatasetWizardDescriptor.json'

// Ported from views/dataView/datasetWizard/WorkspaceDatasetWizardStepOne.vue (same upload and download requests).
// The wizard shares one dataset object between its steps, as before.
const props = defineProps<{ selectedDataset: any }>()
const emit = defineEmits<{ fileUploaded: [] }>()
const { t } = useI18n()
const store = mainStore()

const dataset = computed(() => props.selectedDataset)
const fileInput = ref<HTMLInputElement | null>(null)

function pickFile() {
    if (!fileInput.value) return
    fileInput.value.value = ''
    fileInput.value.click()
}

function uploadDatasetFile(event: Event) {
    const uploadedFile = (event.target as HTMLInputElement).files?.[0]
    if (!uploadedFile) return
    if (uploadedFile.name.includes(dataset.value.fileName)) {
        store.setError({ title: 'common.toast.errorTitle', msg: 'common.error.sameFileName' })
    } else {
        startUpload(uploadedFile)
    }
}

async function startUpload(uploadedFile: File) {
    const formData = new FormData()
    formData.append('file', uploadedFile)
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/selfservicedatasetupload/fileupload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryFYwjkDOpT85ZFN3L'
            }
        })
        .then((response: AxiosResponse<any>) => {
            store.setInfo({ title: 'common.uploading', msg: 'importExport.import.successfullyCompleted' })
            dataset.value.fileType = response.data.fileType
            dataset.value.fileName = response.data.fileName
            emit('fileUploaded')
        })
        .catch(() => {})
}

async function downloadDatasetFile() {
    const encodedLabel = encodeURI(dataset.value.label)
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/download/file?dsLabel=${encodedLabel}&type=${dataset.value.fileType}`, {
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'X-Disable-Errors': 'true'
            }
        })
        .then(
            (response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    store.setError({ title: 'common.error.downloading', msg: 'common.error.errorCreatingPackage' })
                } else {
                    store.setInfo({ title: 'common.toast.success' })
                    if (response.headers) {
                        downloadDirect(response.data, createCompleteFileName(response), response.headers['content-type'])
                    }
                }
            },
            (error) => store.setError({ title: 'common.error.downloading', msg: t(error) })
        )
}

function createCompleteFileName(response: AxiosResponse<any>) {
    const contentDisposition = response.headers['content-disposition']
    const fileAndExtension = contentDisposition.match(/filename[^;\n=]*=((['"]).*?\2|[^;\n]*)/i)[1]
    return fileAndExtension.replaceAll('"', '')
}
</script>
