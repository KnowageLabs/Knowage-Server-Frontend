<template>
    <Dialog id="olap-wizard-dialog" class="p-fluid kn-dialog--toolbar--primary" :style="descriptor.style.dialog" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-2 p-col-12">
                <template #start>
                    {{ $t('documentExecution.olap.outputWizard.title') }}
                </template>
            </Toolbar>
        </template>

        <ProgressSpinner class="wizard-overlay-spinner" v-if="loading" :style="descriptor.style.spinner" />

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <InlineMessage class="p-m-1" severity="info" closable="false">{{ $t('documentExecution.olap.outputWizard.infoMsg') }}</InlineMessage>
            <div id="type-container" class="p-field p-d-flex p-ai-center p-m-2  p-col-11">
                <span>{{ $t('managers.workspaceManagement.dataPreparation.transformations.outputType') }}: </span>
                <div class="p-mx-2">
                    <RadioButton id="fileType" name="file" value="file" v-model="selectedType" />
                    <label for="fileType" class="p-ml-1">{{ $t('common.file') }}</label>
                </div>
                <div>
                    <RadioButton id="tableType" name="table" value="table" v-model="selectedType" />
                    <label for="tableType" class="p-ml-1">{{ $t('common.table.table') }}</label>
                </div>
            </div>

            <div class="p-field p-float-label p-col-6 p-mt-2">
                <Dropdown id="version" class="kn-material-input" v-model="selectedVersion" :options="olapVersionsProp" optionLabel="name" />
                <label for="version" class="kn-material-input-label"> {{ $t('documentExecution.olap.outputWizard.version') }} </label>
            </div>

            <div v-if="selectedType === 'file' && selectedVersion" class="p-field p-col-6 p-mt-2">
                <span class="p-float-label">
                    <InputText id="fieldDelimiter" class="kn-material-input" v-model="fieldDelimiter" />
                    <label for="fieldDelimiter" class="kn-material-input-label"> {{ $t('documentExecution.olap.outputWizard.fieldDelimiter') }} </label>
                </span>
                <small>{{ $t('documentExecution.olap.outputWizard.fileInfo') }}</small>
            </div>
            <div v-if="selectedType === 'table' && selectedVersion" class="p-field p-col-6 p-mt-2">
                <span class="p-float-label">
                    <InputText id="tableName" class="kn-material-input" v-model="tableName" />
                    <label for="tableName" class="kn-material-input-label"> {{ $t('managers.datasetManagement.flatTableName') }} </label>
                </span>
                <small>{{ $t('documentExecution.olap.outputWizard.tableInfo') }}</small>
            </div>
        </form>

        <template #footer>
            <Button class="kn-button kn-button--secondary" @click="$emit('close')"> {{ $t('common.close') }}</Button>
            <Button class="kn-button kn-button--primary" :disabled="saveDisabled" @click="saveRequest"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import descriptor from './OlapOutputWizardDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InlineMessage from 'primevue/inlinemessage'
import RadioButton from 'primevue/radiobutton'
import ProgressSpinner from 'primevue/progressspinner'

export default defineComponent({
    name: 'olap-custom-view-save-dialog',
    components: { Dialog, Dropdown, InlineMessage, RadioButton, ProgressSpinner },
    props: { olapVersionsProp: { type: Boolean, required: true }, sbiExecutionId: { type: String } },
    emits: ['close'],
    computed: {
        saveDisabled(): any {
            if ((this.selectedType === 'file' && this.fieldDelimiter.length > 0) || (this.selectedType === 'table' && this.tableName.length > 0)) {
                return false
            } else return true
        }
    },
    data() {
        return {
            descriptor,
            loading: false,
            selectedVersion: null as any,
            selectedType: 'file' as any,
            tableName: 'WHATIFOUTPUTTABLE',
            fieldDelimiter: '|'
        }
    },
    watch: {},
    created() {},
    methods: {
        saveRequest() {
            console.log(this.olapVersionsProp)
            if (this.selectedType === 'file') {
                this.loading = true
                this.$http
                    .get(process.env.VUE_APP_OLAP_PATH + `1.0/analysis/csv/${this.selectedVersion.id}/${this.fieldDelimiter}?SBI_EXECUTION_ID=${this.sbiExecutionId}`, { headers: { Accept: 'application/zip' } })
                    .catch(() => {})
                    .finally(() => (this.loading = false))
            } else {
                this.loading = true
                this.$http
                    .get(process.env.VUE_APP_OLAP_PATH + `1.0/analysis/table/${this.selectedVersion.id}/${this.tableName}?SBI_EXECUTION_ID=${this.sbiExecutionId}`, { headers: { Accept: 'application/json, text/plain, */*' } })
                    .then(async () => {
                        this.$store.commit('setInfo', { title: this.$t('common.information'), msg: this.$t('common.toast.updateSuccess') })
                    })
                    .catch(() => {})
                    .finally(() => (this.loading = false))
            }
        },
        resetFields() {
            this.tableName = 'WHATIFOUTPUTTABLE'
            this.fieldDelimiter = '|'
            this.selectedVersion = null
        }
    }
})
</script>

<style lang="scss">
#olap-wizard-dialog .p-dialog-header,
#olap-wizard-dialog .p-dialog-content {
    padding: 0;
}
#olap-wizard-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
.wizard-overlay-spinner .p-progress-spinner-svg {
    width: 125px;
}
</style>