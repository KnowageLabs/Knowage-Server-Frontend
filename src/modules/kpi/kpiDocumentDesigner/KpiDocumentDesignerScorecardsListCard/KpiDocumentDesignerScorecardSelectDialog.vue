<template>
    <Dialog id="kpi-edit-scorecard-select-dialog" class="p-fluid kn-dialog--toolbar--primary" :style="KpiDocumentDesignerScorecardsListCardDescriptor.dialog.style" :content-style="KpiDocumentDesignerScorecardsListCardDescriptor.dialog.contentStyle" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('kpi.kpiDocumentDesigner.scorecardList') }}
                </template>
            </Toolbar>
        </template>

        <DataTable
            v-model:selection="selectedScorecard"
            v-model:filters="filters"
            :value="scorecardList"
            class="p-datatable-sm kn-table"
            data-key="id"
            :kpi-document-designer-kpi-list-card-descriptor="KpiDocumentDesignerScorecardsListCardDescriptor.selectScorecardGlobalFilterFields"
            responsive-layout="stack"
            breakpoint="960px"
            :scrollable="true"
            scroll-height="80vh"
        >
            <template #header>
                <div class="table-header p-d-flex">
                    <span class="p-input-icon-left p-mr-3">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" data-test="search-input" />
                    </span>
                </div>
            </template>
            <template #empty>
                {{ $t('common.info.noDataFound') }}
            </template>
            <Column selection-mode="single" :header-style="KpiDocumentDesignerScorecardsListCardDescriptor.selectColumnStyle" :style="KpiDocumentDesignerScorecardsListCardDescriptor.selectColumnStyle"></Column>
            <Column key="name" class="kn-truncated" field="name" :header="$t('common.name')" :sortable="true"> </Column>
            <Column key="dateCreation" class="kn-truncated" field="creationDate" :header="$t('common.creationDate')" :sortable="true">
                <template #body="slotProps">
                    <span>{{ getFormattedDate(slotProps.data.creationDate) }}</span>
                </template>
            </Column>
        </DataTable>

        <template #footer>
            <Button class="kn-button kn-button--primary" :label="$t('common.close')" data-test="close-button" @click="closeScorecardAssociations"></Button>
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" data-test="save-button" @click="addScorecardAssociations"></Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { formatDate } from '@/helpers/commons/localeHelper'
import { iScorecard } from '../KpiDocumentDesigner'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import KpiDocumentDesignerScorecardsListCardDescriptor from './KpiDocumentDesignerScorecardsListCardDescriptor.json'

export default defineComponent({
    name: 'kpi-edit-scorecard-select-dialog',
    components: { Column, DataTable, Dialog },
    props: { visible: { type: Boolean }, scorecardList: { type: Array as PropType<iScorecard[]> }, dataScorecards: { type: Array as PropType<iScorecard[]>, required: true } },
    emits: ['close', 'scorecardSelected'],
    data() {
        return {
            KpiDocumentDesignerScorecardsListCardDescriptor,
            filters: { global: [filterDefault] } as Object,
            selectedScorecard: null as iScorecard | null
        }
    },
    watch: {
        visible() {
            this.setSelectedKpiAssociations()
        }
    },
    async created() {
        this.setSelectedKpiAssociations()
    },
    methods: {
        getFormattedDate(date: any) {
            return formatDate(date)
        },
        setSelectedKpiAssociations() {
            if (this.dataScorecards[0] && this.scorecardList) {
                const index = this.scorecardList.findIndex((scorecard: iScorecard) => scorecard.name === this.dataScorecards[0].name)
                if (index !== -1) this.selectedScorecard = this.scorecardList[index]
            } else {
                this.selectedScorecard = null
            }
        },
        closeScorecardAssociations() {
            this.selectedScorecard = null
            this.$emit('close')
        },
        addScorecardAssociations() {
            this.$emit('scorecardSelected', this.selectedScorecard)
        }
    }
})
</script>

<style lang="scss">
#kpi-edit-scorecard-select-dialog .p-dialog-header,
#kpi-edit-scorecard-select-dialog .p-dialog-content {
    padding: 0;
}
#kpi-edit-scorecard-select-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
</style>
