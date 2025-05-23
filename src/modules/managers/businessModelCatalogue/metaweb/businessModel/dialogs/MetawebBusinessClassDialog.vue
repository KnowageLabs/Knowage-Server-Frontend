<template>
    <Dialog class="bsdialog" :style="bsDescriptor.style.bsDialog" :visible="showBusinessClassDialog" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary kn-width-full">
                <template #start>
                    {{ $t('metaweb.businessModel.newBusiness') }}
                </template>
            </Toolbar>
        </template>
        <form ref="bcForm" class="p-fluid p-formgrid p-grid p-mt-4 p-mx-2 kn-flex-0">
            <div class="p-field p-col-12 p-md-6">
                <span class="p-float-label">
                    <InputText
                        id="name"
                        v-model.trim="v$.tmpBusinessModel.name.$model"
                        class="kn-material-input"
                        :class="{
                            'p-invalid': v$.tmpBusinessModel.name.$invalid && v$.tmpBusinessModel.name.$dirty
                        }"
                        @blur="v$.tmpBusinessModel.name.$touch()"
                        @change="$emit('touched')"
                    />
                    <label for="name" class="kn-material-input-label"> {{ $t('common.name') }} *</label>
                </span>
                <KnValidationMessages class="p-mt-1" :v-comp="v$.tmpBusinessModel.name" :additional-translate-params="{ fieldName: $t('common.name') }" />
            </div>
            <div class="p-field p-col-12 p-md-6">
                <span class="p-float-label">
                    <InputText id="desc" v-model="tmpBusinessModel.description" class="kn-material-input" />
                    <label for="desc" class="kn-material-input-label"> {{ $t('common.description') }}</label>
                </span>
            </div>
            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <Dropdown id="driver" v-model="tmpBusinessModel.physicalModel" class="kn-material-input" :filter="true" :options="physicalModels" option-label="name" />
                    <label for="driver" class="kn-material-input-label"> {{ $t('metaweb.businessModel.physTable') }}</label>
                </span>
            </div>
        </form>

        <div class="kn-relative kn-flex">
            <div class="kn-height-full kn-width-full kn-absolute">
                <DataTable
                    v-if="tmpBusinessModel.physicalModel"
                    v-model:selection="tmpBusinessModel.selectedColumns"
                    v-model:filters="filters"
                    :value="tmpBusinessModel.physicalModel.columns"
                    class="p-datatable-sm kn-table p-ml-2"
                    :scrollable="true"
                    :scroll-height="bsDescriptor.style.mainList"
                    data-key="position"
                    :global-filter-fields="bsDescriptor.globalFilterFields"
                >
                    <template #empty>
                        {{ $t('common.info.noDataFound') }}
                    </template>
                    <template #header>
                        <div class="table-header p-d-flex">
                            <span class="p-input-icon-left p-mr-3 p-col-12">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" class="kn-material-input" :placeholder="$t('common.search')" data-test="search-input" />
                            </span>
                        </div>
                    </template>
                    <Column selection-mode="multiple" />
                    <Column field="name" :header="$t('common.name')" :style="bsDescriptor.style.tableCell" />
                </DataTable>
            </div>
        </div>
        <template #footer>
            <Button class="p-button-text kn-button" :label="$t('common.cancel')" data-test="close-button" @click="closeDialog" />
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" :disabled="buttonDisabled" data-test="save-button" @click="saveBusinessClass" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import bsDescriptor from '../MetawebBusinessModelDescriptor.json'

import { generate, applyPatch } from 'fast-json-patch'

export default defineComponent({
    name: 'document-drivers',
    components: { Dialog, Dropdown, DataTable, Column, KnValidationMessages },
    props: { physicalModels: Array, showBusinessClassDialog: Boolean, meta: Object, observer: { type: Object } },
    emits: ['closeDialog'],
    data() {
        return {
            bsDescriptor,
            v$: useValidate() as any,
            metaObserve: {} as any,
            tmpBusinessModel: { physicalModel: null, selectedColumns: [], name: '', description: '' } as any,
            filters: {
                global: [filterDefault]
            } as Object
        }
    },
    computed: {
        buttonDisabled(): boolean {
            if (this.v$.$invalid || this.tmpBusinessModel.selectedColumns.length === 0) {
                return true
            } else return false
        }
    },
    watch: {
        meta() {
            this.loadMeta()
        }
    },
    created() {
        this.loadMeta()
    },
    validations() {
        const bmRequired = (value) => {
            return !this.showBusinessClassDialog || value
        }
        const customValidators: ICustomValidatorMap = {
            'bm-dialog-required': bmRequired
        }
        const validationObject = {
            tmpBusinessModel: createValidations('tmpBusinessModel', bsDescriptor.validations.tmpBusinessModel, customValidators)
        }
        return validationObject
    },
    methods: {
        async loadMeta() {
            this.meta ? (this.metaObserve = this.meta) : ''
        },
        resetPhModel() {
            this.tmpBusinessModel.selectedColumns = []
        },
        closeDialog() {
            this.$emit('closeDialog')
            this.tmpBusinessModel = { physicalModel: { columns: [] }, selectedColumns: [], name: '', description: '' } as any
        },
        async saveBusinessClass() {
            const objToSend = { selectedColumns: [] } as any
            objToSend.name = this.tmpBusinessModel.name
            objToSend.description = this.tmpBusinessModel.description
            objToSend.physicalModel = this.tmpBusinessModel.physicalModel.name
            this.tmpBusinessModel.selectedColumns.forEach((element) => {
                objToSend.selectedColumns.push(element.name)
            })
            const postData = { data: objToSend, diff: generate(this.observer) }
            await this.$http
                .post(import.meta.env.VITE_KNOWAGEMETA_CONTEXT + `/restful-services/1.0/metaWeb/addBusinessClass`, postData)
                .then(async (response: AxiosResponse<any>) => {
                    this.metaObserve = applyPatch(this.metaObserve, response.data)
                    generate(this.observer)
                    this.closeDialog()
                })
                .catch(() => {})
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
