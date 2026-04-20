<template>
    <q-card v-if="propColumn" flat square class="p-p-3" style="background-color: rgb(0, 0, 0, 0.03)">
        <div v-if="column" class="row q-col-gutter-xs p-pb-3">
            <q-select v-tooltip.left="$t('dashboard.selectorWidget.descriptionColumnHint')" class="col-6" v-model="selectedDescriptionColumn" :options="availableDescriptionColumns" :label="$t('dashboard.selectorWidget.descriptionColumn')" option-value="columnName" option-label="alias" emit-value map-options dense square clearable @update:model-value="onDescriptionColumnChange" />
            <q-select class="col-6" v-model="column.orderColumn" :options="selectedDatasetColumns" emitValue clearable dense square :label="$t('dashboard.widgetEditor.sortingColumn')" option-value="name" option-label="name" @update:model-value="selectedColumnUpdated">
                <template v-slot:selected-item="scope">
                    {{ selectedDatasetColumns.find((col) => col.name === scope.opt)?.alias ?? '' }}
                </template>
            </q-select>
            <q-toggle v-model="showValueWithDescription" dense class="q-py-md" :label="$t('dashboard.selectorWidget.showValueWithDescription')" @update:model-value="onShowValueToggle" />
        </div>
        <div v-if="column" class="row q-col-gutter-xs p-pb-3">
            <q-toolbar class="col-12 kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>
                    <q-toggle class="col-12" v-model="column.filter.enabled" dense :label="$t('dashboard.widgetEditor.enableFilter')" @update:model-value="selectedColumnUpdated" />
                </q-toolbar-title>
                <Button v-tooltip.left="$t('dashboard.widgetEditor.columnFilterHint')" icon="pi pi-question-circle" class="p-button-text p-button-plain" />
            </q-toolbar>
            <q-select class="col-4" v-model="column.filter.operator" :options="getColumnFilterOptions()" emitValue clearable dense square :label="$t('common.operator')" option-label="label" option-value="value" :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange">
                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
            <q-input v-if="['=', '<', '>', '<=', '>=', '!=', 'like', 'range'].includes(column.filter.operator)" class="col-4 col-grow" :label="column.filter.operator === 'range' ? $t('common.from') : $t('common.value')" v-model="column.filter.value" dense square :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange" />
            <span v-if="['IN', 'not IN'].includes(column.filter.operator)" class="col-grow p-float-label kn-material-input">
                <Chips v-model="inFilterValues" class="kn-width-full" :add-on-blur="true" :disabled="!column.filter.enabled" @add="onInFilterValuesChange" @remove="onInFilterValuesChange" />
                <label class="kn-material-input-label">{{ $t('common.value') }}</label>
                <small>{{ $t('common.chipsHint') }}</small>
            </span>
            <q-input v-if="column.filter.operator === 'range'" class="col-4" :label="$t('common.to')" v-model="column.filter.value2" dense square :disable="!column.filter.enabled" @update:model-value="onFilterOperatorChange" />
        </div>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IDatasetColumn, IWidget, IWidgetColumn, IWidgetColumnFilter } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import Chips from 'primevue/chips'

export default defineComponent({
    name: 'selector-data-form',
    components: { Chips },
    props: {
        propColumn: { type: Object as PropType<IWidgetColumn | null>, required: true },
        widgetModel: { type: Object as PropType<IWidget>, required: true }
    },
    setup() {
        return { selectedDatasetColumns: inject('selectedDatasetColumns', []) as unknown as IDatasetColumn[] }
    },
    data() {
        return {
            commonDescriptor,
            column: null as IWidgetColumn | null,
            selectedDescriptionColumn: null as string | null,
            showValueWithDescription: false
        }
    },
    computed: {
        inFilterValues: {
            get(): string[] {
                if (!this.column?.filter?.value) return []
                return this.column.filter.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0)
            },
            set(values: string[]) {
                if (this.column?.filter) {
                    this.column.filter.value = values.join(', ')
                }
            }
        },
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
        getColumnFilterOptions() {
            return this.column?.fieldType === 'ATTRIBUTE' ? this.commonDescriptor.attributeColumnFilterOperators : this.commonDescriptor.measureColumnFilterOperators
        },
        onFilterOperatorChange() {
            if (!this.column || !this.column.filter) return
            if (!['=', '<', '>', '<=', '>=', '!=', 'IN', 'like', 'range', 'not IN'].includes(this.column.filter.operator)) this.column.filter.value = ''
            if (this.column.filter.operator !== 'range') delete this.column.filter.value2
            this.selectedColumnUpdated()
        },
        onInFilterValuesChange() {
            this.selectedColumnUpdated()
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
