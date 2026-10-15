<template>
    <q-dialog :model-value="visible" persistent :maximized="$q.screen.lt.md" @update:model-value="!$event && close()">
        <q-card class="dossier-designer-dialog column no-wrap" data-test="dossier-designer-dialog">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('documentExecution.dossier.designer.title') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" data-test="close-button" @click="close">
                    <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>

            <DossierDesigner ref="designer" class="col" :document="document" mode="workspace" @state="state = $event" />

            <q-separator />
            <q-card-actions align="right">
                <q-btn flat no-caps :label="$t('common.close')" data-test="cancel-button" @click="close" />
                <span>
                    <q-btn unelevated no-caps color="primary" :label="$t('common.save')" :disable="!state.valid" data-test="save-button" @click="save(false)" />
                    <q-tooltip v-if="state.invalidReason" :delay="500">{{ $t(state.invalidReason) }}</q-tooltip>
                </span>
                <q-btn unelevated no-caps color="primary" :label="$t('documentExecution.dossier.designerDialog.saveAndRun')" :disable="!state.valid" class="q-ml-sm" data-test="save-run-button" @click="save(true)" />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <DashboardControllerSaveDialog v-if="saveDialogVisible" :visible="saveDialogVisible" @save="createDocument" @close="saveDialogVisible = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import axios from '@/axios.js'
import mainStore from '@/App.store'
import DashboardControllerSaveDialog from '@/modules/documentExecution/dashboard/DashboardControllerSaveDialog.vue'
import DossierDesigner from './DossierDesigner.vue'
import type { iDossierDesignerState } from './DossierTemplate'

const props = defineProps<{ visible: boolean; selectedDocument: any | null }>()
const emit = defineEmits<{ (e: 'close', payload: { refreshHistory: boolean }): void }>()

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const designer = ref<InstanceType<typeof DossierDesigner> | null>(null)
const document = ref<any | null>(props.selectedDocument ?? null)
const state = ref<iDossierDesignerState>({ dirty: false, valid: false, invalidReason: null })
const saveDialogVisible = ref(false)
let runAfterSave = false

function close() {
    if (!state.value.dirty) {
        emit('close', { refreshHistory: false })
        return
    }
    $q.dialog({ title: t('documentExecution.dossier.designerDialog.closeTitle'), message: t('documentExecution.dossier.designerDialog.closeConfirm'), cancel: true, persistent: true }).onOk(() => emit('close', { refreshHistory: false }))
}

async function save(run: boolean) {
    runAfterSave = run
    // A new dossier gets a name and a label first
    if (!document.value?.id) {
        saveDialogVisible.value = true
        return
    }
    await saveTemplate(document.value)
}

async function createDocument(newDocument: { name: string; label: string; description?: string }) {
    const formattedAnalysis = {
        document: { name: newDocument.name, label: newDocument.label, description: newDocument.description, type: 'DOSSIER' },
        action: 'DOC_SAVE',
        updateFromWorkspace: false,
        customData: { templateContent: {} }
    }
    store.setLoading(true)
    const created = await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/saveDocument/', formattedAnalysis, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: any) => response.data)
        .catch((error: any) => {
            store.setError({ title: t('common.toast.createTitle'), msg: error?.message ?? error })
            return null
        })
        .finally(() => store.setLoading(false))
    if (!created) return

    saveDialogVisible.value = false
    document.value = { ...created }
    store.setInfo({ title: t('common.toast.createTitle'), msg: t('common.toast.success') })
    await saveTemplate(document.value)
}

async function saveTemplate(target: any) {
    const result = await designer.value?.save(target)
    if (!result?.ok) return
    store.setInfo({ title: t('common.toast.success'), msg: t('common.toast.uploadSuccess') })
    emit('close', { refreshHistory: true })
    if (runAfterSave) router.push(`/dossier/${target.label}`)
}
</script>

<style lang="scss" scoped>
.dossier-designer-dialog {
    width: 90vw;
    max-width: 1400px;
    height: 85vh;
}

.q-dialog__inner--maximized .dossier-designer-dialog {
    width: 100%;
    height: 100%;
    max-width: none;
}
</style>
