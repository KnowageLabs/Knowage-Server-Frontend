<template>
    <div>
        <Dialog :header="$t('workspace.federationDefinition.savingFederation')" :style="workspaceFederationSaveDialogDescriptor.dialog.style" :visible="visible" :modal="true" class="p-fluid kn-dialog--toolbar--primary" :closable="false">
            <div v-if="dataset">
                <div class="p-m-4">
                    <span>
                        <label class="kn-material-input-label">{{ $t('common.label') }} *</label>
                        <InputText
                            v-model="dataset.label"
                            class="kn-material-input p-inputtext-sm"
                            :class="{
                                'p-invalid': labelDirty && (!dataset.label || dataset.label.length === 0)
                            }"
                            @input="labelDirty = true"
                            @blur="labelDirty = true"
                        />
                    </span>

                    <div v-show="labelDirty && (!dataset.label || dataset.label.length === 0)" class="p-error p-my-2">
                        {{ $t('common.validation.required', { fieldName: $t('common.label') }) }}
                    </div>
                </div>

                <div class="p-m-4">
                    <span>
                        <label class="kn-material-input-label">{{ $t('common.name') }} *</label>
                        <InputText
                            v-model="dataset.name"
                            class="kn-material-input p-inputtext-sm"
                            :class="{
                                'p-invalid': nameDirty && (!dataset.name || dataset.name.length === 0)
                            }"
                            @input="nameDirty = true"
                            @blur="nameDirty = true"
                        />
                    </span>

                    <div v-show="nameDirty && (!dataset.name || dataset.name.length === 0)" class="p-error p-my-2">
                        {{ $t('common.validation.required', { fieldName: $t('common.name') }) }}
                    </div>
                </div>

                <div class="p-m-4">
                    <span>
                        <label class="kn-material-input-label">{{ $t('common.description') }}</label>
                        <InputText v-model="dataset.description" class="kn-material-input p-inputtext-sm" />
                    </span>
                </div>
            </div>

            <template #footer>
                <Button class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.close') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="saveButtonDisabled" data-test="save-button" @click="saveFederation"> {{ $t('common.save') }}</Button>
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import workspaceFederationSaveDialogDescriptor from './WorkspaceFederationSaveDialogDescriptor.json'

export default defineComponent({
    name: 'workspace-federation-save-dialog',
    components: { Dialog },
    props: { visible: { type: Boolean }, federatedDataset: { type: Object } },
    emits: ['close', 'save'],
    data() {
        return {
            workspaceFederationSaveDialogDescriptor,
            dataset: null as any,
            labelDirty: false,
            nameDirty: false
        }
    },
    computed: {
        saveButtonDisabled(): boolean {
            return this.dataset.label.length === 0 || this.dataset.name.length === 0
        }
    },
    watch: {
        federatedDataset() {
            this.loadDataset()
        }
    },
    created() {
        this.loadDataset()
    },
    methods: {
        loadDataset() {
            this.dataset = this.federatedDataset ? { ...this.federatedDataset } : {}
        },
        closeDialog() {
            this.dataset = { ...this.federatedDataset }
            this.labelDirty = false
            this.nameDirty = false
            this.$emit('close')
        },
        saveFederation() {
            this.$emit('save', this.dataset)
        }
    }
})
</script>
