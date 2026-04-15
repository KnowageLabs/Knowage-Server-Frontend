<template>
    <q-card v-if="propColumn" flat square class="p-p-3" style="background-color: rgb(0, 0, 0, 0.03)">
        <div v-if="column" class="row q-col-gutter-xs p-pb-3">
            <q-toolbar class="col-12 kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>
                    <q-toggle class="col-12" v-model="column.filter.enabled" dense color="accent" :label="$t('dashboard.widgetEditor.enableFilter')" @update:model-value="selectedColumnUpdated" />
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
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>
                <q-toggle v-model="descriptionEnabled" dense color="accent" :label="$t('dashboard.selectorWidget.enableDescriptionColumn')" @update:model-value="onToggleDescription" />
            </q-toolbar-title>
        </q-toolbar>
        <template v-if="descriptionEnabled">
            <div class="row q-col-gutter-xs">
                <div class="col-12 q-pa-sm">
                    <q-select v-model="selectedDescriptionColumn" :options="availableDescriptionColumns" :label="$t('dashboard.selectorWidget.descriptionColumn')" option-value="columnName" option-label="alias" emit-value map-options dense square clearable @update:model-value="onDescriptionColumnChange" />
                </div>
                <div class="col-12 q-pa-sm">
                    <q-toggle v-model="showValueWithDescription" dense color="accent" :label="$t('dashboard.selectorWidget.showValueWithDescription')" @update:model-value="onShowValueToggle" />
                </div>
            </div>
        </template>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDescriptionColumnConfig } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
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
    data() {
        return {
            commonDescriptor,
            column: null as IWidgetColumn | null,
            descriptionEnabled: false,
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
        currentConfig(): IDescriptionColumnConfig | null {
            if (!this.propColumn) return null
            return (this.widgetModel.settings?.configuration?.descriptionColumnConfigs ?? []).find((c: IDescriptionColumnConfig) => c.valueColumnName === this.propColumn!.columnName) ?? null
        },
        availableDescriptionColumns(): IWidgetColumn[] {
            if (!this.propColumn) return []
            const usedAsDesc = new Set<string>((this.widgetModel.settings?.configuration?.descriptionColumnConfigs ?? []).filter((c: IDescriptionColumnConfig) => c.valueColumnName !== this.propColumn!.columnName).map((c: IDescriptionColumnConfig) => c.descriptionColumnName))
            return this.widgetModel.columns.filter((col: IWidgetColumn) => col.columnName !== this.propColumn!.columnName && !usedAsDesc.has(col.columnName))
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
            if (this.currentConfig) {
                this.descriptionEnabled = true
                this.selectedDescriptionColumn = this.currentConfig.descriptionColumnName
                this.showValueWithDescription = this.currentConfig.showValueWithDescription
            } else {
                this.descriptionEnabled = false
                this.selectedDescriptionColumn = null
                this.showValueWithDescription = false
            }
        },
        ensureConfigArray() {
            if (!this.widgetModel.settings.configuration.descriptionColumnConfigs) {
                this.widgetModel.settings.configuration.descriptionColumnConfigs = []
            }
        },
        onToggleDescription(enabled: boolean) {
            this.ensureConfigArray()
            if (!enabled) {
                this.removeCurrentConfig()
                this.selectedDescriptionColumn = null
                this.showValueWithDescription = false
            }
            this.emitRefresh()
        },
        onDescriptionColumnChange(columnName: string | null) {
            this.ensureConfigArray()
            this.removeCurrentConfig()
            if (columnName && this.propColumn) {
                this.widgetModel.settings.configuration.descriptionColumnConfigs!.push({
                    valueColumnName: this.propColumn.columnName,
                    descriptionColumnName: columnName,
                    showValueWithDescription: this.showValueWithDescription
                })
            }
            this.emitRefresh()
        },
        onShowValueToggle(val: boolean) {
            if (!this.currentConfig) return
            this.currentConfig.showValueWithDescription = val
            this.emitRefresh()
        },
        removeCurrentConfig() {
            if (!this.propColumn) return
            const configs = this.widgetModel.settings?.configuration?.descriptionColumnConfigs
            if (!configs) return
            const idx = configs.findIndex((c: IDescriptionColumnConfig) => c.valueColumnName === this.propColumn!.columnName)
            if (idx !== -1) configs.splice(idx, 1)
        },
        emitRefresh() {
            emitter.emit('refreshSelector', this.widgetModel.id)
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        }
    }
})
</script>
