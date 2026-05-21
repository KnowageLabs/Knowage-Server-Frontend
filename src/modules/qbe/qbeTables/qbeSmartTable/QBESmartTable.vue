<template>
    <div class="qbe-quasar-section" @drop.stop="onDrop($event)" @dragover.prevent @dragenter.prevent>
        <template v-if="previewData != null">
            <q-table class="qbe-quasar-table" flat dense bordered separator="cell" :columns="quasarColumns" :rows="previewData.rows || []" row-key="id" hide-pagination v-model:pagination="qPagination" @request="onQPageRequest" square>
                <template #no-data>
                    <div class="full-width text-center q-pa-sm">{{ $t('common.info.noDataFound') }}</div>
                </template>
                <template #header="props">
                    <q-tr :props="props">
                        <q-th v-for="col in props.cols" :key="col.name" :props="props" class="qbe-q-th" :class="qColDropClass(col)" draggable="true" @dragstart="onQColDragStart($event, col)" @dragover.prevent @dragenter.prevent="onQColDragEnter($event, col)" @dragleave="onQColDragLeave($event, col)" @drop.stop="onQColDrop($event, col)" @dragend="onQColDragEnd()">
                            <div class="qbe-q-custom-header">
                                <div class="qbe-q-color-bar" :style="`background-color: ${col._col.color}`" :title="col._col.entity"></div>
                                <div class="qbe-q-header-row">
                                    <i class="fas fa-sort p-ml-2" @click.stop="changeOrder(col._col)">
                                        <q-tooltip anchor="bottom middle" self="top middle">{{ $t('qbe.detailView.smartViewMenu.sorting') }}</q-tooltip>
                                    </i>
                                    <span class="p-mx-2 kn-truncated"
                                        >{{ col.label }}
                                        <q-tooltip anchor="bottom middle" self="top middle">{{ col.label }}</q-tooltip>
                                    </span>
                                    <i class="fas fa-cog p-ml-auto" @click.stop="showMenu($event, col._col)">
                                        <q-tooltip anchor="bottom middle" self="top middle">{{ $t('qbe.detailView.smartViewMenu.colset') }}</q-tooltip>
                                    </i>
                                    <i class="fas fa-filter p-mx-2" :class="{ 'qbe-active-filter-icon': fieldHasFilters(col._col) }" @click.stop="openFiltersDialog(col._col)">
                                        <q-tooltip anchor="bottom middle" self="top middle">{{ $t('qbe.detailView.smartViewMenu.colfil') }}</q-tooltip>
                                    </i>
                                    <i class="fas fa-times p-mr-2" @click.stop="$emit('removeFieldFromQuery', col._col.uniqueID)">
                                        <q-tooltip anchor="bottom middle" self="top middle">{{ $t('qbe.detailView.smartViewMenu.coldel') }}</q-tooltip>
                                    </i>
                                </div>
                            </div>
                        </q-th>
                    </q-tr>
                </template>
                <template #body="props">
                    <q-tr :props="props">
                        <q-td v-for="col in props.cols" :key="col.name" :props="props" class="kn-truncated" style="height: 20px">
                            <span v-if="typeof props.row[col.field] === 'number' && props.row[col.field]">
                                {{ getFormattedNumber(col._col, props.row[col.field]) }}
                                <q-tooltip>{{ props.row[col.field] }}</q-tooltip>
                            </span>
                            <span v-else-if="previewData?.metaData?.fields[col._index + 1]?.type === 'date' && col._col.type !== 'inline.calculated.field'"
                                >{{ getFormattedDate(props.row[col.field], previewData.metaData.fields[col._index + 1].metawebDateFormat, 'dd/MM/yyyy') }}
                                <q-tooltip anchor="bottom middle" self="top middle">{{ getFormattedDate(props.row[col.field], previewData.metaData.fields[col._index + 1].metawebDateFormat, 'dd/MM/yyyy') }}</q-tooltip>
                            </span>
                            <span v-else-if="previewData?.metaData?.fields[col._index + 1]?.type === 'date' && col._col.type === 'inline.calculated.field'"
                                >{{ getFormattedDate(props.row[col.field], col._col.id.format, 'dd/MM/yyyy') }}
                                <q-tooltip anchor="bottom middle" self="top middle">{{ getFormattedDate(props.row[col.field], col._col.id.format, 'dd/MM/yyyy') }}</q-tooltip>
                            </span>
                            <span v-else-if="previewData?.metaData?.fields[col._index + 1]?.type === 'timestamp' && col._col.type !== 'inline.calculated.field'"
                                >{{ getFormattedDate(props.row[col.field], previewData.metaData.fields[col._index + 1].metawebDateFormat, 'dd/MM/yyyy HH:mm:ss.SSS') }}
                                <q-tooltip anchor="bottom middle" self="top middle">{{ getFormattedDate(props.row[col.field], previewData.metaData.fields[col._index + 1].metawebDateFormat, 'dd/MM/yyyy HH:mm:ss.SSS') }}</q-tooltip>
                            </span>
                            <span v-else-if="previewData?.metaData?.fields[col._index + 1]?.type === 'timestamp' && col._col.type === 'inline.calculated.field'"
                                >{{ getFormattedDate(props.row[col.field], col._col.id.format, 'dd/MM/yyyy HH:mm:ss.SSS') }}
                                <q-tooltip anchor="bottom middle" self="top middle">{{ getFormattedDate(props.row[col.field], col._col.id.format, 'dd/MM/yyyy HH:mm:ss.SSS') }}</q-tooltip>
                            </span>
                            <span v-else
                                >{{ props.row[col.field] }}
                                <q-tooltip anchor="bottom middle" self="top middle">{{ props.row[col.field] }}</q-tooltip>
                            </span>
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
            <div class="qbe-paginator-bar row items-center justify-center q-py-xs q-px-md">
                <span class="text-body2 q-mr-sm">{{ paginatorLabel }}</span>
                <q-pagination v-model="qPagination.page" :max="totalPages" :max-pages="6" boundary-links direction-links dense color="grey-8" @update:model-value="onPaginatorPageChange" />
            </div>
        </template>
        <div v-else class="kn-height-full kn-width-full">{{ $t('common.info.noDataFound') }}</div>
    </div>

    <Dialog v-if="aliasDialogVisible" class="qbe-smart-table-alias-dialog" :visible="aliasDialogVisible" :modal="true" :closable="false" :base-z-index="1" :auto-z-index="true">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-col-12">
                <template #start>
                    {{ $t('common.alias') }}
                </template>
            </Toolbar>
        </template>

        <span class="p-float-label p-m-4">
            <InputText id="alias" v-model="alias" class="kn-material-input" type="text" max-length="50" />
            <label for="alias" class="kn-material-input-label"> {{ $t('common.alias') }} </label>
        </span>

        <template #footer>
            <Button class="kn-button kn-button--secondary" data-test="close-button" @click="aliasDialogVisible = false"> {{ $t('common.cancel') }}</Button>
            <Button class="kn-button kn-button--primary" data-test="save-button" @click="changeAlias"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>

    <Menu id="smartTableMenu" ref="smartTableMenu" :model="menuButtons" data-test="menu" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Menu from 'primevue/contextmenu'
