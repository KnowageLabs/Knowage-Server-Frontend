<template>
    <div class="q-px-md q-pb-md">
        <!-- Add button -->
        <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.tooltips.addTooltip') }}</span>
            <q-btn flat round dense color="primary" icon="add" @click="addTooltip" />
        </div>

        <div v-for="(tooltip, index) in tooltips" :key="index">
            <div class="tooltip-row row no-wrap" :draggable="index !== 0" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                <!-- Drag handle (disabled for default row) -->
                <div class="kn-drag-handle row items-center justify-center" :class="index === 0 ? 'kn-drag-handle-disabled' : ''">
                    <q-icon v-if="index !== 0" name="drag_indicator" size="xs" />
                </div>

                <!-- Card content -->
                <div class="col q-pa-sm">
                    <div class="row col-auto q-mb-sm">
                        <q-toggle v-model="tooltip.enabled" :label="$t('common.enabled')" dense @update:model-value="tooltipsChanged" />
                    </div>
                    <!-- Row 1: columns + enabled + prefix + suffix + precision -->
                    <div class="row items-center no-wrap q-col-gutter-sm q-mb-sm">
                        <div class="col">
                            <q-select v-if="index === 0" :model-value="descriptor.allColumnOption[0].value" :options="descriptor.allColumnOption" option-value="value" option-label="label" emit-value map-options :label="$t('common.columns')" outlined dense disable />
                            <WidgetEditorColumnsMultiselect v-else :value="tooltip.target as string[]" :available-target-options="availableColumnOptions" :widget-columns-alias-map="widgetColumnsAliasMap" option-label="alias" option-value="id" @change="onColumnsSelected($event, tooltip)" />
                        </div>
                        <div class="col">
                            <q-input v-model="tooltip.prefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense :disable="!tooltip.enabled" @change="tooltipsChanged" />
                        </div>
                        <div class="col">
                            <q-input v-model="tooltip.suffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense :disable="!tooltip.enabled" @change="tooltipsChanged" />
                        </div>
                        <div v-if="optionsContainMeasureColumn(tooltip)" class="col-2">
                            <q-input v-model.number="tooltip.precision" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense :disable="!tooltip.enabled" @change="tooltipsChanged" />
                        </div>
                    </div>

                    <!-- Row 2: custom header -->
                    <div class="col-auto q-mb-sm">
                        <q-toggle v-model="tooltip.header.enabled" :label="$t('dashboard.widgetEditor.tooltips.customHeader')" dense :disable="!tooltip.enabled" @update:model-value="tooltipsChanged" />
                    </div>
                    <div class="col">
                        <q-input v-model="tooltip.header.text" :label="$t('common.text')" :hint="$t('dashboard.widgetEditor.inputHintForTooltips')" outlined dense :disable="!tooltip.enabled || !tooltip.header.enabled" @change="tooltipsChanged" />
                    </div>
                </div>

                <!-- Delete handle (disabled for default row) -->
                <div class="kn-action-handle row items-center justify-center" :class="index === 0 ? 'kn-action-handle-disabled' : ''">
                    <q-btn v-if="index !== 0" flat round dense icon="delete" size="sm" :disable="index === 0" @click.stop="removeTooltip(index)" />
                </div>
            </div>

            <!-- Dropzone after every item so rows can be moved to position 1 -->
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetTooltipStyle, IWidgetColumn, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'table-widget-tooltips',
    components: { WidgetEditorColumnsMultiselect },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, variables: { type: Array as PropType<IVariable[]> } },
    data() {
        return {
            descriptor,
            tooltips: [] as ITableWidgetTooltipStyle[],
            availableColumnOptions: [] as (IWidgetColumn | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any,
            widgetColumnsTypeMap: {} as any,
            isDragging: false,
            activeDropzone: -1
        }
    },
    created() {
        this.setEventListeners()
        this.loadColumnOptions()
        this.loadTooltips()
        this.loadWidgetColumnMaps()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromTooltips', this.onColumnRemovedFromTooltips)
            emitter.on('columnAdded', this.loadColumnOptions)
            emitter.on('columnRemoved', this.loadColumnOptions)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromTooltips', this.onColumnRemovedFromTooltips)
            emitter.off('columnAdded', this.loadColumnOptions)
            emitter.off('columnRemoved', this.loadColumnOptions)
        },
        onColumnRemovedFromTooltips() {
            this.onColumnRemoved()
        },
        loadTooltips() {
            if (this.widgetModel?.settings?.tooltips) this.tooltips = this.widgetModel.settings.tooltips
            this.removeColumnsFromAvailableOptions()
        },

        removeColumnsFromAvailableOptions() {
            for (let i = 1; i < this.widgetModel.settings.tooltips.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.tooltips[i].target.length; j++) {
                    this.removeColumnFromAvailableOptions({
                        id: this.widgetModel.settings.tooltips[i].target[j],
                        alias: this.widgetModel.settings.tooltips[i].target[j]
                    })
                }
            }
        },
        removeColumnFromAvailableOptions(tempColumn: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === tempColumn.id)
            if (index !== -1) this.availableColumnOptions.splice(index, 1)
        },
        loadColumnOptions() {
            this.availableColumnOptions = [...this.widgetModel.columns]
        },
        loadWidgetColumnMaps() {
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
                if (column.id && column.fieldType) this.widgetColumnsTypeMap[column.id] = column.fieldType
            })
        },
        tooltipsChanged() {
            emitter.emit('tooltipsChanged', this.tooltips)
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onColumnsSelected(event: any, tooltip: ITableWidgetTooltipStyle) {
            const intersection = (tooltip.target as string[]).filter((el: string) => !event.value.includes(el))
            tooltip.target = event.value
            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(tooltip)
            this.tooltipsChanged()
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) =>
                this.availableColumnOptions.push({
                    id: el,
                    alias: this.widgetColumnsAliasMap[el]
                })
            )
        },
        onColumnsAddedFromMultiselect(tooltip: ITableWidgetTooltipStyle) {
            ;(tooltip.target as string[]).forEach((target: string) => {
                const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableColumnOptions.splice(index, 1)
            })
        },
        optionsContainMeasureColumn(tooltip: ITableWidgetTooltipStyle) {
            let found = false
            for (let i = 0; i < tooltip.target.length; i++) {
                if (this.widgetColumnsTypeMap[tooltip.target[i]] === 'MEASURE') {
                    found = true
                    break
                }
            }
            return found
        },
        addTooltip() {
            this.tooltips.push({
                target: [],
                enabled: true,
                prefix: '',
                suffix: '',
                precision: 0,
                header: {
                    enabled: false,
                    text: ''
                }
            })
        },
        removeTooltip(index: number) {
            ;(this.tooltips[index].target as string[]).forEach((target: string) =>
                this.availableColumnOptions.push({
                    id: target,
                    alias: this.widgetColumnsAliasMap[target]
                })
            )
            this.tooltips.splice(index, 1)
            this.tooltipsChanged()
        },
        onDragStart(event: any, index: number) {
            if (index === 0) return
            this.isDragging = true
            this.activeDropzone = -1
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropAtIndex(event: any, targetDropzoneIndex: number) {
            this.isDragging = false
            this.activeDropzone = -1
            const sourceIndex = JSON.parse(event.dataTransfer.getData('text/plain'))
            // targetDropzoneIndex is the insert position (after item at targetDropzoneIndex - 1)
            if (sourceIndex === 0 || targetDropzoneIndex === 0) return
            if (sourceIndex === targetDropzoneIndex || sourceIndex === targetDropzoneIndex - 1) return
            const [removed] = this.tooltips.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            this.tooltips.splice(Math.max(insertAt, 1), 0, removed)
            this.tooltipsChanged()
        },

        onColumnRemoved() {
            this.loadColumnOptions()
            this.loadTooltips()
        }
    }
})
</script>

<style lang="scss" scoped>
.tooltip-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
