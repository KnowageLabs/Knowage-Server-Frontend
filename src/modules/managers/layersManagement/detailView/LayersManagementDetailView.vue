<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ selectedLayer.label }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="buttonDisabled" data-test="submit-button" @click="saveLayer">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeTemplateConfirm">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>

    <TabView v-model:activeIndex="activeIndex" class="kn-overflow">
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
            <FilterTab :selected-layer="selectedLayer" />
        </TabPanel>
    </TabView>
    <Toast position="top-left" group="tl" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import LayerTab from './layerTab/LayersManagementLayerTab.vue'
import FilterTab from './filterTab/LayersManagementFilterTab.vue'
import Toast from 'primevue/toast'
import mainStore from '../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    components: { TabView, TabPanel, LayerTab, FilterTab, Toast },
    props: { selectedLayer: { type: Object, required: true }, allRoles: { type: Array, required: true }, allCategories: { type: Array, required: true } },
    emits: ['touched', 'closed', 'saved'],
    data() {
        return {
            v$: useValidate() as any,
            touched: false,
            layer: {} as any,
            activeIndex: 0
        }
    },
    computed: {
        buttonDisabled(): boolean {
            return this.v$.$invalid
        }
    },
    async updated() {
        this.loadLayer()
        this.getRolesForLayer()
    },
    async created() {
        this.loadLayer()
        this.getRolesForLayer()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo']),
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
                    this.setInfo({
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