import Dialog from 'primevue/dialog'
import { formatDateLuxon, getLocale } from '@/helpers/commons/localeHelper'
import { formatNumber } from '@/helpers/commons/qbeHelpers'

export default defineComponent({
    name: 'qbe-simple-table',
    components: { Menu, Dialog },
    props: { previewData: { type: Object, required: true }, query: { type: Object, required: true }, pagination: { type: Object } },
    emits: ['removeFieldFromQuery', 'orderChanged', 'fieldHidden', 'fieldGrouped', 'fieldAggregated', 'aliasChanged', 'entityDropped', 'reordered', 'pageChanged', 'openFilterDialog'],
    data() {
        return {
            aliasDialogVisible: false,
            alias: '',
            menuButtons: [] as any,
            selectedField: {} as any,
            qDraggedColIndex: null as number | null,
            qDragOverColIndex: null as number | null,
            qPagination: { page: 1, rowsPerPage: 25, rowsNumber: 0 } as any
        }
    },
    computed: {
        filteredVisibleFields(): any {
            const newArr = this.query?.fields?.filter((field) => field.visible === true && field.inUse === true)
            return newArr
        },
        quasarColumns(): any[] {
            return (this.filteredVisibleFields || []).map((col: any, index: number) => ({
                name: col.uniqueID,
                label: col.alias,
                field: `column_${index + 1}`,
                align: 'left',
                sortable: false,
                _col: col,
                _index: index
            }))
        },
        paginatorLabel(): string {
            const rpp = this.qPagination.rowsPerPage
            const page = this.qPagination.page
            const total = this.qPagination.rowsNumber
            if (!total) return '0-0 of 0'
            const start = (page - 1) * rpp + 1
            const end = Math.min(page * rpp, total)
            return `${start}-${end} of ${total}`
        },
        totalPages(): number {
            return Math.max(1, Math.ceil(this.qPagination.rowsNumber / this.qPagination.rowsPerPage))
        }
    },
    watch: {
        previewData() {
            this.loadPagination()
            this.setDateFormatsForPreviewData()
        }
    },
    created() {
        this.loadPagination()
    },
    methods: {
        showMenu(event, col) {
            this.createMenuItems(col)
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.smartTableMenu.toggle(event)
        },
        createMenuItems(field) {
            this.menuButtons = []
            const visibleIcon = field.visible ? 'fas fa-check' : 'fas fa-times'
            const groupIcon = field.group ? 'fas fa-check' : 'fas fa-times'
            this.menuButtons.push(
                { key: '1', label: this.$t('qbe.detailView.smartViewMenu.showField'), icon: visibleIcon, command: () => this.hideField(field) },
                { key: '2', label: this.$t('qbe.detailView.smartViewMenu.group'), icon: groupIcon, visible: field.iconCls == 'attribute' || (field.iconCls == 'calculation' && (field.attributes?.formState?.nature ?? field.nature ?? field.id?.nature ?? '').toLowerCase() == 'attribute'), command: () => this.groupField(field) },
                {
                    key: '3',
                    label: this.$t('qbe.detailView.smartViewMenu.aggregation.title') + `: ${field.funct}`,
                    visible: field.iconCls == 'measure' || (field.iconCls == 'calculation' && (field.attributes?.formState?.nature ?? field.nature ?? field.id?.nature ?? '').toLowerCase() == 'measure'),
                    items: [
                        { label: this.$t('qbe.detailView.smartViewMenu.aggregation.sum'), command: () => this.applyAggregation(field, 'SUM') },
                        { label: this.$t('qbe.detailView.smartViewMenu.aggregation.min'), command: () => this.applyAggregation(field, 'MIN') },
                        { label: this.$t('qbe.detailView.smartViewMenu.aggregation.max'), command: () => this.applyAggregation(field, 'MAX') },
                        { label: this.$t('qbe.detailView.smartViewMenu.aggregation.avg'), command: () => this.applyAggregation(field, 'AVG') },
                        { label: this.$t('qbe.detailView.smartViewMenu.aggregation.count'), command: () => this.applyAggregation(field, 'COUNT') },
                        { label: this.$t('qbe.detailView.smartViewMenu.aggregation.distinct'), command: () => this.applyAggregation(field, 'COUNT_DISTINCT') }
                    ]
                },
                { key: '4', label: this.$t('qbe.detailView.smartViewMenu.rename'), icon: 'fas fa-tag', command: () => this.showChangeAliasDialog(field) }
            )
        },
        changeOrder(field) {
            field.order === 'ASC' ? (field.order = 'DESC') : (field.order = 'ASC')
            this.$emit('orderChanged')
        },
        hideField(field) {
            field.visible = !field.visible
            this.$emit('fieldHidden')
        },
        groupField(field) {
            field.group = !field.group
            this.$emit('fieldGrouped')
        },
        applyAggregation(field, value) {
            field.funct = value
            this.$emit('fieldAggregated')
        },
        showChangeAliasDialog(field) {
            this.selectedField = field
            this.alias = JSON.parse(JSON.stringify(field.alias))
            this.aliasDialogVisible = true
        },
        changeAlias() {
            this.selectedField.alias = this.alias
            this.aliasDialogVisible = false
            this.$emit('aliasChanged', this.selectedField)
        },
        onDrop(event) {
            try {
                const data = JSON.parse(event.dataTransfer.getData('text/plain'))
                this.$emit('entityDropped', data)
            } catch (_) {
                // Not a QBE entity drop
            }
        },
        loadPagination() {
            const rowsPerPage = this.qPagination.rowsPerPage || 25
            const start = (this.pagination as any)?.start || 0
            this.qPagination.rowsNumber = (this.pagination as any)?.size || 0
            this.qPagination.page = Math.floor(start / rowsPerPage) + 1
        },
        fieldHasFilters(field: any) {
            for (let i = 0; i < this.query.filters.length; i++) {
                const tempFilter = this.query.filters[i]
                if (tempFilter.leftOperandValue === field.id) {
                    return true
                }
            }

            return false
        },
        openFiltersDialog(field: any) {
            this.$emit('openFilterDialog', field)
        },
        getFormattedNumber(column: any, number: number) {
            const configuration = formatNumber(column)
            let locale = getLocale()
            locale = locale ? locale.replaceAll('_', '-') : 'en-US'
            if (!configuration) return number
            const formattedNumber = Intl.NumberFormat(locale, { minimumFractionDigits: configuration.minFractionDigits, maximumFractionDigits: configuration.maxFractionDigits, useGrouping: configuration.useGrouping }).format(number)
            return configuration.currency + formattedNumber
        },
        getFormattedDate(date: any, output: any, input: any) {
            if (!date) return null
            return formatDateLuxon(date, output, input)
        },
        onQColDragStart(event: DragEvent, col: any) {
            this.qDraggedColIndex = this.quasarColumns.findIndex((c) => c.name === col.name)
            event.dataTransfer!.effectAllowed = 'move'
            event.dataTransfer!.setData('text/plain', 'col-reorder')
        },
        onQColDrop(_event: DragEvent, dropCol: any) {
            if (this.qDraggedColIndex === null) return
            const dropIndex = this.quasarColumns.findIndex((c) => c.name === dropCol.name)
            if (this.qDraggedColIndex !== dropIndex) {
                this.$emit('reordered', { dragIndex: this.qDraggedColIndex, dropIndex })
            }
            this.qDraggedColIndex = null
            this.qDragOverColIndex = null
        },
        onQColDragEnd() {
            this.qDraggedColIndex = null
            this.qDragOverColIndex = null
        },
        onQColDragEnter(_event: DragEvent, col: any) {
            if (this.qDraggedColIndex === null) return
            this.qDragOverColIndex = this.quasarColumns.findIndex((c) => c.name === col.name)
        },
        onQColDragLeave(event: DragEvent, col: any) {
            const th = event.currentTarget as Element
            if (!th.contains(event.relatedTarget as Node)) {
                const idx = this.quasarColumns.findIndex((c) => c.name === col.name)
                if (this.qDragOverColIndex === idx) this.qDragOverColIndex = null
            }
        },
        qColDropClass(col: any) {
            if (this.qDragOverColIndex === null || this.qDraggedColIndex === null) return {}
            const idx = this.quasarColumns.findIndex((c) => c.name === col.name)
            if (idx !== this.qDragOverColIndex || idx === this.qDraggedColIndex) return {}
            return this.qDraggedColIndex > idx ? { 'qbe-q-th--drop-left': true } : { 'qbe-q-th--drop-right': true }
        },
        onQPageRequest(requestProps: any) {
            const { page, rowsPerPage } = requestProps.pagination
            const start = (page - 1) * rowsPerPage
            this.$emit('pageChanged', { paginationStart: start, paginationLimit: rowsPerPage, paginationEnd: start + rowsPerPage, size: this.qPagination.rowsNumber })
        },
        triggerPageChange(page: number) {
            const rowsPerPage = this.qPagination.rowsPerPage
            const start = (page - 1) * rowsPerPage
            this.qPagination.page = page
            this.$emit('pageChanged', { paginationStart: start, paginationLimit: rowsPerPage, paginationEnd: start + rowsPerPage, size: this.qPagination.rowsNumber })
        },
        onPaginatorPageChange(page: number) {
            this.triggerPageChange(page)
        },
        setDateFormatsForPreviewData() {
            if (!this.previewData?.metaData?.fields) return

            for (let i = 1; i < this.previewData.metaData.fields.length; i++) {
                const field = this.previewData.metaData.fields[i]
                if (['timestamp', 'date'].includes(field.type)) {
                    if (!field.metawebDateFormat) {
                        const fieldIndex = i - 1
                        if (this.query && this.query.fields && this.query.fields[fieldIndex]) {
                            const queryField = this.query.fields[fieldIndex]
                            if (queryField.format) {
                                field.metawebDateFormat = queryField.format
                            }
                        }
                    }
                }
            }
        }
    }
})
</script>
<style lang="scss">
.qbe-smart-table-alias-dialog .p-dialog-header,
.qbe-smart-table-alias-dialog .p-dialog-content {
    padding: 0;
    margin: 0;
}

