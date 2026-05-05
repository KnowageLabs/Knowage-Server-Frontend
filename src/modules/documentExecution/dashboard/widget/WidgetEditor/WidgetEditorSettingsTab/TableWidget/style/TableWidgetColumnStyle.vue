<template>
    <div v-if="columnStyles" class="q-px-md q-pb-md">
        <div v-if="themeStyle" class="row items-center q-mb-sm">
            <q-toggle v-model="columnStyles.enabled" :label="$t('common.enabled')" dense />
        </div>

        <div v-for="(columnStyle, index) in columnStyles.styles" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <!-- Card content -->
            <div class="col q-pa-sm">
                <div class="row q-mb-sm">
                    <div class="col">
                        <q-select v-if="index === 0" :model-value="descriptor.allColumnOption[0].value" :options="descriptor.allColumnOption" option-value="value" option-label="label" emit-value map-options outlined dense disable />
                        <WidgetEditorColumnsMultiselect v-else :value="columnStyle.target as string[]" :available-target-options="availableColumnOptions" :widget-columns-alias-map="widgetColumnsAliasMap" option-label="alias" option-value="id" :disabled="columnStylesDisabled" @change="onColumnsSelected($event, columnStyle)" />
                    </div>
                </div>

                <!-- Vertical align + width (not for columnGroups mode) -->
                <div v-if="mode !== 'columnGroups'" class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-8">
                        <q-select v-model="columnStyle.properties['align-items']" :options="translatedVerticalAlignmentOptions" option-value="value" option-label="label" emit-value map-options :label="$t('common.verticalAlign')" outlined dense :disable="columnStylesDisabled" @update:model-value="columnStylesChanged" />
                    </div>
                    <div class="col-4">
                        <q-input v-model.number="columnStyle.properties.width" type="number" :label="$t('common.width')" outlined dense :disable="columnStylesDisabled" @blur="columnStylesChanged(index)" />
                    </div>
                </div>

                <WidgetEditorStyleToolbar :options="settingsDescriptor.defaultToolbarStyleOptions" :prop-model="columnStyle.properties" :disabled="columnStylesDisabled" @change="onStyleToolbarChange($event, columnStyle, index)" />
            </div>
            <!-- Action handle (full-height, shown on hover) -->
            <div v-if="widgetModel" class="kn-action-handle row items-center justify-center" :class="columnStylesDisabled ? 'kn-action-handle-disabled' : ''">
                <q-btn flat round dense :icon="index === 0 ? 'add' : 'delete'" size="sm" :disable="columnStylesDisabled" @click="index === 0 ? addColumnStyle() : removeColumnStyle(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetColumnStyle, IWidgetStyleToolbarModel, IWidgetColumn, ITableWidgetColumnGroup, ITableWidgetColumnStyles } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import settingsDescriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'table-widget-column-style',
    components: { WidgetEditorColumnsMultiselect, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ITableWidgetColumnStyles | null>, required: true }, mode: { type: String } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            settingsDescriptor,
            columnStyles: null as ITableWidgetColumnStyles | null,
            availableColumnOptions: [] as (IWidgetColumn | ITableWidgetColumnGroup | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any
        }
    },
    computed: {
        columnStylesDisabled() {
            return !this.columnStyles || !this.columnStyles.enabled
        },
        translatedVerticalAlignmentOptions(): { value: string; label: string }[] {
            return descriptor.verticalAlignmentOptions.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        }
    },
    created() {
        this.setEventListeners()
        this.loadColumnOptions()
        this.loadColumnStyles()
        this.loadWidgetColumnMaps()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromColumnStyle', this.onColumnOrGroupRemoved)
            emitter.on('columnGroupRemoved', this.onColumnOrGroupRemoved)
            emitter.on('columnAdded', this.onColumnAdded)
            emitter.on('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.on('themeSelected', this.loadColumnStyles)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromColumnStyle', this.onColumnOrGroupRemoved)
            emitter.off('columnGroupRemoved', this.onColumnOrGroupRemoved)
            emitter.off('columnAdded', this.onColumnAdded)
            emitter.off('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.off('themeSelected', this.loadColumnStyles)
        },
        onColumnOrGroupRemoved() {
            this.onColumnRemoved()
        },
        onColumnAliasRenamed() {
            this.updateColumnAliases()
        },
        onColumnAdded() {
            this.addColumnAsOption()
        },
        loadColumnStyles() {
            if (this.widgetModel) {
                this.columnStyles = this.mode === 'columnGroups' ? this.widgetModel.settings.style.columnGroups : this.widgetModel.settings.style.columns
                this.removeColumnsFromAvailableOptions()
            } else if (this.themeStyle) this.columnStyles = this.themeStyle
        },
        loadColumnOptions() {
            if (!this.widgetModel) return
            this.availableColumnOptions =
                this.mode === 'columnGroups'
                    ? this.widgetModel.settings.configuration.columnGroups.groups?.map((columnGroup: ITableWidgetColumnGroup) => {
                          return { id: columnGroup.id, alias: columnGroup.label }
                      })
                    : [...this.widgetModel.columns]
        },
        columnStylesChanged(index: number | null = null) {
            if (!this.widgetModel) return
            const event = this.mode === 'columnGroups' ? 'columnGroupStylesChanged' : 'columnStylesChanged'
            emitter.emit(event, this.columnStyles)
            if (!index || index === 0) this.$emit('styleChanged')
        },
        loadWidgetColumnMaps() {
            if (!this.widgetModel) return
            const array = this.mode === 'columnGroups' ? this.widgetModel.settings.configuration.columnGroups.groups : this.widgetModel.columns
            array.forEach((column: IWidgetColumn | ITableWidgetColumnGroup) => {
                if (column.id) this.widgetColumnsAliasMap[column.id] = this.mode === 'columnGroups' ? (column as ITableWidgetColumnGroup).label : (column as IWidgetColumn).alias
            })
        },
        removeColumnsFromAvailableOptions() {
            if (!this.widgetModel) return
            const array = this.mode === 'columnGroups' ? this.widgetModel.settings.style.columnGroups.styles : this.widgetModel.settings.style.columns.styles
            for (let i = 1; i < array.length; i++) {
                for (let j = 0; j < array[i].target.length; j++) {
                    this.removeColumnFromAvailableOptions({
                        id: array[i].target[j],
                        alias: array[i].target[j]
                    })
                }
            }
        },
        removeColumnFromAvailableOptions(tempColumn: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | ITableWidgetColumnGroup | { id: string; alias: string }) => targetOption.id === tempColumn.id)
            if (index !== -1) this.availableColumnOptions.splice(index, 1)
        },
        onColumnsSelected(event: any, columnStyle: ITableWidgetColumnStyle, index: number | null = null) {
            const intersection = (columnStyle.target as string[]).filter((el: string) => !event.value.includes(el))
            columnStyle.target = event.value

            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(columnStyle)
            this.columnStylesChanged(index)
        },
        onColumnsAddedFromMultiselect(columnStyle: ITableWidgetColumnStyle) {
            ;(columnStyle.target as string[]).forEach((target: string) => {
                const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | ITableWidgetColumnGroup | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableColumnOptions.splice(index, 1)
            })
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) =>
                this.availableColumnOptions.push({
                    id: el,
                    alias: this.widgetColumnsAliasMap[el]
                })
            )
        },
        addColumnStyle() {
            if (!this.columnStyles || this.columnStylesDisabled) return
            this.columnStyles.styles.push({
                target: [],
                properties: {
                    'align-items': 'center',
                    width: '',
                    'background-color': 'rgb(255, 255, 255, 0)',
                    color: 'rgb(0, 0, 0)',
                    'justify-content': '',
                    'font-size': '',
                    'font-family': '',
                    'font-style': '',
                    'font-weight': ''
                }
            })
        },
        removeColumnStyle(index: number) {
            if (!this.columnStyles || this.columnStylesDisabled) return
            ;(this.columnStyles.styles[index].target as string[]).forEach((target: string) =>
                this.availableColumnOptions.push({
                    id: target,
                    alias: this.widgetColumnsAliasMap[target]
                })
            )
            this.columnStyles.styles.splice(index, 1)
            this.columnStylesChanged()
        },
        addColumnAsOption() {
            if (this.widgetModel) this.reloadModel()
        },
        onColumnRemoved() {
            if (this.widgetModel) this.reloadModel()
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, columnStyle: ITableWidgetColumnStyle, index: number | null = null) {
            ;((columnStyle.properties['background-color'] = model['background-color'] ?? 'rgb(0, 0, 0)'),
                (columnStyle.properties.color = model.color ?? 'rgb(255, 255, 255)'),
                (columnStyle.properties['justify-content'] = model['justify-content'] ?? 'center'),
                (columnStyle.properties['font-size'] = model['font-size'] ?? '14px'),
                (columnStyle.properties['font-family'] = model['font-family'] ?? ''),
                (columnStyle.properties['font-style'] = model['font-style'] ?? 'normal'),
                (columnStyle.properties['font-weight'] = model['font-weight'] ?? ''))
            this.columnStylesChanged(index)
        },
        reloadModel() {
            this.loadColumnOptions()
            this.loadColumnStyles()
            this.loadWidgetColumnMaps()
        },
        updateColumnAliases() {
            if (this.widgetModel)
                setTimeout(() => {
                    this.loadColumnOptions()
                    this.loadColumnStyles()
                    this.loadWidgetColumnMaps()
                }, 1000)
        }
    }
})
</script>

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
