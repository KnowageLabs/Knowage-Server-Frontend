<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="descriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('documentExecution.main.addToWorkspace') }}
                </template>
            </Toolbar>
        </template>

        <WorkspaceFolderPickerTree v-if="folders" :prop-folders="folders" @folderSelected="setSelectedParentFolder"></WorkspaceFolderPickerTree>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="!parentFolder" @click="onSave">{{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { mapActions } from 'pinia'
import { IFolder } from '@/modules/workspace/Workspace'
import Dialog from 'primevue/dialog'
import descriptor from './WorkspaceFolderPickerDialogDescriptor.json'
import mainStore from '@/App.store'
import WorkspaceFolderPickerTree from '@/modules/workspace/genericComponents/WorkspaceFolderPickerTree.vue'

export default defineComponent({
    name: 'workspace-folder-picker-dialog',
    components: { Dialog, WorkspaceFolderPickerTree },
    props: {
        visible: { type: Boolean },
        document: { type: Object, required: true }
    },
    emits: ['close'],
    data() {
        return {
            descriptor,
            folders: null as IFolder | null,
            nodes: [] as any[],
            parentFolder: null as IFolder | null
        }
    },
    watch: {
        async visible() {
            await this.loadData()
        }
    },
    async created() {
        await this.loadData()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError', 'setLoading']),
        async loadData() {
            this.setLoading(true)
            await this.getAllFolders()
            this.setLoading(false)
        },
        async getAllFolders() {
            await this.$http.get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository`).then((response: AxiosResponse<any>) => (this.folders = { ...response.data }))
        },
        setSelectedParentFolder(folder: any) {
            this.parentFolder = folder
        },
        closeDialog() {
            this.$emit('close')
            this.parentFolder = null
            this.setLoading(false)
        },
        async onSave() {
            if (!this.document || !this.parentFolder) return
            this.setLoading(true)
            const postData = { biObjectId: this.document.id, parentId: this.parentFolder.id }
            await this.$http
                .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/document`, postData)
                .then(() => {
                    this.setInfo({ title: this.$t('common.toast.updateTitle'), msg: this.$t('common.toast.success') })
                    this.closeDialog()
                })
                .catch(() => {})
            this.setLoading(false)
        }
    }
})
</script>
