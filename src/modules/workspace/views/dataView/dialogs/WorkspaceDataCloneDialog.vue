<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="workspaceDataCloneDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('workspace.myData.clonedDatasetWizard') }}
                </template>
            </Toolbar>
        </template>

        <form v-if="dataset">
            <div class="p-m-4">
                <span class="p-float-label">
                    <InputText
                        id="label"
                        v-model.trim="v$.dataset.label.$model"
                        class="kn-material-input"
                        :max-length="workspaceDataCloneDialogDescriptor.labelMaxLength"
                        :class="{
                            'p-invalid': v$.dataset.label.$invalid && v$.dataset.label.$dirty
                        }"
                        @blur="v$.dataset.label.$touch()"
                    />
                    <label for="label" class="kn-material-input-label">{{ $t('common.label') }} * </label>
                </span>
                <div class="p-d-flex p-flex-row p-jc-end">
                    <KnValidationMessages
                        :v-comp="v$.dataset.label"
                        :additional-translate-params="{
                            fieldName: $t('common.label')
                        }"
                    />
                    <p class="input-help p-m-0">{{ labelHelp }}</p>
                </div>
            </div>

            <div class="p-m-4">
                <span class="p-float-label">
                    <InputText
                        id="name"
                        v-model.trim="v$.dataset.name.$model"
                        class="kn-material-input"
                        :max-length="workspaceDataCloneDialogDescriptor.nameMaxLength"
                        :class="{
                            'p-invalid': v$.dataset.name.$invalid && v$.dataset.name.$dirty
                        }"
                        @blur="v$.dataset.name.$touch()"
                    />
                    <label for="name" class="kn-material-input-label">{{ $t('common.name') }} * </label>
                </span>
                <div class="p-d-flex p-flex-row p-jc-end">
                    <KnValidationMessages
                        :v-comp="v$.dataset.name"
                        :additional-translate-params="{
                            fieldName: $t('common.name')
                        }"
                    />
                    <p class="input-help p-m-0">{{ nameHelp }}</p>
                </div>
            </div>

            <div class="p-m-4">
                <span class="p-float-label p-mb-2">
                    <InputText id="description" v-model.trim="dataset.description" class="kn-material-input" :max-length="workspaceDataCloneDialogDescriptor.descriptionMaxLength" />
                    <label for="description" class="kn-material-input-label"> {{ $t('common.description') }} </label>
                </span>
                <div class="p-d-flex p-flex-row p-jc-end">
                    <p class="input-help p-m-0">{{ descriptionHelp }}</p>
                </div>
            </div>
        </form>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="buttonDisabled" data-test="save-button" @click="cloneDataset">{{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import Dialog from 'primevue/dialog'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import workspaceDataCloneDialogDescriptor from './WorkspaceDataCloneDialogDescriptor.json'
import useValidate from '@vuelidate/core'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'workspace-repository-move-dialog',
    components: { Dialog, KnValidationMessages },
    props: { visible: { type: Boolean }, propDataset: { type: Object } },
    emits: ['close', 'clone'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            workspaceDataCloneDialogDescriptor,
            dataset: {} as any
        }
    },
    validations() {
        return {
            dataset: createValidations('dataset', workspaceDataCloneDialogDescriptor.validations.dataset)
        }
    },
    computed: {
        labelHelp(): string {
            return (this.dataset.label?.length ?? '0') + ' / ' + workspaceDataCloneDialogDescriptor.labelMaxLength
        },
        nameHelp(): string {
            return (this.dataset.name?.length ?? '0') + ' / ' + workspaceDataCloneDialogDescriptor.nameMaxLength
        },
        descriptionHelp(): string {
            return (this.dataset.description?.length ?? '0') + ' / ' + workspaceDataCloneDialogDescriptor.descriptionMaxLength
        },
        buttonDisabled(): any {
            return this.v$.$invalid
        }
    },
    watch: {
        propDataset() {
            this.loadDataset()
        }
    },
    created() {
        this.loadDataset()
    },
    methods: {
        loadDataset() {
            if (this.propDataset) {
                this.dataset = { ...this.propDataset, id: '', dsVersions: [], usedByNDocs: 0, name: 'CLONE_' + this.propDataset.name, label: 'CLONE_' + this.propDataset.label, description: this.propDataset.description ? 'CLONED ' + this.propDataset.description : '', scopeCd: 'USER' }
                this.dataset.owner = (this.store.$state as any).user.userId
                if (this.dataset.catTypeId) {
                    delete this.dataset.catTypeId
                }
            }
        },
        closeDialog() {
            this.loadDataset()
            this.v$.$reset()
            this.$emit('close')
        },
        cloneDataset() {
            this.$emit('clone', this.dataset)
            this.loadDataset()
            this.v$.$reset()
        }
    }
})
</script>

<style lang="scss" scoped>
.input-help {
    font-size: smaller;
}
</style>
