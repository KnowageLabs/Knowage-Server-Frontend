<template>
    <WorkspaceDialog :model-value="modelValue" :title="$t('workspace.renameView')" name="rename-view" :dialog-class="dialogClass" @update:model-value="emit('update:modelValue', $event)" @show="reset">
        <div class="kn-ws-dialog-form kn-ws-dialog-form--single">
            <q-input v-model="name" outlined dense autofocus hide-bottom-space :label="$t('common.name') + ' *'" maxlength="200" :rules="[(v) => !!v?.trim() || $t('common.validation.required', { fieldName: $t('common.name') })]" @keyup.enter="save" />
            <q-input v-model="description" outlined dense type="textarea" rows="3" hide-bottom-space :label="$t('common.description')" maxlength="400" />
        </div>
        <template #actions>
            <q-btn v-close-popup flat no-caps :label="$t('common.cancel')" />
            <q-btn unelevated no-caps color="primary" :label="$t('common.save')" :disable="!name.trim()" :loading="saving" data-ws-save @click="save" />
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

// A saved view: name and description, PUT 1.0/repository/view with the full view.
const props = defineProps<{ modelValue: boolean; row: WsDocumentRow | null; dialogClass?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const { t } = useI18n()
const appStore = mainStore()
const store = useWorkspaceStore()

const name = ref('')
const description = ref('')
const saving = ref(false)

function reset() {
    name.value = props.row?.name ?? ''
    description.value = props.row?.description ?? ''
}

async function save() {
    if (!props.row || !name.value.trim() || saving.value) return
    saving.value = true
    try {
        await store.renameView(props.row, name.value.trim(), description.value)
        appStore.setInfo({ title: 'common.toast.updateTitle', msg: 'common.toast.success' })
        emit('update:modelValue', false)
    } catch {
        // the axios interceptor shows the error
    } finally {
        saving.value = false
    }
}
</script>
