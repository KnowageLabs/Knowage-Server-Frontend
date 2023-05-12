<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="workspaceNewFolderDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ newFolder.id ? $t('common.edit') : $t('workspace.myRepository.newFolderTitle') }}
                </template>
            </Toolbar>
        </template>

        <form v-if="newFolder" class="p-fluid p-formgrid p-grid p-mt-4">
            <div class="p-field p-col-6">
                <span class="p-float-label">
                    <InputText
                        id="name"
                        v-model.trim="v$.newFolder.name.$model"
                        class="kn-material-input"
                        type="text"
                        max-length="25"
                        :class="{
                            'p-invalid': v$.newFolder.name.$invalid && v$.newFolder.name.$dirty
                        }"
                        @blur="v$.newFolder.name.$touch()"
                    />
                    <label for="name" class="kn-material-input-label">{{ $t('importExport.catalogFunction.column.name') }} * </label>
                </span>
                <KnValidationMessages
                    :v-comp="v$.newFolder.name"
                    :additional-translate-params="{
                        fieldName: $t('importExport.catalogFunction.column.name')
                    }"
                />
            </div>
            <div class="p-field p-col-6">
                <span class="p-float-label p-mb-2">
                    <InputText id="description" v-model.trim="newFolder.description" class="kn-material-input" type="text" max-length="254" />
                    <label for="description" class="kn-material-input-label"> {{ $t('common.description') }} </label>
                </span>
            </div>
        </form>

        <WorkspaceFolderPickerTree v-if="newFolder.id" :prop-folders="propFolders ?? null" :selected-folder-id="newFolder.parentId" @folderSelected="setSelectedParentFolder"></WorkspaceFolderPickerTree>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="buttonDisabled" @click="onSave">{{ $t('common.save') }}</Button>
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
            this.newFolder = this.selectedFolder
            console.log('------------------ LOADED NEW FOLDER: ', this.newFolder)
        },
        setSelectedParentFolder(folder: any) {
            this.newFolder.parentId = folder.id
        },
        closeDialog() {
            this.newFolder = {} as any
            this.v$.$reset()
            this.$emit('close')
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
