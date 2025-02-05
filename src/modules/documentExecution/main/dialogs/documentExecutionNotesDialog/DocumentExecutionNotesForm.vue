<template>
    <div class="p-m-2">
        <q-editor ref="editor" class="q-ma-sm" v-model="note.content" min-height="260px" />

        <div class="p-d-field p-my-3">
            <label class="kn-material-input-label">{{ $t('common.type') + ' *' }}</label>
            <Dropdown
                v-model="note.type"
                class="kn-material-input"
                :class="{
                    'p-invalid': !note.type
                }"
                :options="documentExecutionNotesDialogDescriptor.dropdownOptions"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dropdown from 'primevue/dropdown'
import documentExecutionNotesDialogDescriptor from './DocumentExecutionNotesDialogDescriptor.json'

export default defineComponent({
    name: 'document-execution-notes-form',
    components: { Dropdown },
    props: { datasets: { type: Array }, selectedNote: { type: Object } },
    emits: ['selected'],
    data() {
        return {
            documentExecutionNotesDialogDescriptor,
            note: {} as any
        }
    },
    watch: {
        selectedNote() {
            this.loadNote()
        }
    },
    created() {
        this.loadNote()
    },
    methods: {
        loadNote() {
            this.note = this.selectedNote
        }
    }
})
</script>
