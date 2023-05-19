<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visible" :header="$t('documentExecution.main.savedViews')" :style="descriptor.dialogStyle" :closable="false" modal :breakpoints="descriptor.dialogBreakpoints">
        <DataTable class="p-datatable-sm kn-table p-mx-2" :value="savedViews" data-key="name" responsive-layout="stack" breakpoint="600px">
            <template #empty>
                {{ $t('common.info.noDataFound') }}
            </template>
            <Column v-for="col of descriptor.columns" :key="col.field" :field="col.field" :header="$t(col.header)" :sortable="true" />
            <Column class="icon-cell" :style="descriptor.iconColumnStyle">
                <template #body="slotProps">
                    <Button icon="pi pi-copy" class="p-button-link" @click="moveView(slotProps.data)" />
                    <Button icon="fa fa-play-circle" class="p-button-link" @click="executeView(slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-link" @click="deleteViewConfirm(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.close') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { IDashboardView } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import { deleteDashboardView } from '../DashboardViewsHelper'
import Dialog from 'primevue/dialog'
import descriptor from './DashboardSavedViewsDialogDescriptor.json'
import appStore from '@/App.store'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

export default defineComponent({
    name: 'dashboard-saved-views-dialog',
    components: { Column, DataTable, Dialog },
    props: { visible: { required: true, type: Boolean } },
    emits: ['moveView', 'close', 'executeView'],
    data() {
        return {
            descriptor,
            savedViews: [] as IDashboardView[]
        }
    },
    watch: {
        async visible() {
            await this.loadSavedViews()
        }
    },
    async created() {
        await this.loadSavedViews()
    },
    methods: {
        ...mapActions(appStore, ['setLoading', 'setInfo']),
        async loadSavedViews() {
            this.setLoading(true)
            // TODO BE - Remove mocked/specific id for folder service, wait for proper service for getting all views related to the document
            await this.$http.get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/536a71d6-9a18-45c9-b991-7c81410b36ee`).then((response: AxiosResponse<any>) => {
                this.savedViews = [...response.data.content]
            })
            this.setLoading(false)
        },
        moveView(view: IDashboardView) {
            this.$emit('moveView', view)
        },
        executeView(view: IDashboardView) {
            this.$emit('executeView', view)
        },
        deleteViewConfirm(view: IDashboardView) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => await this.deleteView(view)
            })
        },
        async deleteView(view: IDashboardView) {
            this.setLoading(true)
            await deleteDashboardView(view, this.$http)
                .then(async () => {
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.removeViewFromSavedViews(view)
                })
                .catch(() => {})
            this.setLoading(false)
        },
        removeViewFromSavedViews(view: IDashboardView) {
            const index = this.savedViews.findIndex((tempView: IDashboardView) => tempView.id === view.id)
            if (index !== -1) this.savedViews.splice(index, 1)
        },
        closeDialog() {
            this.savedViews = []
            this.$emit('close')
        }
    }
})
</script>
