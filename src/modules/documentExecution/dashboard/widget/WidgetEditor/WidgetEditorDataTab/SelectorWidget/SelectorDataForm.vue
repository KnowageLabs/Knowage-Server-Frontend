<template>
    <div v-if="propColumn">
        <div v-if="column" class="row items-center q-col-gutter-sm">
            <q-select class="col-6" v-model="selectedDescriptionColumn" :options="availableDescriptionColumns" :label="$t('dashboard.selectorWidget.descriptionColumn')" option-value="columnName" option-label="alias" emit-value map-options outlined dense hide-bottom-space options-dense clearable @update:model-value="onDescriptionColumnChange">
                <q-tooltip :delay="500" anchor="center left" self="center right" max-width="300px">{{ $t('dashboard.selectorWidget.descriptionColumnHint') }}</q-tooltip>
            </q-select>
            <q-select class="col-6" v-model="column.orderColumn" :options="selectedDatasetColumns" emit-value clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.sortingColumn')" option-value="name" option-label="name" @update:model-value="selectedColumnUpdated">
                <template #selected-item="scope">
                    {{ selectedDatasetColumns.find((col) => col.name === scope.opt)?.alias ?? '' }}
                </template>
            </q-select>
            <div class="col-12">
                <q-toggle v-model="showValueWithDescription" dense :label="$t('dashboard.selectorWidget.showValueWithDescription')" @update:model-value="onShowValueToggle" />
            </div>
        </div>
        <WidgetEditorFilterForm v-if="column?.filter" :prop-column="column" />
    </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IDatasetColumn, IWidget, IWidgetColumn, IWidgetColumnFilter } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import WidgetEditorFilterForm from '../common/WidgetEditorFilterForm.vue'

export default defineComponent({
    name: 'selector-data-form',
    components: { WidgetEditorFilterForm },
    props: {
        propColumn: { type: Object as PropType<IWidgetColumn | null>, required: true },
        widgetModel: { type: Object as PropType<IWidget>, required: true }
    },
    setup() {
        return { selectedDatasetColumns: inject('selectedDatasetColumns', []) as unknown as IDatasetColumn[] }
    },
    data() {
        return {
            column: null as IWidgetColumn | null,
            selectedDescriptionColumn: null as string | null,
            showValueWithDescription: false
        }
    },
    computed: {
        availableDescriptionColumns(): IWidgetColumn[] {
            if (!this.propColumn) return []
            // Collect all columns that are already part of a binding on another pair:
            // both the value side (c.columnName) and the description side (c.descriptionColumn)
            const takenByOthers = new Set<string>()
            this.widgetModel.columns.forEach((c: IWidgetColumn) => {
                if (c.columnName !== this.propColumn!.columnName && c.descriptionColumn) {
                    takenByOthers.add(c.columnName)
                    takenByOthers.add(c.descriptionColumn)
                }
            })
            return this.widgetModel.columns.filter((col: IWidgetColumn) => col.columnName !== this.propColumn!.columnName && !takenByOthers.has(col.columnName))
        }
    },
    watch: {
        propColumn() {
            this.loadColumn()
            this.syncFromConfig()
        }
    },
    created() {
        this.loadColumn()
        this.syncFromConfig()
    },
    methods: {
        loadColumn() {
            this.column = this.propColumn
            if (this.column && !this.column.filter) (this.column as any).filter = { enabled: false, operator: '', value: '' } as IWidgetColumnFilter
        },
        selectedColumnUpdated() {
            emitter.emit('selectedColumnUpdated', this.column)
        },
        syncFromConfig() {
            if (this.column) {
                this.selectedDescriptionColumn = this.column.descriptionColumn ?? null
                this.showValueWithDescription = this.column.showValueWithDescription ?? false
            } else {
                this.selectedDescriptionColumn = null
                this.showValueWithDescription = false
            }
        },
        onDescriptionColumnChange(columnName: string | null) {
            if (!this.column) return
            if (columnName) {
                this.column.descriptionColumn = columnName
            } else {
                delete this.column.descriptionColumn
                delete this.column.showValueWithDescription
                this.showValueWithDescription = false
            }
            this.emitRefresh()
        },
        onShowValueToggle(val: boolean) {
            if (!this.column) return
            this.column.showValueWithDescription = val
            this.emitRefresh()
        },
        emitRefresh() {
            emitter.emit('refreshSelector', this.widgetModel.id)
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        }
    }
})
</script>
