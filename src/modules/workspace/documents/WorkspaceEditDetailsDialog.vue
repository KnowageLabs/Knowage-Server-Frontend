<template>
    <WorkspaceDialog :model-value="modelValue" :title="$t('workspace.editDetails')" name="edit-details" size="md" :dialog-class="dialogClass" @update:model-value="emit('update:modelValue', $event)" @show="reset">
        <div class="kn-ws-dialog-form">
            <q-input v-model="label" outlined dense autofocus hide-bottom-space :label="$t('workspace.label') + ' *'" :maxlength="LABEL_MAX" :rules="[required('workspace.label')]" />
            <q-input v-model="name" outlined dense hide-bottom-space :label="$t('common.name') + ' *'" :maxlength="NAME_MAX" :rules="[required('common.name')]" />
            <q-input v-model="description" outlined dense type="textarea" rows="3" hide-bottom-space class="kn-ws-dialog-form__full" :label="$t('common.description')" :maxlength="DESCRIPTION_MAX" />
        </div>
        <template #actions>
            <q-btn v-close-popup flat no-caps :label="$t('common.cancel')" />
            <q-btn unelevated no-caps color="primary" :label="$t('common.save')" :disable="!label.trim() || !name.trim()" :loading="saving" data-ws-save @click="save" />
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import useWorkspaceStore from '../workspace.store'
import { WsDocumentRow } from '../Workspace'
import WorkspaceDialog from '../common/WorkspaceDialog.vue'

// Ported from WorkspaceAnalysisViewEditDialog: same fields and limits; the store sends name as name and label as label (B6).
const LABEL_MAX = 100
const NAME_MAX = 200
const DESCRIPTION_MAX = 400

const props = defineProps<{ modelValue: boolean; row: WsDocumentRow | null; dialogClass?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const { t } = useI18n()
const appStore = mainStore()
const store = useWorkspaceStore()

const label = ref('')
const name = ref('')
const description = ref('')
const saving = ref(false)

const required = (fieldKey: string) => (value: string) => !!value?.trim() || t('common.validation.required', { fieldName: t(fieldKey) })

function reset() {
    label.value = props.row?.label ?? ''
    name.value = props.row?.name ?? ''
    description.value = props.row?.description ?? ''
}

async function save() {
    if (!props.row || !label.value.trim() || !name.value.trim()) return
    saving.value = true
    try {
        await store.editDocumentDetails(props.row, { name: name.value.trim(), label: label.value.trim(), description: description.value })
        appStore.setInfo({ title: 'common.toast.updateTitle', msg: 'common.toast.success' })
        emit('update:modelValue', false)
    } catch (error: any) {
        // a 200 answer with errors is not shown by the interceptor here (X-Disable-Errors), a 4xx/5xx is
        if (!error?.response) appStore.setError({ title: 'workspace.editDetails', msg: error?.message ?? t('common.error.generic') })
    } finally {
        saving.value = false
    }
}
</script>
