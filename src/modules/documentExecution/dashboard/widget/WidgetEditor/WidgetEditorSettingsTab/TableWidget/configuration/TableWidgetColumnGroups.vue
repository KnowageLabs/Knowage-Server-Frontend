<template>
    <div v-if="columnGroupsModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div v-for="(columnGroup, index) in columnGroupsModel.groups" :key="index" class="col-12 row q-col-gutter-sm items-center">
                <div class="col-4">
                    <q-input v-model="columnGroup.label" :label="$t('common.label')" outlined dense :disable="columnGroupsDisabled" @change="onColumnGroupLabelChanged(columnGroup)" />
                </div>
                <div class="col">
                    <WidgetEditorColumnsMultiselect :value="columnGroup.columns" :available-target-options="availableColumnOptions" :widget-columns-alias-map="widgetColumnsAliasMap" option-label="alias" option-value="id" :disabled="columnGroupsDisabled" @change="onColumnsSelected($event, columnGroup)" />
                </div>
                <div class="col-auto">
                    <q-btn flat round dense :icon="index === 0 ? 'add_circle_outline' : 'delete'" size="sm" :disable="columnGroupsDisabled" @click="index === 0 ? addColumnGroup() : removeColumnGroup(index)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetColumnGroups, IWidgetColumn, ITableWidgetColumnGroup } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { removeColumnGroupFromModel } from '../../../helpers/tableWidget/TableWidgetFunctions'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'table-widget-column-groups',
    components: { WidgetEditorColumnsMultiselect },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            columnGroupsModel: null as ITableWidgetColumnGroups | null,
            availableColumnOptions: [] as (IWidgetColumn | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any
        }
    },
    computed: {
        columnGroupsDisabled() {
            return !this.columnGroupsModel || !this.columnGroupsModel.enabled
        }
    },
    watch: {
        columnGroupsDisabled() {
            this.onEnableColumnGroupsChanged()
        }
    },
    created() {
        this.setEventListeners()
        this.loadColumnOptions()
        this.loadColumnGroups()
        this.loadWidgetColumnAliasMap()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromColumnGroups', this.onColumnRemovedFromColumnGroups)
            emitter.on('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.on('columnAdded', this.onColumnAdded)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromColumnGroups', this.onColumnRemovedFromColumnGroups)
            emitter.off('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.off('columnAdded', this.onColumnAdded)
        },
        onColumnRemovedFromColumnGroups() {
            this.onColumnRemoved()
        },
        onColumnAliasRenamed(column: any) {
            this.updateColumnAliases(column)
        },
        onColumnAdded(column: any) {
            this.addColumnAsOption(column)
        },
        loadColumnOptions() {
            this.availableColumnOptions = [...this.widgetModel.columns]
        },
        loadColumnGroups() {
            if (this.widgetModel?.settings?.configuration) this.columnGroupsModel = this.widgetModel.settings.configuration.columnGroups
            this.removeColumnsFromAvailableOptions()
        },
        removeColumnsFromAvailableOptions() {
            for (let i = 0; i < this.widgetModel.settings.configuration.columnGroups.groups.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.configuration.columnGroups.groups[i].columns.length; j++) {
                    this.removeColumnFromAvailableOptions({
                        id: this.widgetModel.settings.configuration.columnGroups.groups[i].columns[j],
                        alias: this.widgetModel.settings.configuration.columnGroups.groups[i].columns[j]
                    })
                }
            }
        },
        removeColumnFromAvailableOptions(tempColumn: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === tempColumn.id)
            if (index !== -1) this.availableColumnOptions.splice(index, 1)
        },
        loadWidgetColumnAliasMap() {
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
            })
        },
        columnGroupsConfigurationChanged() {
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onEnableColumnGroupsChanged() {
            if (!this.columnGroupsModel) return
            if (this.columnGroupsModel.enabled && this.columnGroupsModel.groups.length === 0) {
                this.columnGroupsModel.groups.push({
                    id: crypto.randomUUID(),
                    label: '',
                    columns: []
                })
            }
            this.columnGroupsConfigurationChanged()
        },
        onColumnsSelected(event: any, columnGroup: ITableWidgetColumnGroup) {
            const intersection = columnGroup.columns.filter((el: string) => !event.value.includes(el))
            columnGroup.columns = event.value
            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(columnGroup)
            this.columnGroupsConfigurationChanged()
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) =>
                this.availableColumnOptions.push({
                    id: el,
                    alias: this.widgetColumnsAliasMap[el]
                })
            )
        },
        onColumnsAddedFromMultiselect(columnGroup: ITableWidgetColumnGroup) {
            columnGroup.columns.forEach((target: string) => {
                const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableColumnOptions.splice(index, 1)
            })
        },
        addColumnGroup() {
            if (!this.columnGroupsModel) return
            this.columnGroupsModel.groups.push({
                id: crypto.randomUUID(),
                label: '',
                columns: []
            })
            this.columnGroupsConfigurationChanged()
        },
        removeColumnGroup(index: number) {
            if (!this.columnGroupsModel) return
            this.columnGroupsModel.groups[index].columns.forEach((target: string) =>
                this.availableColumnOptions.push({
                    id: target,
                    alias: this.widgetColumnsAliasMap[target]
                })
            )
            removeColumnGroupFromModel(this.widgetModel, this.columnGroupsModel.groups[index])
            this.columnGroupsModel.groups.splice(index, 1)
            this.columnGroupsConfigurationChanged()
        },
        onColumnRemoved() {
            this.loadColumnOptions()
            this.loadColumnGroups()
            this.columnGroupsConfigurationChanged()
        },
        updateColumnAliases(column: IWidgetColumn) {
            if (!this.columnGroupsModel) return
            if (column.id && this.widgetColumnsAliasMap[column.id]) this.widgetColumnsAliasMap[column.id] = column.alias

            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === column.id)
            if (index !== -1) this.availableColumnOptions[index].alias = column.alias
            this.columnGroupsConfigurationChanged()
        },
        addColumnAsOption(column: IWidgetColumn) {
            this.availableColumnOptions.push(column)
            if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
        },
        onColumnGroupLabelChanged(columnGroup: ITableWidgetColumnGroup) {
            emitter.emit('columnGroupLabelChanged', columnGroup)
            this.columnGroupsConfigurationChanged()
        }
    }
})
</script>
