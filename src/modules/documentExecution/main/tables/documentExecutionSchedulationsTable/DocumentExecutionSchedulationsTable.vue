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
import mainStore from '../../../../../App.store'
import { mapActions, mapState } from 'pinia'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'

export default defineComponent({
    name: 'document-execution-schedulations-table',
    components: { Column, DataTable, Message },
    props: { propSchedulations: { type: Array } },
    emits: ['deleteSchedulation', 'close'],
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
    computed: {
        ...mapState(mainStore, ['user'])
    },
    watch: {
        propSchedulations() {
            this.loadSchedulations()
        }
    },
    created() {
        this.loadSchedulations()
    },
    methods: {
        ...mapActions(mainStore, ['setLoading']),
        loadSchedulations() {
            this.schedulations = this.propSchedulations as any[]
        },
        getFormattedDate(date: any, format: any) {
            return formatDate(date, format)
        },
        async downloadSnapshot(schedulation: any) {
            this.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/snapshotsContent?OBJECT_ID=${schedulation.biobjId}&SNAPSHOT_ID=${schedulation.id}`, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
                    }
                })
                .then((response) => {
                    downloadDirectFromResponse(response)
                })
                .finally(() => this.setLoading(false))
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
