<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ attribute?.attributeName }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="buttonDisabled" data-test="submit-button" @click="handleSubmit">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeTemplateConfirm">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
    <div class="kn-page-content">
        <MondrianSchemasDetailTab :selected-schema="selectedSchema" :reload-table="reloadVersionTable" @fieldChanged="onFieldChange" @activeVersionChanged="onVersionChange" @versionUploaded="versionToSave = $event" @versionsReloaded="reloadVersionTable = false" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iSchema } from './MondrianSchemas'
import { AxiosResponse } from 'axios'
import tabViewDescriptor from './MondrianSchemasTabViewDescriptor.json'
import useValidate from '@vuelidate/core'
import MondrianSchemasDetailTab from './MondrianSchemasDetailTab/MondrianSchemasDetailTab.vue'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    components: {
        MondrianSchemasDetailTab
    },
    props: {
        id: {
            type: String,
            required: false
        }
    },
    emits: ['touched', 'closed', 'inserted'],
    data() {
        return {
            loading: false,
            tabViewDescriptor: tabViewDescriptor,
            selectedSchema: {} as iSchema,
            v$: useValidate() as any,
            versionToSave: null as any,
            reloadVersionTable: false,
            touched: false
        }
    },
    computed: {
        buttonDisabled(): any {
            if (!this.selectedSchema.id && !this.versionToSave) {
                return true
            }
            return this.v$.$invalid
        },
        operation() {
            if (this.id) {
                return 'update'
            }
            return 'insert'
        }
    },
    watch: {
        id() {
            this.v$.$reset()
            this.loadSelectedSchema()
            this.touched = false
        }
    },
    async created() {
        this.loadSelectedSchema()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo']),
        closeTemplate() {
            this.$router.push('/mondrian-schemas-management')
            this.$emit('closed')
        },
        onFieldChange(event) {
            this.selectedSchema[event.fieldName] = event.value
            this.touched = true
            this.$emit('touched')
        },
        onVersionChange(event) {
            this.selectedSchema.currentContentId = event
            this.touched = true
            this.$emit('touched')
        },
        closeTemplateConfirm() {
            if (!this.touched) {
                this.closeTemplate()
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.closeTemplate()
                    }
                })
            }
        },
        async loadSelectedSchema() {
            this.loading = true
            if (this.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/mondrianSchemasResource/${this.id}`).then((response: AxiosResponse<any>) => (this.selectedSchema = response.data))
            } else {
                this.selectedSchema = {} as iSchema
            }
            this.loading = false
        },

        async handleSubmit() {
            if (this.v$.$invalid) {
                return
            }
            this.selectedSchema.type = 'MONDRIAN_SCHEMA'
            let url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/mondrianSchemasResource/`
            if (this.selectedSchema.id) {
                url += this.selectedSchema.id
            }
            await this.createOrUpdate(url).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.setError({
                        title: this.$t('managers.mondrianSchemasManagement.toast.schema.error'),
                        msg: response.data.errors
                    })
                } else {
                    this.setInfo({
                        title: this.$t(this.tabViewDescriptor.operation[this.operation].toastTitle),
                        msg: this.$t(this.tabViewDescriptor.operation.success)
                    })
                    this.onSaveSuccess(response)
                }
            })
        },
        async createOrUpdate(url) {
            return this.operation === 'update' ? this.$http.put(url, this.selectedSchema) : this.$http.post(url, this.selectedSchema)
        },
        async onSaveSuccess(response: AxiosResponse<any>) {
            if (this.operation === 'insert') {
                this.selectedSchema.id = response.data.id
            }
            await this.uploadFile()

            this.versionToSave = null
            if (this.operation === 'insert') {
                this.$router.push(`/mondrian-schemas-management/${this.selectedSchema.id}`)
            } else {
                this.reloadVersionTable = true
            }
            this.$emit('inserted')
            this.touched = false
        },

        async uploadFile() {
            if (!this.versionToSave) {
                return
            }
            const formData = new FormData()
            formData.append('file', this.versionToSave)
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/mondrianSchemasResource/${this.selectedSchema.id}` + '/versions'
            await this.$http.post(url, formData).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.setError({
                        title: this.$t('managers.mondrianSchemasManagement.toast.uploadFile.error'),
                        msg: response.data.errors
                    })
                } else {
                    this.setInfo({
                        title: this.$t('managers.mondrianSchemasManagement.toast.uploadFile.uploaded'),
                        msg: this.$t('managers.mondrianSchemasManagement.toast.uploadFile.ok')
                    })
                }
            })
        }
    }
})
</script>
