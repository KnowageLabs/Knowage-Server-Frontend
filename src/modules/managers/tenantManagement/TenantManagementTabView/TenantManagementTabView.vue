<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ tenant.TENANT_NAME }}</q-toolbar-title>

        <q-btn flat round dense icon="save" data-test="submit-button" @click="handleSubmit">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeTemplateConfirm">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
    <div class="card">
        <TabView class="tabview-custom" data-test="tab-view">
            <TabPanel>
                <template #header>
                    <span>{{ $t('managers.tenantManagement.detail.title') }}</span>
                </template>

                <TenantDetail :selected-tenant="tenant" :list-of-themes="listOfThemes" @fieldChanged="onFieldChange" />
            </TabPanel>

            <TabPanel>
                <template #header>
                    <span>{{ $t('managers.tenantManagement.dataSource.title') }}</span>
                </template>
                <q-card v-if="listOfDataSources && listOfSelectedDataSources">
                    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                        <q-toolbar-title>{{ $t('managers.tenantManagement.dataSource.title') }}</q-toolbar-title>
                    </q-toolbar>
                    <q-card-section>
                        <q-table :rows="listOfDataSources" row-key="ID" :columns="columns" dense flat v-model:selected="listOfSelectedDataSources" selection="multiple" :pagination="{ rowsPerPage: 20 }" @selection="setSelectedDataSources()"></q-table>
                    </q-card-section>
                </q-card>
            </TabPanel>
        </TabView>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { iTenant, iTenantToSave } from '../TenantManagement'
import { AxiosResponse } from 'axios'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import tabViewDescriptor from './TenantManagementTabViewDescriptor.json'
import TenantDetail from './DetailTab/TenantDetail.vue'
import mainStore from '../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    components: {
        TabView,
        TabPanel,
        TenantDetail
    },
    props: {
        selectedTenant: {
            type: Object,
            required: false
        },
        licenses: Array
    },
    emits: ['touched', 'closed', 'inserted'],
    data() {
        return {
            tabViewDescriptor,
            loading: false,
            touched: false,
            operation: 'insert',
            tenant: {} as iTenant,
            listOfThemes: [] as any,
            availableLicenses: [] as any,
            listOfDataSources: [] as any,
            listOfSelectedDataSources: [] as any,
            columns: [
                { name: 'label', label: this.$t('common.label'), field: 'LABEL', align: 'left', sortable: true },
                { name: 'description', label: this.$t('common.description'), field: 'DESCRIPTION', align: 'left', sortable: true }
            ]
        }
    },
    watch: {
        selectedTenant() {
            this.tenant = { ...this.selectedTenant } as iTenant
            this.getTenantData()
        },
        licenses() {
            this.availableLicenses = this.licenses
        }
    },
    mounted() {
        if (this.selectedTenant) {
            this.tenant = { ...this.selectedTenant } as iTenant
        }
        this.availableLicenses = this.licenses
        this.loadAllData()
        this.getTenantData()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo']),
        loadData(dataType: string) {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/multitenant${dataType}`)
        },

        async loadAllData() {
            this.loading = true
            await this.loadData('/themes').then((response: AxiosResponse<any>) => {
                this.listOfThemes = response.data.root
            })
            await this.loadData('/datasources').then((response: AxiosResponse<any>) => {
                this.listOfDataSources = response.data.root
            })
            this.loading = false
        },

        async getTenantData() {
            this.loading = true
            this.listOfSelectedDataSources = null
            this.touched = false

            await this.loadData(`/datasources?TENANT=${this.tenant.TENANT_NAME}`).then((response: AxiosResponse<any>) => {
                const dataSources = response.data.root

                this.listOfSelectedDataSources = []
                this.copySelectedElement(dataSources, this.listOfSelectedDataSources)
            })
            this.loading = false
        },
        copySelectedElement(source, selected) {
            for (let i = 0; i < source.length; i++) {
                if (source[i].CHECKED == true) {
                    selected.push(source[i])
                }
            }
        },

        validateTenantName(): boolean {
            return this.tenant.TENANT_NAME && this.tenant.TENANT_NAME.match(/^[a-zA-Z0-9_]+$/) ? true : false
        },

        async handleSubmit() {
            if (!this.validateTenantName()) {
                return
            }
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/multitenant/save'

            await this.$http.post(url, this.createTenantToSave()).then((response: AxiosResponse<any>) => {
                if (this.selectedTenant) {
                    this.setInfo({
                        title: this.$t(this.tabViewDescriptor.operation[this.operation].toastTitle),
                        msg: this.$t(this.tabViewDescriptor.operation.success)
                    })
                } else {
                    this.setInfo({
                        title: this.$t(this.tabViewDescriptor.operation[this.operation].toastTitle),
                        msg: this.$t(this.tabViewDescriptor.operation.success) + response.data.NEW_USER,
                        duration: 0
                    })
                }

                this.$emit('inserted')
                this.$router.replace('/tenants-management')
            })
        },

        createTenantToSave() {
            const tenantToSave = {} as iTenantToSave
            tenantToSave.TENANT_ID = this.tenant.TENANT_ID ? '' + this.tenant.TENANT_ID : ''
            tenantToSave.TENANT_NAME = this.tenant.TENANT_NAME
            this.tenant.TENANT_THEME ? (tenantToSave.TENANT_THEME = this.tenant.TENANT_THEME) : ''
            tenantToSave.TENANT_IMAGE = this.tenant.TENANT_IMAGE
            tenantToSave.TENANT_IMAGE_WIDE = this.tenant.TENANT_IMAGE_WIDE
            tenantToSave.DS_LIST = this.listOfSelectedDataSources.map((dataSource) => {
                delete dataSource.CHECKED
                return dataSource
            })
            return tenantToSave
        },

        closeTemplate() {
            this.$router.push('/tenants-management')
            this.$emit('closed')
        },

        onFieldChange(event) {
            this.tenant[event.fieldName] = event.value
            this.touched = true
            this.$emit('touched')
        },

        setSelectedDataSources() {
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
        }
    }
})
</script>

<style lang="scss" scoped>
::v-deep(.p-toolbar-group-right) {
    height: 100%;
}
</style>
