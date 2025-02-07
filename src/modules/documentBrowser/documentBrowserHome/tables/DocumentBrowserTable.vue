<template>
    <div class="p-d-flex p-flex-row p-jc-center">
        <Message v-if="searchMode" id="documents-found-hint" class="p-m-2" severity="info" :closable="false" :style="documentBrowserTableDescriptor.styles.message">
            {{ documents.length + ' ' + $t('documentBrowser.documentsFound') }}
        </Message>
    </div>
    <div v-if="!searchMode" class="table-header p-d-flex row">
        <q-input class="q-ma-md col-6" dense filled v-model="filter" :label="$t('documentBrowser.selectedFolderSearch')">
            <template v-slot:prepend>
                <q-icon name="search" />
            </template>
        </q-input>
    </div>

    <div class="kn-flex">
        <q-table class="q-mb-lg" flat dense :pagination="{ rowsPerPage: 0, page: 1 }" :filter="filter" hide-pagination :visible-columns="visibleColumns" :rows="documents" :columns="documentBrowserTableDescriptor.quasarColumns" row-key="name" @row-click="(e, row) => $emit('selected', row)">
            <template #no-data>
                <div class="full-width row flex-center text-accent q-gutter-sm">
                    <Message class="p-m-2" severity="info" :closable="false" :style="documentBrowserTableDescriptor.styles.message" data-test="no-documents-hint">
                        {{ $t('documentBrowser.noDocumentsHint') }}
                    </Message>
                </div>
            </template>
            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-capitalize">
                        {{ $t(col.label) }}
                    </q-th>
                </q-tr>
            </template>
            <template #body-cell="props">
                <q-td class="kn-truncated">
                    <div class="row">
                        <div class="kn-truncated" style="max-width: 300px; font-size: 0.8rem">
                            {{ props.value }}<q-tooltip>{{ props.value }}</q-tooltip>
                        </div>
                    </div>
                </q-td>
            </template>
            <template #body-cell-visible="props">
                <q-td class="text-center"
                    ><q-icon :name="props.value ? 'visibility' : 'visibility_off'">
                        <q-tooltip>{{ props.value ? $t('common.visible') : $t('common.notVisible') }}</q-tooltip>
                    </q-icon></q-td
                >
            </template>
            <template #body-cell-play="slotProps">
                <q-td class="text-center">
                    <q-btn flat round size="xs" color="primary" icon="fa fa-play-circle" @click.stop="executeDocument(slotProps.row)">
                        <q-tooltip>{{ $t('documentBrowser.executeDocument') }}</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Message from 'primevue/message'
import documentBrowserTableDescriptor from './DocumentBrowserTableDescriptor.json'
import mainStore from '../../../../App.store'
import { mapState } from 'pinia'
import { getCorrectRolesForExecution } from '../../../../helpers/commons/roleHelper'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'document-browser-table',
    components: { Column, DataTable, Message },
    props: { propDocuments: { type: Array }, searchMode: { type: Boolean } },
    emits: ['itemSelected', 'selected'],
    data() {
        return {
            documentBrowserTableDescriptor,
            documents: [] as any[],
            filter: '' as string,
            first: 0,
            visibleColumns: [] as string[]
        }
    },
    computed: {
        ...mapState(mainStore, ['user'])
    },
    watch: {
        propDocuments() {
            this.loadDocuments()
            this.first = 0
        }
    },
    created() {
        this.loadDocuments()
        this.first = 0
    },
    methods: {
        loadDocuments() {
            this.documents = this.propDocuments?.map((el: any) => {
                if (el.field === 'status') el.style = documentBrowserTableDescriptor.table.smallmessage
                return { ...el, stateCodeStr: this.getTranslatedStatus(el.stateCodeStr) }
            }) as any[]
            if (this.user?.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_MANAGEMENT) || this.user?.isSuperadmin) this.visibleColumns.push('stateCodeStr', 'visible')
        },
        getTranslatedStatus(status: string) {
            return status ? this.$t(documentBrowserTableDescriptor.status[status] ?? '') : ''
        },
        executeDocument(document: any) {
            getCorrectRolesForExecution(document).then(() => {
                this.$emit('itemSelected', { item: document, mode: 'execute' })
            })
        },
        getTranslatedValue(value: string, fieldType: string) {
            if (fieldType !== 'name' && fieldType !== 'label') return value
            return (this as any).$internationalization(value)
        }
    }
})
</script>

<style lang="scss" scoped>
#documents-found-hint {
    flex: 0.5;
}

#documents-datatable {
    :deep(.p-datatable-wrapper) {
        flex: 1 0 0;
        height: unset;
        overflow: auto;
    }
}
</style>
