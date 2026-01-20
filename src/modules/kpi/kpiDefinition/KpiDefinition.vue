<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" bordered :width="400" :breakpoint="0" show-if-above class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title> {{ $t('kpi.kpiDefinition.title') }}</q-toolbar-title>
                        <FabButton icon="fas fa-plus" data-test="open-form-button" @click="showForm" />
                    </q-toolbar>

                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                    <KnListBox v-if="!loading" class="col kn-height-full" :options="kpiList" :settings="kpiDefinitionDescriptor.knListSettings" @click="showForm" @clone.stop="emitCopyKpi" @delete.stop="deleteKpiConfirm" />

                    <q-toolbar class="q-pa-sm">
                        <q-space />
                        <q-btn flat round dense icon="chevron_left" @click="drawerVisible = false">
                            <q-tooltip>{{ $t('common.close') }}</q-tooltip>
                        </q-btn>
                    </q-toolbar>
                </q-drawer>

                <div class="col">
                    <q-btn v-if="!drawerVisible" flat round dense icon="chevron_right" class="drawer-toggle-btn" @click="drawerVisible = true">
                        <q-tooltip>{{ $t('common.open') }}</q-tooltip>
                    </q-btn>
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
import { useQuasar } from 'quasar'
import FabButton from '@/components/UI/KnFabButton.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import kpiDefinitionDescriptor from './KpiDefinitionDescriptor.json'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'kpi-definition',
    components: { FabButton, KnListBox },
    setup() {
        const store = mainStore()
        const router = useRouter()
        const $q = useQuasar()
        return { store, router, $q }
    },
    data() {
        return {
            loading: false,
            touched: false,
            displayModal: false,
            hintVisible: true,
            cloneKpi: false,
            drawerVisible: true,
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

        showForm(event: any) {
            const path = event.item ? `/kpi-definition/${event.item.id}/${event.item.version}` : '/kpi-definition/new-kpi'
            this.hintVisible = false

            if (!this.touched) {
                this.router.push(path)
            } else {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.unsavedChangesHeader'),
                        message: this.$t('common.toast.unsavedChangesMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => {
                        this.touched = false
                        this.router.push(path)
                    })
            }
        },

        emitCopyKpi(event: any) {
            if (!event.item) return
            this.router.push('/kpi-definition/new-kpi')
            this.hintVisible = false
            setTimeout(() => {
                this.cloneKpiId = event.item.id
                this.cloneKpiVersion = event.item.version
            }, 200)
        },

        deleteKpiConfirm(event: any) {
            if (!event.item) return
            this.$q
                .dialog({
                    title: this.$t('common.warning'),
                    message: this.$t('common.toast.deleteMessage'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.deleteKpi(event.item.id, event.item.version))
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

        onFormClose() {
            this.touched = false
            this.hintVisible = true
        }
    }
})
</script>

<style scoped>
.drawer-toggle-btn {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 100;
}
</style>
