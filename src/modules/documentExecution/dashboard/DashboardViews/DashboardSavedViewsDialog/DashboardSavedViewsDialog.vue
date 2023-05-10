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
import { IDashboardView } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import Dialog from 'primevue/dialog'
import descriptor from './DashboardSavedViewsDialogDescriptor.json'
import appStore from '@/App.store'
import mockedViews from './mockedSavedViews.json'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

export default defineComponent({
    name: 'dashboard-saved-views-dialog',
    components: { Column, DataTable, Dialog },
    props: { visible: { required: true, type: Boolean } },
    emits: ['moveView', 'close'],
    data() {
        return {
            descriptor,
            savedViews: [] as IDashboardView[]
        }
    },
    watch: {
        visible() {
            this.loadSavedViews()
        }
    },
    created() {
        this.loadSavedViews()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadSavedViews() {
            // TODO - What service for Saved Views????
            this.setLoading(true)
            this.savedViews = [...mockedViews.data]
            this.setLoading(false)
        },
        moveView(view: IDashboardView) {
            console.log('------- MOVE VIEW: ', view)
            this.$emit('moveView', view)
        },
        executeView(view: IDashboardView) {
            console.log('------- EXECUTE VIEW: ', view)
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
            console.log('------- DELETE VIEW: ', view)
        },
        closeDialog() {
            this.savedViews = []
            this.$emit('close')
        }
    }
})
</script>
