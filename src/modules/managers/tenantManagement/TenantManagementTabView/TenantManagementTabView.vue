<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ tenant.TENANT_NAME }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="buttonDisabled" data-test="submit-button" @click="handleSubmit">
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
                    <span>{{ $t('managers.tenantManagement.productTypes.title') }}</span>
                </template>

                <ProductTypes :title="$t('managers.tenantManagement.productTypes.title')" :data-list="listOfProductTypes" :selected-data="listOfSelectedProducts" @changed="setSelectedProducts($event)" />
            </TabPanel>

            <TabPanel>
                <template #header>
                    <span>{{ $t('managers.tenantManagement.dataSource.title') }}</span>
                </template>

                <ProductTypes :title="$t('managers.tenantManagement.dataSource.title')" :data-list="listOfDataSources" :selected-data="listOfSelectedDataSources" @changed="setSelectedDataSources($event)" />
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
import ProductTypes from './SelectionTableTab/SelectionTable.vue'
import mainStore from '../../../../App.store'

export default defineComponent({
    components: {
        TabView,
        TabPanel,
        TenantDetail,
        ProductTypes
    },
    props: {
        selectedTenant: {
            type: Object,
            required: false
        },
        licenses: Array
    },
    emits: ['touched', 'closed', 'inserted'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            tabViewDescriptor,
            loading: false,
            touched: false,
            operation: 'insert',
            tenant: {} as iTenant,
            listOfThemes: [] as any,
            availableLicenses: [] as any,
            listOfProductTypes: [] as any,
            listOfSelectedProducts: [] as any,
            listOfDataSources: [] as any,
            listOfSelectedDataSources: [] as any
        }
    },
    computed: {
        buttonDisabled(): any {
            if ((this.listOfSelectedProducts && this.listOfSelectedProducts.length === 0) || (this.listOfSelectedDataSources && this.listOfSelectedDataSources.length === 0) || !this.validateTenantName()) {
                return true
            }
            return false
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
            await this.loadData('/producttypes').then((response: AxiosResponse<any>) => {
                this.listOfProductTypes = response.data.root
                this.filterArrayByTargetArr(this.listOfProductTypes, this.availableLicenses)
            })
            this.loading = false
        },

        filterArrayByTargetArr(sourceArr, targetArr) {
            const newArr = sourceArr.filter((elem) => targetArr.find((target) => elem.LABEL == target.product))
            this.listOfProductTypes = newArr
        },

        async getTenantData() {
            this.loading = true
            this.listOfSelectedProducts = null
            this.listOfSelectedDataSources = null
            this.touched = false

            await this.loadData(`/producttypes?TENANT=${this.tenant.TENANT_NAME}`).then((response: AxiosResponse<any>) => {
                const productTypes = response.data.root

                this.listOfSelectedProducts = []
                this.copySelectedElement(productTypes, this.listOfSelectedProducts)
            })
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
                    this.store.setInfo({
                        title: this.$t(this.tabViewDescriptor.operation[this.operation].toastTitle),
                        msg: this.$t(this.tabViewDescriptor.operation.success)
                    })
                } else {
                    this.store.setInfo({
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
            tenantToSave.PRODUCT_TYPE_LIST = this.listOfSelectedProducts.map((productType) => {
                delete productType.CHECKED
                return productType
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

        setSelectedProducts(categories: any[]) {
            this.listOfSelectedProducts = categories
            this.touched = true
            this.$emit('touched')
        },

        setSelectedDataSources(categories: any[]) {
            this.listOfSelectedDataSources = categories
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
