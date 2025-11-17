<template>
    <Message class="p-m-2" severity="info" :closable="false" :style="workspaceSchedulationOldSchedulationsTableDescriptor.styles.message">
        {{ $t('workspace.schedulation.oldSchedulationsMessage') }}
    </Message>
    <DataTable id="old-chedulations-table" v-model:filters="filters" :value="schedulations" class="p-datatable-sm kn-table" data-key="id" :global-filter-fields="workspaceSchedulationOldSchedulationsTableDescriptor.globalFilterFields" :paginator="schedulations.length > 20" :rows="20" responsive-layout="stack" breakpoint="600px">
        <template #empty>
            <Message class="p-m-2" severity="info" :closable="false" :style="workspaceSchedulationOldSchedulationsTableDescriptor.styles.message">
                {{ $t('common.info.noDataFound') }}
            </Message>
        </template>
        <template #header>
            <div class="table-header p-d-flex p-ai-center">
                <span id="search-container" class="p-input-icon-left p-mr-3">
                    <i class="pi pi-search" />
                    <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" data-test="search-input" />
                </span>
            </div>
        </template>

        <Column key="name" class="kn-truncated" field="name" :header="$t('common.packages')" :sortable="true"></Column>
        <Column key="dateCreation" class="kn-truncated" field="dateCreation" :header="$t('common.time')" :sortable="true">
            <template #body="slotProps">
                {{ getFormattedDate(slotProps.data.dateCreation, 'MMM DD, YYYY h:mm:ss A') }}
            </template>
        </Column>
        <Column :style="workspaceSchedulationOldSchedulationsTableDescriptor.iconColumn.style">
            <template #body="slotProps">
                <Button v-tooltip.top="$t('common.download')" icon="pi pi-download" class="p-button-link" @click="downloadSnapshot(slotProps.data)" />
            </template>
        </Column>
    </DataTable>
</template>

<script lang="ts">
import { ISchedulation } from '@/modules/workspace/Workspace'
import { defineComponent } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { formatDate } from '@/helpers/commons/localeHelper'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import workspaceSchedulationOldSchedulationsTableDescriptor from './WorkspaceSchedulationOldSchedulationsTableDescriptor.json'
import mainStore from '../../../../../App.store'
import { mapActions, mapState } from 'pinia'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'

export default defineComponent({
    name: 'workspace-schedulation-old-schedulations-table',
    components: { Column, DataTable, Message },
    props: { propSchedulations: { type: Array } },
    data() {
        return {
            workspaceSchedulationOldSchedulationsTableDescriptor,
            schedulations: [] as ISchedulation[],
            filters: { global: [filterDefault] } as any,
            user: null as any
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
            this.schedulations = this.propSchedulations as ISchedulation[]
        },
        getFormattedDate(date: any, format: any) {
            return formatDate(date, format)
        },
        async downloadSnapshot(schedulation: ISchedulation) {
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
        }
    }
})
</script>
