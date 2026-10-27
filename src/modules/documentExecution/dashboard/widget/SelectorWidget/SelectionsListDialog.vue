<template>
    <q-dialog :model-value="visible" persistent @show="updateTruncatedCells">
        <q-card ref="card" class="selections-dialog">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.selectionsList') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section class="q-pa-none">
                <q-table class="selections-table" :rows="activeSelections" :columns="columns" :row-key="getRowKey" :rows-per-page-options="[0]" :no-data-label="$t('common.info.noElementSelected')" flat dense hide-bottom>
                    <template #body="props">
                        <q-tr :props="props" :class="{ 'selections-table__row--locked': props.row.locked }">
                            <q-td v-for="col in props.cols.filter((col) => col.name !== 'actions')" :key="col.name" :props="props" class="selections-table__cell">
                                <div class="ellipsis" :data-cell-key="`${props.key}-${col.name}`">{{ col.value }}</div>
                                <q-tooltip v-if="truncatedCells[`${props.key}-${col.name}`] && openMenuCell !== `${props.key}-${col.name}`" :delay="500" max-width="400px" class="selections-table__tooltip">{{ col.value }}</q-tooltip>
                                <q-menu class="selections-table__menu" @show="openMenuCell = `${props.key}-${col.name}`" @hide="openMenuCell = null">
                                    <div class="text-caption text-grey-7">{{ col.label }}</div>
                                    <div v-if="col.name === 'value'">
                                        <div v-for="(value, index) in props.row.value" :key="index">{{ value }}</div>
                                    </div>
                                    <div v-else>{{ col.value }}</div>
                                </q-menu>
                            </q-td>
                            <q-td key="actions" :props="props" class="selections-table__actions">
                                <q-btn v-if="!document?.seeAsFinalUser" flat round dense size="sm" :icon="props.row.locked ? 'fas fa-lock' : 'fas fa-lock-open'" :color="props.row.locked ? 'negative' : 'grey-8'" @click="toggleSelectionLock(props.row)">
                                    <q-tooltip>{{ props.row.locked ? $t('common.unlock') : $t('common.lock') }}</q-tooltip>
                                </q-btn>
                                <q-btn flat round dense size="sm" icon="fas fa-trash-alt" color="grey-8" :disable="props.row.locked" @click="deleteSelection(props.row)">
                                    <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                                </q-btn>
                            </q-td>
                        </q-tr>
                    </template>
                </q-table>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat color="secondary" :label="$t('common.close')" data-test="close-button" @click="closeDialog" />
                <q-btn unelevated color="primary" :label="$t('common.save')" data-test="save-button" @click="onSave" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'pinia'
import store from '../../Dashboard.store'
import deepcopy from 'deepcopy'
import { ISelection } from '../../Dashboard'

export default defineComponent({
    name: 'selections-list-dialog',
    props: {
        visible: { type: Boolean },
        dashboardId: { type: String, required: true },
        document: { type: Object }
    },
    emits: ['close', 'save'],
    data() {
        return {
            activeSelections: [] as ISelection[],
            selectionsToRemove: [] as ISelection[],
            truncatedCells: {} as Record<string, boolean>,
            openMenuCell: null as string | null
        }
    },
    computed: {
        columns(): any[] {
            return [
                { name: 'datasetLabel', label: this.$t('common.dataset'), field: 'datasetLabel', align: 'left' },
                { name: 'columnName', label: this.$t('common.column'), field: 'columnName', align: 'left' },
                { name: 'value', label: this.$t('common.values'), field: 'value', align: 'left', format: (value: (string | number)[]) => (Array.isArray(value) ? value.join(', ') : value) },
                { name: 'actions', label: '', field: 'actions', align: 'right', style: 'width: 90px', headerStyle: 'width: 90px' }
            ]
        }
    },
    created() {
        this.activeSelections = deepcopy(this.getSelections(this.dashboardId))
        window.addEventListener('resize', this.updateTruncatedCells)
    },
    unmounted() {
        window.removeEventListener('resize', this.updateTruncatedCells)
    },
    methods: {
        ...mapActions(store, ['getSelections']),
        updateTruncatedCells() {
            const cells = (this.$refs.card as any)?.$el?.querySelectorAll('[data-cell-key]') ?? []
            const truncatedCells = {} as Record<string, boolean>
            cells.forEach((cell: HTMLElement) => {
                if (cell.scrollWidth > cell.clientWidth) truncatedCells[cell.dataset.cellKey as string] = true
            })
            this.truncatedCells = truncatedCells
        },
        getRowKey(selection: ISelection) {
            return `${selection.datasetId}-${selection.columnName}`
        },
        findSelectionIndex(selection: ISelection) {
            return this.activeSelections.findIndex((tempSelection: ISelection) => tempSelection.datasetId === selection.datasetId && tempSelection.columnName === selection.columnName)
        },
        deleteSelection(selection: ISelection) {
            const index = this.findSelectionIndex(selection)
            if (index !== -1) {
                this.selectionsToRemove.push(this.activeSelections[index])
                this.activeSelections.splice(index, 1)
            }
        },
        toggleSelectionLock(selection: ISelection) {
            const index = this.findSelectionIndex(selection)
            if (index !== -1) this.activeSelections[index].locked = !this.activeSelections[index].locked
        },
        saveSelectionLocks() {
            const storeSelections = this.getSelections(this.dashboardId)

            this.activeSelections.forEach((selection) => {
                if (selection.hasOwnProperty('locked')) {
                    const storeSelection = storeSelections.find((storeItem) => storeItem.datasetId === selection.datasetId && storeItem.columnName === selection.columnName)
                    if (storeSelection) storeSelection.locked = selection.locked
                }
            })
        },
        closeDialog() {
            this.activeSelections = []
            this.selectionsToRemove = []
            this.$emit('close')
        },
        onSave() {
            this.saveSelectionLocks()
            this.$emit('save', this.selectionsToRemove)
        }
    }
})
</script>

<style lang="scss" scoped>
.selections-dialog {
    width: 60vw;
    max-width: 900px;
}

@media (max-width: 960px) {
    .selections-dialog {
        width: 90vw;
    }
}

.selections-table {
    max-height: 300px;

    :deep(table) {
        table-layout: fixed;
        width: 100%;
    }

    &__cell {
        cursor: pointer;
    }

    &__actions {
        white-space: nowrap;
    }

    &__row--locked {
        opacity: 0.7;
        background: rgba(0, 0, 0, 0.12);
    }
}
</style>

<style lang="scss">
.selections-table__tooltip {
    word-break: break-word;
}

.selections-table__menu {
    max-width: 400px;
    max-height: 300px;
    padding: 8px 12px;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
}
</style>
