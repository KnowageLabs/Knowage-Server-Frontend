<template>
    <WorkspaceDialog :model-value="visible" :title="$t('workspace.myData.wizardTitle')" name="dataset-wizard" size="lg" persistent @update:model-value="!$event && emit('closeDialog')">
        <template #header>
            <span class="kn-ws-muted" data-ws-wizard-step>{{ wizardStep }} / 4 · {{ $t('workspace.wizard.steps.' + STEP_KEYS[wizardStep - 1]) }}</span>
        </template>
        <WizardStepOne v-if="wizardStep === 1" :selected-dataset="dataset" @file-uploaded="onFileUpload" />
        <WizardStepTwo v-if="wizardStep === 2" :selected-dataset="dataset" />
        <WizardStepThree v-if="wizardStep === 3" :grid-for-preview="gridForPreview" />
        <WizardStepFour v-if="wizardStep === 4" :selected-dataset="dataset" />
        <template #actions>
            <q-btn flat no-caps :label="$t('common.cancel')" data-ws-wizard-cancel @click="emit('closeDialog')" />
            <q-space />
            <q-btn v-if="wizardStep > 1" flat no-caps :label="$t('common.back')" data-ws-wizard-back @click="wizardStep--" />
            <q-btn unelevated no-caps color="primary" :label="wizardStep === 4 ? $t('common.save') : $t('common.next')" :disable="!fileUploaded || (wizardStep === 4 && !detailsValid)" data-ws-wizard-next @click="next" />
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios, { AxiosResponse } from 'axios'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import { alphanumericNoSpaces } from '@/helpers/commons/regexHelper'
import WorkspaceDialog from '../../common/WorkspaceDialog.vue'
import WizardStepOne from './WorkspaceDatasetWizardStepOne.vue'
import WizardStepTwo from './WorkspaceDatasetWizardStepTwo.vue'
import WizardStepThree from './WorkspaceDatasetWizardStepThree.vue'
import WizardStepFour from './WorkspaceDatasetWizardStepFour.vue'

// Ported from views/dataView/datasetWizard: same 4 steps, fields, validation and requests (the urlencoded
// testDataSet and save posts with the hand-built transformRequest). Step 4 says "Save" (spec 8.3).
const props = defineProps<{ selectedDataset: any; visible: boolean }>()
const emit = defineEmits<{ closeDialog: []; closeDialogAndReload: [] }>()
const { t } = useI18n()
const store = mainStore()

const dataset = ref<any>({})
const gridForPreview = ref<any>({})
const datasetColumns = ref<any>([])
const editingDatasetFile = ref(false)
const newFileUploaded = ref(false)
const fileUploaded = ref(false)
const wizardStep = ref(1)
const STEP_KEYS = ['file', 'columns', 'preview', 'details']

// step 4: Save waits for the required fields (the fields show their errors only once touched)
const detailsValid = computed(() => !!dataset.value.name?.trim() && (!dataset.value.persist || (!!dataset.value.tableName && alphanumericNoSpaces.test(dataset.value.tableName))))

const urlencoded = (obj: any) => {
    const str = [] as any
    for (const p in obj) str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
    return str.join('&')
}

function onFileUpload() {
    fileUploaded.value = true
    newFileUploaded.value = true
}

