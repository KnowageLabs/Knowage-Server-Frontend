<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visible" :header="view?.new ? $t('documentExecution.main.newSavedView') : $t('documentExecution.main.addToMyRepository')" :style="descriptor.dialogStyle" :closable="false" modal :breakpoints="descriptor.dialogBreakpoints">
        <Message class="p-text-center p-m-5" severity="info" :closable="false">{{ $t('documentExecution.main.saveViewHint') }}</Message>
        <div v-if="view" class="p-formgrid p-grid p-fluid p-m-4">
            <div class="p-float-label p-col-12 p-lg-3 kn-flex">
                <InputText v-model="view.name" class="kn-material-input" :disabled="!view.new" />
                <label class="kn-material-input-label">{{ $t('common.name') }}</label>
            </div>

            <div class="p-float-label p-col-12 kn-flex">
                <InputText v-model="view.description" class="kn-material-input" />
                <label class="kn-material-input-label">{{ $t('common.description') }}</label>
            </div>
        </div>

        <WorkspaceDocumentTree mode="move" :selected-folder-id="view?.parentId" @folderSelected="setSelectedFolder"></WorkspaceDocumentTree>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.close') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="saveButtonDisabled" data-test="save-button" @click="save"> {{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardView } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { saveDashboardView, updateDashboardView } from '../DashboardViewsHelper'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import descriptor from './DashboardSaveViewDialogDescriptor.json'
import appStore from '@/App.store'
import Message from 'primevue/message'
import WorkspaceDocumentTree from '@/modules/workspace/genericComponents/WorkspaceDocumentTree.vue'

export default defineComponent({
    name: 'dashboard-save-view-dialog',
    components: { Dialog, Dropdown, Message, WorkspaceDocumentTree },
    props: { visible: { required: true, type: Boolean }, propView: { type: Object as PropType<IDashboardView | null>, required: true }, document: { type: Object } },
    emits: ['viewUpdated', 'close'],
    data() {
        return {
            descriptor,
            view: null as IDashboardView | null,
            selectedFolder: null as any,
            getTranslatedLabel
        }
    },
    computed: {
        saveButtonDisabled() {
            return !this.selectedFolder
        }
    },
    watch: {
        visible() {
            this.loadView()
        }
    },
    created() {
        this.loadView()
    },
    methods: {
        ...mapActions(appStore, ['setLoading', 'setInfo']),
        loadView() {
            this.view = this.propView
        },
        setSelectedFolder(folder: any) {
            this.selectedFolder = folder
        },
        async save() {
            if (!this.view) return
            this.setLoading(true)
            this.view.new ? await this.saveView() : await this.updateView()
            this.setLoading(false)
        },
        async saveView() {
            if (!this.view) return

            this.view.biObjectId = this.document?.id
            this.view.parentId = this.selectedFolder ? this.selectedFolder.id : null
            this.view.label = this.view.name
            this.formatDriversForSave()
            await saveDashboardView(this.view, this.$http)
                .then(() => {
                    this.closeDialog()
                    this.setInfo({ title: this.$t('common.toast.createTitle'), msg: this.$t('common.toast.success') })
                })
                .catch(() => {})
        },
        async updateView() {
            if (!this.view) return
            this.view.parentId = this.selectedFolder ? this.selectedFolder.id : null
            this.view.label = this.view.name
            this.formatDriversForSave()
            await updateDashboardView(this.view, this.$http)
                .then(() => {
                    this.setInfo({ title: this.$t('common.toast.updateTitle'), msg: this.$t('common.toast.success') })
                    this.$emit('viewUpdated')
                    this.closeDialog()
                })
                .catch(() => {})
        },
        formatDriversForSave() {
            if (!this.view) return {}
            this.view.drivers.filterStatus?.forEach((filter: any) => ['dataDependsOnParameters', 'dataDependentParameters', 'dependsOnParameters', 'dependentParameters', 'lovDependsOnParameters', 'lovDependentParameters'].forEach((field: string) => delete filter[field]))
        },
        closeDialog() {
            this.view = null
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss" scoped>
#add-range-button {
    font-size: 0.8rem;
}
</style>
