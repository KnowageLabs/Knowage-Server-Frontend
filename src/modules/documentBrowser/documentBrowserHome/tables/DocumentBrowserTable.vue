<template>
    <div class="kn-flex" style="overflow: hidden">
        <q-table class="kn-table" flat dense virtual-scroll :virtual-scroll-sticky-size-start="28" :rows-per-page-options="[0]" :filter="filter" :visible-columns="visibleColumns" :rows="documents" :columns="documentBrowserTableDescriptor.quasarColumns as any" row-key="id" :style="{ 'max-height': tableHeight }" @row-click="(e, row) => $emit('selected', row)">
            <template #top>
                <q-input v-model="filter" outlined dense hide-bottom-space clearable :label="$t('documentBrowser.selectedFolderSearch')" class="full-width">
                    <template #prepend><q-icon name="search" size="xs" /></template>
                </q-input>
            </template>
            <template #no-data>
                <div class="full-width row flex-center text-primary q-pa-md q-gutter-sm">
                    <q-icon name="info" size="sm" />
                    <span>{{ $t('documentBrowser.noDocumentsHint') }}</span>
                </div>
            </template>
            <template #header="props">
                <q-tr :props="props">
                    <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-capitalize">
                        {{ $t(col.label) }}
                    </q-th>
                </q-tr>
            </template>
            <template #body-cell-typeCode="props">
                <q-td>
                    <q-chip :color="getTypeColor(props.value)" text-color="white" size="sm" class="q-ma-none">
                        <q-icon :name="getTypeIcon(props.value)" size="xs" class="q-mr-xs" />
                        {{ props.value }}
                    </q-chip>
                </q-td>
            </template>
            <template #body-cell-stateCodeStr="props">
                <q-td>
                    <q-badge :color="getStatusColor(props.row.stateCode)" :label="props.value" />
                </q-td>
            </template>
            <template #body-cell="props">
                <q-td class="kn-truncated">
                    <div class="row">
                        <div class="kn-truncated" style="max-width: 300px; font-size: 0.8rem">
                            {{ props.value }}
                            <q-tooltip>{{ props.value }}</q-tooltip>
                        </div>
                    </div>
                </q-td>
            </template>
            <template #body-cell-visible="props">
                <q-td class="text-center">
                    <q-icon :name="props.value ? 'visibility' : 'visibility_off'">
                        <q-tooltip>{{ props.value ? $t('common.visible') : $t('common.notVisible') }}</q-tooltip>
                    </q-icon>
                </q-td>
            </template>
            <template #body-cell-play="slotProps">
                <q-td class="text-center">
                    <q-btn flat round size="xs" color="primary" icon="fa fa-play-circle" data-test="execution" @click.stop="executeDocument(slotProps.row)">
                        <q-tooltip>{{ $t('documentBrowser.executeDocument') }}</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
        </q-table>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import documentBrowserTableDescriptor from './DocumentBrowserTableDescriptor.json'
import mainStore from '../../../../App.store'
import { mapState } from 'pinia'
import { getCorrectRolesForExecution } from '../../../../helpers/commons/roleHelper'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'document-browser-table',
    props: { propDocuments: { type: Array }, searchMode: { type: Boolean } },
    emits: ['itemSelected', 'selected'],
    data() {
        return {
            documentBrowserTableDescriptor,
            documents: [] as any[],
            filter: '' as string,
            first: 0,
            visibleColumns: [] as string[],
            tableHeight: '500px'
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
    mounted() {
        this.updateTableHeight()
        window.addEventListener('resize', this.updateTableHeight)
    },
    unmounted() {
        window.removeEventListener('resize', this.updateTableHeight)
    },
    methods: {
        updateTableHeight() {
            this.$nextTick(() => {
                const el = this.$el?.querySelector('.q-table__container') || this.$el
                if (el) {
                    const top = el.getBoundingClientRect().top
                    this.tableHeight = `${Math.max(window.innerHeight - top, 100)}px`
                }
            })
        },
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
            this.$emit('itemSelected', { item: document, mode: 'execute' })
        },
        getTranslatedValue(value: string, fieldType: string) {
            if (fieldType !== 'name' && fieldType !== 'label') return value
            return (this as any).$internationalization(value)
        },
        getTypeColor(typeCode: string): string {
            const map: Record<string, string> = { DASHBOARD: 'indigo-5', REPORT: 'teal-6', DOCUMENT_COMPOSITE: 'purple-5', KPI: 'orange-7', MAP: 'green-6', COCKPIT: 'blue-5' }
            return map[typeCode] ?? 'grey-6'
        },
        getTypeIcon(typeCode: string): string {
            const map: Record<string, string> = { DASHBOARD: 'dashboard', REPORT: 'description', DOCUMENT_COMPOSITE: 'layers', KPI: 'speed', MAP: 'map', COCKPIT: 'widgets' }
            return map[typeCode] ?? 'article'
        },
        getStatusColor(stateCode: string): string {
            const map: Record<string, string> = { DEV: 'blue-4', TEST: 'orange-6', REL: 'positive', SUSPENDED: 'grey-6', SUSP: 'grey-6' }
            return map[stateCode] ?? 'grey-6'
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-table {
    :deep(.q-table__top) {
        padding: 8px;
    }

    height: 100%;
    :deep(thead tr th) {
        position: sticky;
        z-index: 1;
        background-color: #ffffff;
        top: 0;
    }

    /* prevent scrolling behind sticky top row on focus */
    :deep(tbody) {
        scroll-margin-top: 48px;
    }
}
</style>
