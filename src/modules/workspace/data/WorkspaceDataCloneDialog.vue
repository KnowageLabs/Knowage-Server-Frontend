<template>
    <WorkspaceDialog :model-value="modelValue" :title="$t('workspace.myData.clonedDatasetWizard')" name="clone-dataset" size="md" :dialog-class="dialogClass" @update:model-value="emit('update:modelValue', $event)" @show="loadDataset">
        <div class="kn-ws-dialog-form">
            <q-input v-model.trim="dataset.label" outlined dense autofocus hide-bottom-space :maxlength="LABEL_MAX" :label="$t('workspace.label') + ' *'" :rules="[required('workspace.label'), pattern]" />
            <q-input v-model.trim="dataset.name" outlined dense hide-bottom-space :maxlength="NAME_MAX" :label="$t('common.name') + ' *'" :rules="[required('common.name'), pattern]" />
            <q-input v-model.trim="dataset.description" outlined dense type="textarea" rows="3" hide-bottom-space class="kn-ws-dialog-form__full" :maxlength="DESCRIPTION_MAX" :label="$t('common.description')" />
        </div>
        <template #actions>
            <q-btn v-close-popup flat no-caps :label="$t('common.cancel')" />
            <q-btn unelevated no-caps color="primary" :label="$t('common.save')" :disable="invalid" :loading="saving" data-ws-save @click="save" />
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import { extendedAlphanumeric } from '@/helpers/commons/regexHelper'
import { cloneDataset } from '../workspaceApi'
import WorkspaceDialog from '../common/WorkspaceDialog.vue'

// Ported from views/dataView/dialogs/WorkspaceDataCloneDialog.vue: same fields, limits, rules and payload.
const LABEL_MAX = 50
const NAME_MAX = 50
const DESCRIPTION_MAX = 160

const props = defineProps<{ modelValue: boolean; propDataset: any; dialogClass?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; cloned: [] }>()
const { t } = useI18n()
const store = mainStore()

const dataset = ref<any>({})
const saving = ref(false)

const required = (fieldKey: string) => (value: string) => !!value || t('common.validation.required', { fieldName: t(fieldKey) })
const pattern = (value: string) => !value || extendedAlphanumeric.test(value) || t('common.validation.regex')
const invalid = computed(() => !dataset.value.label || !dataset.value.name || !extendedAlphanumeric.test(dataset.value.label) || !extendedAlphanumeric.test(dataset.value.name))

function loadDataset() {
    if (!props.propDataset) return
    dataset.value = { ...props.propDataset, id: '', dsVersions: [], usedByNDocs: 0, name: 'CLONE_' + props.propDataset.name, label: 'CLONE_' + props.propDataset.label, description: props.propDataset.description ? 'CLONED ' + props.propDataset.description : '', scopeCd: 'USER' }
    dataset.value.owner = (store.$state as any).user.userId
    if (dataset.value.catTypeId) {
        delete dataset.value.catTypeId
    }
}

async function save() {
    saving.value = true
    try {
        await cloneDataset(dataset.value)
        store.setInfo({ title: 'common.toast.createTitle', msg: 'common.toast.success' })
        emit('cloned')
        emit('update:modelValue', false)
    } catch (error: any) {
        // a 200 answer with errors is not shown by the interceptor here (X-Disable-Errors), a 4xx/5xx is
        if (!error?.response) store.setError({ title: 'workspace.myData.clonedDatasetWizard', msg: error?.message ?? t('common.error.generic') })
    } finally {
        saving.value = false
    }
}
</script>
