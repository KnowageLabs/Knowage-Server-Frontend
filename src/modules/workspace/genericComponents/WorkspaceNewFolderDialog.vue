<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="workspaceNewFolderDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ newFolder?.id ? $t('common.edit') : $t('workspace.myRepository.newFolderTitle') }}</q-toolbar-title>
            </q-toolbar>
        </template>

        <form v-if="newFolder" class="row q-mt-sm q-col-gutter-sm">
            <q-input filled class="col-12" v-model="v$.newFolder.name.$model" :label="$t('common.name') + '*'" maxLength="25" :error="v$.newFolder.name.$invalid && v$.newFolder.name.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('importExport.catalogFunction.column.name') })" data-test="name-input" />
            <q-input filled class="col-12" type="textarea" rows="2" v-model.trim="newFolder.description" :label="$t('common.description')" maxLength="254" data-test="description-input" />
        </form>

        <WorkspaceFolderPickerTree v-if="newFolder?.id" :prop-folders="propFolders ?? null" :selected-folder-id="newFolder.parentId" @folderSelected="setSelectedParentFolder"></WorkspaceFolderPickerTree>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="buttonDisabled" data-test="save-button" @click="onSave">{{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { IFolder } from '../Workspace'
import Dialog from 'primevue/dialog'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import workspaceNewFolderDialogDescriptor from './WorkspaceNewFolderDialogDescriptor.json'
import useValidate from '@vuelidate/core'
import WorkspaceFolderPickerTree from './WorkspaceFolderPickerTree.vue'

export default defineComponent({
    name: 'workspace-repository-move-dialog',
    components: { Dialog, KnValidationMessages, WorkspaceFolderPickerTree },
    props: { visible: { type: Boolean }, selectedFolder: { type: Object }, propFolders: { type: Object as PropType<IFolder> } },
    emits: ['close', 'create', 'edit'],
    data() {
        return {
            v$: useValidate() as any,
            workspaceNewFolderDialogDescriptor,
            newFolder: {} as any
        }
    },
    validations() {
        return {
            newFolder: createValidations('newFolder', workspaceNewFolderDialogDescriptor.validations.newFolder)
        }
    },
    computed: {
        buttonDisabled(): any {
            return this.v$.$invalid
        }
    },
    watch: {
        visible() {
            this.loadSelectedFolder()
        }
    },
    created() {
        this.loadSelectedFolder()
    },
    methods: {
        loadSelectedFolder() {
            this.newFolder = this.selectedFolder ?? {}
        },
        setSelectedParentFolder(folder: any) {
            this.newFolder.parentId = folder.id
        },
        closeDialog() {
            this.$emit('close')
            this.newFolder = {} as any
            this.v$.$reset()
        },
        onSave() {
            this.newFolder.id ? this.editFolder() : this.createFolder()
        },
        editFolder() {
            this.$emit('edit', this.newFolder)
            this.v$.$reset()
        },
        createFolder() {
            this.$emit('create', this.newFolder)
            this.newFolder = {} as any
        }
    }
})
</script>