.qbe-active-filter-icon {
    color: red !important;
}

.qbe-quasar-section {
    border-top: 2px solid #a9a9a9;
    position: absolute;
    top: 8px;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.qbe-paginator-bar {
    flex-shrink: 0;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    background: white;
    min-height: 40px;

    .q-btn {
        color: rgba(0, 0, 0, 0.54);
    }
}

.qbe-quasar-table {
    flex: 1;
    min-height: 0;
    border: none !important;

    .q-table__middle {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
    }

    .q-table__bottom {
        display: none;
    }

    thead tr th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: white;
    }

    .q-table tbody tr:nth-child(even) td {
        background-color: rgba(0, 0, 0, 0.04);
    }

    .qbe-q-th {
        padding: 0 !important;
        min-width: 170px;
        max-width: 170px;
        border-bottom: 1px solid #a9a9a9 !important;
        cursor: grab;
        user-select: none;

        &:active {
            cursor: grabbing;
        }

        &.qbe-q-th--drop-left {
            border-left: 3px solid #1976d2 !important;
            background-color: rgba(25, 118, 210, 0.08);
        }

        &.qbe-q-th--drop-right {
            border-right: 3px solid #1976d2 !important;
            background-color: rgba(25, 118, 210, 0.08);
        }
    }

    .q-table tbody td {
        max-width: 170px;
        min-width: 170px;
        height: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .qbe-q-custom-header {
        width: 100%;
        flex-direction: column;
        display: flex;
        justify-content: flex-start;
        align-items: center;

        .qbe-q-color-bar {
            width: 100%;
            height: 5px;
        }

        .qbe-q-header-row {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            align-items: baseline;
            color: #707171;
        }

        i {
            transition: color 0.3s ease-out;
            line-height: 24px;
            cursor: pointer;
            margin: 0;

            &:hover {
                color: #bbd6ed;
            }
        }
    }
}
</style>
