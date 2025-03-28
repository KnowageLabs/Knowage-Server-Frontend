<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="documentExecutionNotesDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('common.notes') }}
                </template>
                <template #end>
                    <FabButton icon="fas fa-plus" @click="createNewNote" />
                </template>
            </Toolbar>
        </template>
        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

        <TabView v-model:activeIndex="activeTab">
            <TabPanel>
                <template #header>
                    <span>{{ $t('common.note') }}</span>
                </template>

                <DocumentExecutionNotesForm :selected-note="selectedNote"></DocumentExecutionNotesForm>
            </TabPanel>

            <TabPanel>
                <template #header>
                    <span>{{ $t('common.notesList') }}</span>
                </template>

                <DocumentExecutionNotesList :prop-notes="notes" :document="document" @editNote="onEditNote" @deleteNote="onDeleteNote"></DocumentExecutionNotesList>
            </TabPanel>
        </TabView>

        <template #footer>
            <div class="p-d-flex p-flex-row">
                <Button v-if="activeTab === 1" class="kn-button kn-button--primary" :disabled="exportButtonDisabled" @click="exportNotes('pdf')"> {{ $t('documentExecution.main.exportInPDF') }}</Button>
                <Button v-if="activeTab === 1" class="kn-button kn-button--primary" :disabled="exportButtonDisabled" @click="exportNotes('rtf')"> {{ $t('documentExecution.main.exportInRTF') }}</Button>

                <Button class="kn-button kn-button--primary p-ml-auto" data-test="close-button" @click="closeDialog"> {{ $t('common.close') }}</Button>
                <Button v-if="activeTab === 0" class="kn-button kn-button--primary" :disabled="saveButtonDisabled" data-test="save-button" @click="saveNote"> {{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import { iNote } from '../../DocumentExecution'
import Dialog from 'primevue/dialog'
import documentExecutionNotesDialogDescriptor from './DocumentExecutionNotesDialogDescriptor.json'
import DocumentExecutionNotesForm from './DocumentExecutionNotesForm.vue'
import DocumentExecutionNotesList from './DocumentExecutionNotesList.vue'
import FabButton from '@/components/UI/KnFabButton.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { mapState } from 'pinia'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-execution-notes-dialog',
    components: { Dialog, DocumentExecutionNotesForm, DocumentExecutionNotesList, FabButton, TabView, TabPanel },
    props: { visible: { type: Boolean }, propDocument: { type: Object } },
    emits: ['close'],
    data() {
        return {
            documentExecutionNotesDialogDescriptor,
            document: null as any,
            notes: [] as iNote[],
            selectedNote: {} as iNote,
            activeTab: 0,
            loading: false
        }
    },
    watch: {
        async visible() {
            if (this.visible) {
                await this.loadDocument()
            }
        },
        async propDocument() {
            await this.loadDocument()
        }
    },
    computed: {
        saveButtonDisabled(): boolean {
            return !this.selectedNote.type
        },
        exportButtonDisabled(): boolean {
            return this.notes.length === 0
        },
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        })
    },
    setup() {
        const store = mainStore()
        return { store }
    },
    async mounted() {
        await this.loadDocument()
    },
    methods: {
        async loadDocument() {
            this.document = this.propDocument
            if (this.isEnterprise && this.document && this.document.id) {
                await this.loadNotes()
            }
        },
        closeDialog() {
            this.selectedNote = {} as iNote
            this.$emit('close')
        },
        async loadNotes() {
            this.loading = true
            this.notes = []
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/document-notes/${this.document.id}`)
                .then((response: AxiosResponse<any>) => {
                    this.notes = response.data?.map((note: iNote) => {
                        return { ...note, type: note.public ? 'Public' : 'Private' }
                    })
                })
                .catch((error: any) =>
                    this.store.setError({
                        title: this.$t('common.error.generic'),
                        msg: error
                    })
                )
            this.loading = false
        },
        async saveNote() {
            this.loading = true
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/document-notes/${this.document.id}`, { public: this.selectedNote.type === 'Public', content: this.selectedNote.content, id: this.selectedNote.id })
                .then(async (response: AxiosResponse<any>) => {
                    this.store.setInfo({
                        title: this.$t('common.toast.createTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.selectedNote = { ...response.data, type: response.data.public ? 'Public' : 'Private' }
                    await this.loadNotes()
                })
                .catch((error: any) =>
                    this.store.setError({
                        title: this.$t('common.error.generic'),
                        msg: error
                    })
                )
            this.loading = false
        },
        onEditNote(note: iNote) {
            this.selectedNote = { ...note }
            this.activeTab = 0
        },
        async onDeleteNote(note: iNote) {
            this.loading = true
            await this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/document-notes/${this.document.id}/${note.id}`)
                .then(async () => {
                    this.store.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                    if (this.selectedNote.id === note.id) this.selectedNote = {} as iNote
                    await this.loadNotes()
                })
                .catch((error: any) =>
                    this.store.setError({
                        title: this.$t('common.error.generic'),
                        msg: error
                    })
                )
            this.loading = false
        },
        async exportNotes(type: string) {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/document-notes/${this.document.id}/download/${type}`)
                .then((response: AxiosResponse<any>) => {
                    const byteArray = new Uint8Array(response.data.file)
                    downloadDirect(byteArray, this.document.label, type === 'pdf' ? 'application/pdf' : 'application/rtf')
                })
                .catch(() => {})
            this.loading = false
        },
        createNewNote() {
            this.selectedNote = {} as iNote
            this.activeTab = 0
        }
    }
})
</script>
