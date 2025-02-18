<template>
    <div class="grid">
        <Toolbar class="kn-toolbar kn-toolbar--secondary p-col-12">
            <template #start>{{ $t('documentExecution.main.scheduledExecutions') }} </template>

            <template #end>
                <q-btn flat :label="$t('common.close')" @click="closeTable" />
            </template>
        </Toolbar>

        <div class="row">
            <q-input class="q-ma-md col-sm-6 col-md-3 col-xs-12" dense filled v-model="filter" :label="$t('common.search')" data-test="search-input">
                <template v-slot:prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </div>

        <div class="row">
            <q-table class="col" flat dense :filter="filter" :rows="schedulations" :columns="columns" :visible-columns="['name', 'description', 'dateCreation', 'buttons']" row-key="name">
                <template #no-data
                    ><div class="full-width row flex-center text-accent q-gutter-sm">
                        <Message class="p-m-2" severity="info" :closable="false" data-test="no-documents-hint">
                            {{ $t('common.info.noDataFound') }}
                        </Message>
                    </div>
                </template>
                <template #body-cell-buttons="slotProps">
                    <q-td class="text-right">
                        <q-btn flat round size="xs" color="primary" icon="fa fa-download" @click.stop="downloadSnapshot(slotProps.row)">
                            <q-tooltip>{{ $t('common.download') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round size="xs" color="primary" icon="fa fa-trash" @click.stop="deleteSchedulationConfirm(slotProps.row)">
                            <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </div>

        <DocumentExecutionSnapshotDialog :visible="snapshotDialogVisible" :prop-url="url" @close="snapshotDialogVisible = false"></DocumentExecutionSnapshotDialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
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
            filter: '' as string,
            url: '' as string,
            snapshotDialogVisible: false,
            user: null as any,
            columns: [
                {
                    align: 'left',
                    field: 'name',
                    headerClasses: 'text-capitalize',
                    label: this.$t('common.name'),
                    name: 'name',
                    sortable: true
                },
                {
                    align: 'left',
                    field: 'description',
                    headerClasses: 'text-capitalize',
                    label: this.$t('common.description'),
                    name: 'description',
                    sortable: true
                },
                {
                    align: 'left',
                    field: 'dateCreation',
                    headerClasses: 'text-capitalize',
                    format: (val) => this.getFormattedDate(val, 'DD/MM/YYYY hh:mm'),
                    label: this.$t('common.creationDate'),
                    name: 'dateCreation',
                    sortable: true
                },
                {
                    align: 'right',
                    field: 'buttons',
                    name: 'buttons',
                    label: '',
                    sortable: false
                }
            ]
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
