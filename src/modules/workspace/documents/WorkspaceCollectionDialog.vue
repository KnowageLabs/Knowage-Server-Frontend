<template>
    <WorkspaceDialog :model-value="modelValue" :title="collection ? $t('workspace.editCollection') : parent ? $t('workspace.newCollectionIn', { name: parent.name }) : $t('workspace.newCollection')" name="collection" :dialog-class="dialogClass" @update:model-value="emit('update:modelValue', $event)" @show="reset">
        <div class="kn-ws-dialog-form kn-ws-dialog-form--single">
            <q-input v-model="name" outlined dense autofocus hide-bottom-space :label="$t('workspace.collectionName') + ' *'" maxlength="200" :rules="[(v) => !!v?.trim() || $t('common.validation.required', { fieldName: $t('workspace.collectionName') })]" lazy-rules @keyup.enter="save" />
            <q-input v-model="description" outlined dense type="textarea" rows="3" hide-bottom-space :label="$t('workspace.collectionDescription')" maxlength="254" />
        </div>
        <template #actions>
            <q-btn v-close-popup flat no-caps :label="$t('common.cancel')" />
            <q-btn unelevated no-caps color="primary" :label="$t('common.save')" :disable="!name.trim()" :loading="saving" data-ws-save @click="save" />
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import useWorkspaceStore from '../workspace.store'
import { WsCollection } from '../Workspace'
import WorkspaceDialog from '../common/WorkspaceDialog.vue'

// New collection (top level, or inside parent from Manage collections) or rename of an existing one.
const props = defineProps<{ modelValue: boolean; collection?: WsCollection | null; parent?: WsCollection | null; dialogClass?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [folderId: string | null] }>()
const store = useWorkspaceStore()

const name = ref('')
const description = ref('')
const saving = ref(false)

function reset() {
    name.value = props.collection?.name ?? ''
    description.value = props.collection?.description ?? ''
}

async function save() {
    if (!name.value.trim() || saving.value) return
    saving.value = true
    try {
        let folderId: string | null
        if (props.collection) {
            await store.updateCollection(props.collection, { name: name.value.trim(), description: description.value })
            folderId = props.collection.id
        } else folderId = await store.createCollection(name.value.trim(), description.value, props.parent?.id ?? null)
        emit('saved', folderId)
        emit('update:modelValue', false)
    } catch {
        // the axios interceptor shows the error
    } finally {
        saving.value = false
    }
}
</script>
