<template>
    <Toolbar class="kn-toolbar kn-toolbar--secondary p-m-0">
        <template #start>{{ selectedLayer.label }}</template>
        <template #end>
            <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="buttonDisabled" data-test="submit-button" @click="saveLayer" />
            <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="closeTemplateConfirm" />
        </template>
    </Toolbar>

    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
    <TabView v-model:activeIndex="activeIndex" class="kn-overflow" @tab-change="onTabChange">
        <TabPanel>
            <template #header>
                <span>{{ $t('managers.layersManagement.layerTitle') }}</span>
            </template>
            <LayerTab :selected-layer="selectedLayer" :all-roles="allRoles" :all-categories="allCategories" @touched="$emit('touched')" />
        </TabPanel>

        <TabPanel v-if="layer.layerId">
            <template #header>
                <span>{{ $t('managers.layersManagement.filterTitle') }}</span>
            </template>
            <FilterTab :selected-layer="selectedLayer" :prop-filters="filters" />
        </TabPanel>
    </TabView>
    <Toast position="top-left" group="tl" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { iFilter } from '../LayersManagement'
import useValidate from '@vuelidate/core'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import LayerTab from './layerTab/LayersManagementLayerTab.vue'
import FilterTab from './filterTab/LayersManagementFilterTab.vue'
import Toast from 'primevue/toast'
import mainStore from '../../../../App.store'

export default defineComponent({
    components: { TabView, TabPanel, LayerTab, FilterTab, Toast },
    props: { selectedLayer: { type: Object, required: true }, allRoles: { type: Array, required: true }, allCategories: { type: Array, required: true } },
    emits: ['touched', 'closed', 'saved'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            touched: false,
            layer: {} as any,
            loading: false,
            activeIndex: 0,
            filters: [] as iFilter[]
        }
    },
    computed: {
        buttonDisabled(): boolean {
            return this.v$.$invalid
        }
    },
    watch: {
        selectedLayer() {
            this.loadLayer()
            this.getRolesForLayer()
        }
    },
    async created() {
        this.loadLayer()
        this.getRolesForLayer()
    },
    methods: {
        loadLayer() {
            this.layer = this.selectedLayer
            this.layer.properties = this.layer.properties
                ? this.layer.properties.map((property: string) => {
                      return {
                          property: property
                      }
                  })
                : []
        },
        async getRolesForLayer() {
            if (this.layer.layerId) {
                await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/postitem`, this.selectedLayer).then((response: AxiosResponse<any>) => (this.layer.roles = response.data))
            }
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
        closeTemplate() {
            this.$router.push('/layers-management')
            this.$emit('closed')
        },
        onTabChange() {
            if (this.activeIndex === 1) {
                this.loadFilters()
            }
        },
        async loadFilters() {
            if (this.layer) {
                this.loading = true
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/getFilter?id=${this.layer.layerId}`).then((response: AxiosResponse<any>) => (this.filters = response.data))
                this.loading = false
            }
        },
        saveOrUpdateMessage(layer) {
            let toSend = layer
            let url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/layers'
            if (this.layer.layerFile) {
                const formData = new FormData()
                formData.append('data', JSON.stringify(this.layer))
                formData.append('layerFile', this.layer.layerFile.file)
                if (layer.layerId) {
                    url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/layers/updateData'
                } else url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/layers/addData'
                toSend = formData
            }
            if (layer.layerId) {
                return this.$http.put(url, toSend, { headers: { 'X-Disable-Errors': 'true' } })
            } else return this.$http.post(url, toSend, { headers: { 'X-Disable-Errors': 'true' } })
        },
        async saveLayer() {
            this.layer.roles === null ? (this.layer.roles = []) : ''
            await this.saveOrUpdateMessage(this.layer)
                .then((response: AxiosResponse<any>) => {
                    this.store.setInfo({
                        title: this.$t('common.toast.success'),
                        msg: this.$t('common.toast.success')
                    })
                    const id = this.layer.layerId ? this.layer.layerId : response.data.id
                    this.$emit('saved', id)
                })
                .catch((response) => {
                    this.$toast.add({ severity: 'error', summary: this.$t('common.error.generic'), detail: response.message, life: 3000 })
                })
        }
    }
})
</script>
