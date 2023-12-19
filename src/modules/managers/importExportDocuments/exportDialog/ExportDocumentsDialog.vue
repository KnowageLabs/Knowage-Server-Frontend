<template>
    <Dialog class="kn-dialog--toolbar--primary exportDialog" :visible="true" :header="$t('common.export')" :closable="false" modal>
        <div class="exportDialogContent">
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12">
                    <span class="p-float-label">
                        <InputText v-model="exportPayload.EXPORT_FILE_NAME" class="kn-material-input fileNameInputText" type="text" maxlength="50" />
                        <label class="kn-material-input-label" for="label">{{ $t('importExport.filenamePlaceholder') }}</label>
                    </span>
                </div>
                <div v-for="option of checkboxes" :key="option" class="p-field p-col-12">
                    <Checkbox v-model="exportPayload[option]" :input-id="option" :name="option" :binary="true" />
                    <label class="p-mb-0 p-ml-1" :for="option">{{ $t(`managers.importExportDocs.export.${option}`) }}</label>
                </div>
                <!-- <Checkbox id="EXPORT_SUB_OBJ" v-model="exportPayload.EXPORT_SUB_OBJ" :binary="true" /> -->
            </form>
        </div>
        <template #footer>
            <Button class="p-button-text kn-button" :label="$t('common.cancel')" @click="closeDialog" />
            <Button class="kn-button kn-button--primary" :label="$t('common.export')" autofocus :disabled="exportPayload.EXPORT_FILE_NAME && exportPayload.EXPORT_FILE_NAME.length == 0" @click="emitExport" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

export default defineComponent({
    name: 'export-dialog',
    components: { Dialog, Checkbox },
    props: {},
    emits: ['close', 'export'],
    data() {
        return {
            fileName: '',
            checkboxes: ['EXPORT_SUB_OBJ', 'EXPORT_SNAPSHOT', 'EXPORT_BIRT', 'EXPORT_SCHEDULER', 'EXPORT_SELECTED_FUNCTIONALITY', 'EXPORT_RELATED_DOCS'],
            exportPayload: {
                EXPORT_FILE_NAME: '',
                DOCUMENT_ID_LIST: [],
                EXPORT_SUB_OBJ: false,
                EXPORT_SNAPSHOT: false,
                EXPORT_CROSSNAV: true,
                EXPORT_BIRT: false,
                EXPORT_SCHEDULER: false,
                EXPORT_SELECTED_FUNCTIONALITY: false,
                EXPORT_RELATED_DOCS: false
            }
        }
    },
    created() {},
    methods: {
        closeDialog(): void {
            this.$emit('close')
        },
        emitExport(): void {
            this.$emit('export', this.exportPayload)
        }
    }
})
</script>
<style lang="scss">
.exportDialog {
    min-width: 600px;
    width: 60%;
    max-width: 1200px;
    z-index: 50 !important;

    .p-fileupload-buttonbar {
        border: none;
        .p-button:not(.p-fileupload-choose) {
            display: none;
        }
    }
}
.fileNameInputText {
    width: 100%;
}
.exportDialogContent {
    padding-top: 16px;
}
</style>
