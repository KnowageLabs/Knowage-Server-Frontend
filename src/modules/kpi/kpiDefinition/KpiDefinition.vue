<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row">
                <div class="kn-list--column col-3">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title> {{ $t('kpi.kpiDefinition.title') }}</q-toolbar-title>
                        <FabButton icon="fas fa-plus" data-test="open-form-button" @click="showForm" />
                    </q-toolbar>

                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                    <KnListBox v-if="!loading" class="kn-height-full" :options="kpiList" :settings="kpiDefinitionDescriptor.knListSettings" @click="showForm" @clone.stop="emitCopyKpi" @delete.stop="deleteKpiConfirm" />
                </div>

                <div class="col-9">
                    <router-view :clone-kpi-id="cloneKpiId" :clone-kpi-version="cloneKpiVersion" @touched="touched = true" @closed="onFormClose" @kpiUpdated="reloadAndReroute" @kpiCreated="reloadAndReroute" />
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { useRouter } from 'vue-router'
import FabButton from '@/components/UI/KnFabButton.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import kpiDefinitionDescriptor from './KpiDefinitionDescriptor.json'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'kpi-definition',
    components: { FabButton, KnListBox },
    setup() {
        const store = mainStore()
        const router = useRouter()
        return { store, router }
    },
    data() {
        return {
            loading: false,
            touched: false,
            displayModal: false,
            hintVisible: true,
            cloneKpi: false,
            kpiList: [] as any,
            kpiToClone: {} as any,
            cloneKpiId: Number,
            cloneKpiVersion: Number,
            kpiDefinitionDescriptor: kpiDefinitionDescriptor
        }
    },
    async created() {
        await this.getKpiList()
    },
    methods: {
        async getKpiList() {
            this.loading = true
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/listKpi`)
                .then((response: AxiosResponse<any>) => {
                    this.kpiList = [...response.data]
                })
                .finally(() => (this.loading = false))
        },

        deleteKpiConfirm(event: any) {
            if (!event.item) return
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteKpi(event.item.id, event.item.version)
            })
        },
        async deleteKpi(kpiId: number, kpiVersion: number) {
            await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${kpiId}/${kpiVersion}/deleteKpi`).then(() => {
                this.store.setInfo({
                    title: this.$t('common.toast.deleteTitle'),
                    msg: this.$t('common.toast.deleteSuccess')
                })
                this.router.push('/kpi-definition')
                this.getKpiList()
            })
        },

        showForm(event: any) {
            const path = event.item ? `/kpi-definition/${event.item.id}/${event.item.version}` : '/kpi-definition/new-kpi'
            this.hintVisible = false
            if (!this.touched) {
                this.router.push(path)
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.router.push(path)
                    }
                })
            }
        },
        pageReload() {
            this.touched = false
            this.hintVisible = true
        },
        onFormClose() {
            this.touched = false
            this.hintVisible = true
        },
        formatDate(date) {
            return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
        },
        async reloadAndReroute(event) {
            await this.getKpiList()

            const kpiToLoad = this.kpiList.find((kpi) => {
                if (kpi.name === event) return true
            })
            let path = ''
            if (kpiToLoad) path = `/kpi-definition/${kpiToLoad.id}/${kpiToLoad.version}`

            this.router.push(path)

            this.touched = false
            this.hintVisible = false
        },
        emitCopyKpi(event: any) {
            if (!event.item) return
            this.router.push('/kpi-definition/new-kpi')
            this.hintVisible = false
            setTimeout(() => {
                this.cloneKpiId = event.item.id
                this.cloneKpiVersion = event.item.version
            }, 200)
        }
    }
})
</script>
