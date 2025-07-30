<template>
    <q-dialog v-model="visible">
        <q-card>
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ view?.new ? $t('documentExecution.main.newSavedView') : $t('documentExecution.main.addToMyRepository') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <q-banner class="bg-info text-black" rounded dense>
                    <template v-slot:avatar> <q-icon name="info" color="primary" /> </template>{{ $t('documentExecution.main.saveViewHint') }}
                </q-banner>
                <div v-if="view" class="row q-col-gutter-md q-mt-sm">
                    <q-input v-model="view.name" class="col-12" :disabled="!view.new" :label="$t('common.name') + '*'" filled />
                    <q-input v-model="view.description" type="textarea" rows="2" class="col-12" :disabled="!view.new" :label="$t('common.description')" filled />
                    <WorkspaceDocumentTree mode="move" :selected-folder-id="view?.parentId" @folderSelected="setSelectedFolder"></WorkspaceDocumentTree>
                </div>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.close') }}</q-btn>
                <q-btn class="kn-button kn-button--primary" :disable="saveButtonDisabled" data-test="save-button" @click="save"> {{ $t('common.save') }}</q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardView } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { saveDashboardView, updateDashboardView } from '../DashboardViewsHelper'
import descriptor from './DashboardSaveViewDialogDescriptor.json'
import appStore from '@/App.store'
import WorkspaceDocumentTree from '@/modules/workspace/genericComponents/WorkspaceDocumentTree.vue'

export default defineComponent({
    name: 'dashboard-save-view-dialog',
    components: { WorkspaceDocumentTree },
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
            return !this.selectedFolder || !this.view?.name || this.view?.name === ''
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