async function getSelectedDataset() {
    axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/dataset/id/${props.selectedDataset.id}`)
        .then((response: AxiosResponse<any>) => {
            dataset.value = response.data[0] ? { ...response.data[0] } : {}
            initializeDatasetWizard(dataset.value, true)
        })
        .catch(() => {})
}

function initializeDatasetWizard(source: any, isEdited: boolean) {
    const ds = dataset.value
    editingDatasetFile.value = isEdited
    isEdited ? (fileUploaded.value = true) : (fileUploaded.value = false)
    ds.csvEncoding = source != undefined ? source.csvEncoding : 'UTF-8'
    ds.csvDelimiter = source != undefined ? source.csvDelimiter : ','
    ds.csvQuote = source != undefined ? source.csvQuote : '"'
    ds.skipRows = source != undefined ? source.skipRows : null
    ds.dateFormat = source != undefined && source.dateFormat != undefined ? source.dateFormat : 'dd/MM/yyyy'
    ds.timestampFormat = source != undefined && source.timestampFormat != undefined ? source.timestampFormat : 'dd/MM/yyyy HH:mm:ss'
    ds.limitRows = source != undefined ? source.limitRows : null
    ds.xslSheetNumber = source != undefined ? source.xslSheetNumber : 1
    ds.catTypeVn = source != undefined ? source.catTypeVn : null
    ds.catTypeId = source != undefined ? source.catTypeId : null
    ds.id = source != undefined ? source.id : ''
    ds.label = source != undefined ? source.label : ''
    ds.name = source != undefined ? source.name : ''
    ds.description = source != undefined ? source.description : ''
    ds.meta = source != undefined ? source.meta : []
    ds.persist = source != undefined && source.isPersisted ? source.isPersisted : false
    ds.tableName = source != undefined && source.persistTableName ? source.persistTableName : ''
}

function load() {
    wizardStep.value = 1
    dataset.value = props.selectedDataset ?? {}
    dataset.value.id ? getSelectedDataset() : initializeDatasetWizard(undefined, false)
}
watch(() => props.selectedDataset, load)
load()

function submitStepOne() {
    const ds = dataset.value
    const params = {} as any
    params.SBI_EXECUTION_ID = -1
    params.isTech = false
    params.showOnlyOwner = true
    params.showDerivedDataset = false
    ds.type = 'File'
    ds.exportToHdfs = false
    ds.limitPreview = true
    ds.tablePrefix = ''
    ds.persist ? '' : (ds.persist = false)
    ds.tableName ? '' : (ds.tableName = '')
    ds.skipRows == null ? (ds.skipRows = '') : ''
    ds.limitRows == null ? (ds.limitRows = '') : ''
    ds.xslSheetNumber == null ? (ds.xslSheetNumber = '') : ''
    ds.meta = JSON.stringify(ds.meta)
    newFileUploaded.value ? (ds.fileUploaded = true) : ''
    axios({
        method: 'POST',
        url: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/selfservicedataset/testDataSet',
        data: ds,
        params: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Disable-Errors': 'true' },
        transformRequest: urlencoded
    })
        .then((response: AxiosResponse<any>) => {
            if (!response.data.errors) {
                gridForPreview.value = response.data.gridForPreview
                ds.meta = response.data.meta
                datasetColumns.value = response.data.datasetColumns
                wizardStep.value++
            } else {
                ds.meta = []
            }
        })
        .catch((error: any) => {
            ds.meta = []
            error.message == 'error.mesage.description.data.set.parsing.error' ? store.setError({ title: 'common.toast.errorTitle', msg: 'workspace.myData.parseError' }) : store.setError({ title: 'common.toast.errorTitle', msg: t(error.message) })
        })
}

function submitStepTwo() {
    const ds = dataset.value
    ds.isPublicDS = false
    ds.datasetMetadata = {}
    ds.datasetMetadata.version = 1
    ds.datasetMetadata.dataset = []
    ds.datasetMetadata.columns = []
    ds.datasetMetadata.dataset = [...ds.meta.dataset]
    ds.datasetMetadata.columns = [...ds.meta.columns]
    const c = ds.datasetMetadata.columns
    for (let i = 0; i < c.length; i++) {
        delete c[i].columnView
        delete c[i].pvalueView
        delete c[i].pnameView
        delete c[i].dsMetaValue
    }
    const d = ds.datasetMetadata.dataset
    for (let i = 0; i < d.length; i++) {
        delete d[i].pvalueView
        delete d[i].pnameView
    }
    ds.datasetMetadata = JSON.stringify(ds.datasetMetadata)
    ds.limitPreview = true
    ds.page = 1
    ds.start = ''
    ds.page = 10

    if (editingDatasetFile.value == true && ds.fileUploaded == true) {
        ds.label = ''
    }
    wizardStep.value++
}

function submitStepThree() {
    wizardStep.value++
}

async function submitStepFour() {
    const dsToSend = { ...dataset.value }
    dsToSend.isPublicDS = false
    dsToSend.meta = dataset.value.datasetMetadata
    dsToSend.fileUploaded = fileUploaded.value
    delete dsToSend['datasetMetadata']
    const d = new Date()
    const label = 'ds__' + (d.getTime() % 10000000)
    if (dsToSend.label === '') {
        dsToSend.label = label
    }
    const params = {} as any
    params.showDerivedDataset = false
    params.SBI_EXECUTION_ID = -1
    params.isTech = false
    params.showOnlyOwner = true

    await axios({
        method: 'POST',
        url: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/selfservicedataset/save',
        data: dsToSend,
        params: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Disable-Errors': 'true' },
        transformRequest: urlencoded
    })
        .then(() => {
            emit('closeDialogAndReload')
        })
        .catch(() => {
            store.setError({ title: 'common.toast.errorTitle', msg: 'common.error.uploading' })
        })
}

function next() {
    if (wizardStep.value === 1) submitStepOne()
    else if (wizardStep.value === 2) submitStepTwo()
    else if (wizardStep.value === 3) submitStepThree()
    else if (wizardStep.value === 4) submitStepFour()
}
</script>
