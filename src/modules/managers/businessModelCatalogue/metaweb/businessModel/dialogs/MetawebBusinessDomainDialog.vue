<template>
    <Dialog class="bsdialog" :style="bsDescriptor.style.bsDialog" :visible="showBusinessDomainDialog" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary kn-width-full">
                <template #start>
                    {{ selectedBusinessDomain ? $t('metaweb.businessModel.editBusinessDomain') : $t('metaweb.businessModel.newBusinessDomain') }}
                </template>
            </Toolbar>
        </template>

        <form ref="bdForm" class="p-fluid p-formgrid p-grid p-mt-4 p-mx-2 kn-flex-0">
            <div class="p-field p-col-12 p-md-6">
                <span class="p-float-label">
                    <InputText
                        id="name"
                        v-model.trim="v$.tmpBusinessDomain.name.$model"
                        :disabled="saving"
                        class="kn-material-input"
                        :class="{
                            'p-invalid': v$.tmpBusinessDomain.name.$invalid && v$.tmpBusinessDomain.name.$dirty
                        }"
                        @blur="v$.tmpBusinessDomain.name.$touch()"
                    />
                    <label for="name" class="kn-material-input-label"> {{ $t('common.name') }} *</label>
                </span>
                <KnValidationMessages class="p-mt-1" :v-comp="v$.tmpBusinessDomain.name" :additional-translate-params="{ fieldName: $t('common.name') }" />
            </div>
            <div class="p-field p-col-12 p-md-6">
                <span class="p-float-label">
                    <InputText id="description" v-model="tmpBusinessDomain.description" :disabled="saving" class="kn-material-input" />
                    <label for="description" class="kn-material-input-label"> {{ $t('common.description') }}</label>
                </span>
            </div>
            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <MultiSelect id="tables" v-model="tmpBusinessDomain.tables" :disabled="saving" class="kn-material-input" :options="businessElementOptions" option-label="label" option-value="value" :filter="true" display="chip" />
                    <label for="tables" class="kn-material-input-label"> {{ $t('metaweb.businessModel.assignedEntities') }} *</label>
                </span>
            </div>
        </form>

        <template #footer>
            <Button class="p-button-text kn-button" :label="$t('common.cancel')" :disabled="saving" data-test="close-button" @click="closeDialog" />
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" :disabled="buttonDisabled" :loading="saving" data-test="save-button" @click="saveBusinessDomain" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent, PropType } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import bsDescriptor from '../MetawebBusinessModelDescriptor.json'
import { iBusinessDomain } from '../../Metaweb'
import mainStore from '@/App.store'

import { generate, applyPatch } from 'fast-json-patch'

export default defineComponent({
    name: 'metaweb-business-domain-dialog',
    components: { Dialog, InputText, MultiSelect, KnValidationMessages },
    props: {
        showBusinessDomainDialog: Boolean,
        meta: { type: Object, required: true },
        observer: { type: Object, required: true },
        selectedBusinessDomain: { type: Object as PropType<iBusinessDomain | null>, default: null }
    },
    emits: ['closeDialog', 'saved'],
    setup() {
        return { store: mainStore(), v$: useValidate() }
    },
    data() {
        return {
            bsDescriptor,
            metaObserve: {} as any,
            saving: false,
            tmpBusinessDomain: { id: null, name: '', description: '', uniqueName: null, tables: [] as string[] } as iBusinessDomain,
            businessElementOptions: [] as { label: string; value: string }[]
        }
    },
    computed: {
        buttonDisabled(): boolean {
            return this.saving || this.v$.$invalid || this.tmpBusinessDomain.tables.length === 0
        }
    },
    watch: {
        meta() {
            this.loadMeta()
            this.loadBusinessElementOptions()
        },
        selectedBusinessDomain: {
            handler() {
                this.loadBusinessDomain()
            },
            deep: true
        }
    },
    created() {
        this.loadMeta()
        this.loadBusinessElementOptions()
        this.loadBusinessDomain()
    },
    validations() {
        const businessDomainRequired = (value: string) => {
            return !this.showBusinessDomainDialog || value.trim().length > 0
        }
        const customValidators: ICustomValidatorMap = {
            'bm-dialog-required': businessDomainRequired
        }
        return {
            tmpBusinessDomain: createValidations('tmpBusinessDomain', bsDescriptor.validations.tmpBusinessModel, customValidators)
        }
    },
    methods: {
        loadMeta() {
            if (this.meta) {
                this.metaObserve = this.meta
            }
        },
        loadBusinessElementOptions() {
            if (!this.meta) {
                this.businessElementOptions = []
                return
            }

            const businessModels = (this.meta.businessModels ?? []).map((businessModel: any) => ({
                label: `${businessModel.name} (${this.$t('metaweb.businessModel.businessClass')})`,
                value: businessModel.uniqueName
            }))
            const businessViews = (this.meta.businessViews ?? []).map((businessView: any) => ({
                label: `${businessView.name} (${this.$t('metaweb.businessModel.businessView')})`,
                value: businessView.uniqueName
            }))

            this.businessElementOptions = [...businessModels, ...businessViews]
        },
        loadBusinessDomain() {
            if (!this.selectedBusinessDomain) {
                this.resetBusinessDomain()
                return
            }

            this.tmpBusinessDomain = {
                id: this.selectedBusinessDomain.id ?? null,
                name: this.selectedBusinessDomain.name ?? '',
                uniqueName: this.selectedBusinessDomain.uniqueName ?? null,
                description: this.selectedBusinessDomain.description ?? '',
                tables: [...(this.selectedBusinessDomain.tables ?? [])]
            }
        },
        resetBusinessDomain() {
            this.tmpBusinessDomain = { id: null, name: '', uniqueName: null, description: '', tables: [] }
        },
        closeDialog() {
            this.resetBusinessDomain()
            this.$emit('closeDialog')
        },
        async saveBusinessDomain() {
            this.v$.$touch()
            if (this.buttonDisabled) return
            this.saving = true
            try {
                const postData = {
                    data: {
                        id: this.tmpBusinessDomain.id,
                        originalName: this.selectedBusinessDomain?.name,
                        name: this.tmpBusinessDomain.name,
                        description: this.tmpBusinessDomain.description,
                        uniqueName: this.tmpBusinessDomain.uniqueName,
                        tables: this.tmpBusinessDomain.tables
                    },
                    diff: generate(this.observer)
                }
                const response: AxiosResponse = await this.$http.post(import.meta.env.VITE_KNOWAGEMETA_CONTEXT + '/restful-services/1.0/metaWeb/saveBusinessDomain', postData)
                this.metaObserve = applyPatch(this.metaObserve, response.data).newDocument
                generate(this.observer)
                this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('common.toast.success') })
                this.$emit('saved')
                this.closeDialog()
            } catch (error: unknown) {
                this.store.setError({
                    title: this.$t('common.toast.errorTitle'),
                    msg: typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : this.$t('common.error.generic')
                })
            } finally {
                this.saving = false
            }
        }
    }
})
</script>

<style lang="scss">
.bsdialog.p-dialog .p-dialog-header,
.bsdialog.p-dialog .p-dialog-content {
    padding: 0;
}
.bsdialog.p-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
</style>
