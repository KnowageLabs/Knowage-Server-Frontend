<template>
    <div class="p-grid p-m-0">
        <Toolbar class="kn-toolbar kn-toolbar--primary p-col-12">
            <template #start>{{ $t('documentExecution.main.scheduledExecutions') }} </template>

            <template #end>
                <Button id="document-execution-schedulations-close-button" class="kn-button kn-button--primary" @click="closeTable"> {{ $t('common.close') }}</Button>
            </template>
        </Toolbar>

        <DataTable
            id="old-chedulations-table"
            v-model:filters="filters"
            :value="schedulations"
            class="p-datatable-sm kn-table p-col-12"
            data-key="id"
            :global-filter-fields="documentExecutionSchedulationsTableDescriptor.globalFilterFields"
            :paginator="schedulations.length > 20"
            :rows="20"
            responsive-layout="stack"
            breakpoint="600px"
        >
            <template #empty>
                <Message class="p-m-2" severity="info" :closable="false" :style="documentExecutionSchedulationsTableDescriptor.styles.message">
                    {{ $t('common.info.noDataFound') }}
                </Message>
            </template>
            <template #header>
                <div class="table-header p-d-flex p-ai-center">
                    <span id="search-container" class="p-input-icon-left p-mr-3">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" />
                    </span>
                </div>
            </template>

            <Column key="name" class="kn-truncated" field="name" :header="$t('common.name')" :sortable="true"></Column>
            <Column key="description" class="kn-truncated" field="description" :header="$t('common.description')" :sortable="true"></Column>
            <Column key="dateCreation" class="kn-truncated" field="dateCreation" :header="$t('common.creationDate')" :sortable="true">
                <template #body="slotProps">
                    {{ getFormattedDate(slotProps.data.dateCreation, 'DD/MM/YYYY hh:mm') }}
                </template>
            </Column>
            <Column :style="documentExecutionSchedulationsTableDescriptor.iconColumn.style">
                <template #body="slotProps">
                    <Button v-tooltip.top="$t('common.download')" icon="pi pi-download" class="p-button-link" @click="downloadSnapshot(slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-link" @click="deleteSchedulationConfirm(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <DocumentExecutionSnapshotDialog :visible="snapshotDialogVisible" :prop-url="url" @close="snapshotDialogVisible = false"></DocumentExecutionSnapshotDialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { formatDate } from '@/helpers/commons/localeHelper'
import { iSchedulation } from '../../DocumentExecution'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import documentExecutionSchedulationsTableDescriptor from './DocumentExecutionSchedulationsTableDescriptor.json'
import DocumentExecutionSnapshotDialog from './DocumentExecutionSnapshotDialog.vue'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-execution-schedulations-table',
    components: { Column, DataTable, DocumentExecutionSnapshotDialog, Message },
    props: { propSchedulations: { type: Array } },
    emits: ['deleteSchedulation', 'close'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            documentExecutionSchedulationsTableDescriptor,
            schedulations: [] as iSchedulation[],
            filters: { global: [filterDefault] } as Object,
            url: '' as string,
            snapshotDialogVisible: false,
            user: null as any
        }
    },
    watch: {
        propSchedulations() {
            this.loadSchedulations()
        }
    },
    created() {
        this.user = (this.store.$state as any).user
        this.loadSchedulations()
    },
    methods: {
        loadSchedulations() {
            this.schedulations = this.propSchedulations as any[]
        },
        getFormattedDate(date: any, format: any) {
            return formatDate(date, format)
        },
        downloadSnapshot(schedulation: any) {
            this.url = `${import.meta.env.VITE_HOST_URL}${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?NEW_SESSION=TRUE&user_id=${this.user?.userUniqueIdentifier}&ACTION_NAME=GET_SNAPSHOT_CONTENT&SNAPSHOT_ID=${schedulation.id}&LIGHT_NAVIGATOR_DISABLED=TRUE&OBJECT_ID=${
                schedulation.biobjId
            }`
            this.snapshotDialogVisible = true
        },
        deleteSchedulationConfirm(schedulation: iSchedulation) {
            this.$confirm.require({
                message: this.$t('documentExecution.dossier.deleteConfirm'),
                header: this.$t('documentExecution.dossier.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.$emit('deleteSchedulation', schedulation)
            })
        },
        closeTable() {
            this.schedulations = []
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss" scoped>
#document-execution-schedulations-close-button {
    font-size: 0.75rem;
}
</style>
