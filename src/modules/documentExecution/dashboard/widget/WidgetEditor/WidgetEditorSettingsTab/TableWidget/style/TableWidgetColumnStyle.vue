<!-- eslint-disable vue/valid-v-model -->
<template>
    <div v-if="columnStyles" class="kn-flex p-p-4">
        <span v-if="themeStyle" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="columnStyles.enabled" color="black" /> </span>

        <div v-for="(columnStyle, index) in columnStyles.styles" :key="index">
            <div v-if="mode !== 'columnGroups'" class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-8">
                    <span class="p-float-label">
                        <Dropdown v-model="columnStyle.properties['align-items']" class="kn-material-input p-inputtext-sm" :options="descriptor.verticalAlignmentOptions" option-value="value" :disabled="columnStylesDisabled" @change="columnStylesChanged">
                            <template #value="slotProps">
                                <div>
                                    <span>{{ getTranslatedLabel(slotProps.value, descriptor.verticalAlignmentOptions, $t) }}</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <div>
                                    <span>{{ $t(slotProps.option.label) }}</span>
                                </div>
                            </template>
                        </Dropdown>
                        <label class="kn-material-input-label"> {{ $t('common.verticalAlign') }}</label>
                    </span>
                </div>
                <div class="p-field p-col-4">
                    <span class="p-float-label">
                        <InputNumber v-model="(columnStyle.properties.width as number)" class="kn-material-input p-inputtext-sm" :disabled="columnStylesDisabled" @blur="columnStylesChanged(index)" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('common.width') }}</label>
                    </span>
                </div>
            </div>
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12 p-d-flex p-flex-row">
                    <span class="p-float-label kn-flex">
                        <Dropdown v-if="index === 0" v-model="columnStyle.target" class="kn-material-input p-inputtext-sm" :options="descriptor.allColumnOption" option-value="value" option-label="label" :disabled="true"> </Dropdown>
                        <WidgetEditorColumnsMultiselect
                            v-else
                            :value="(columnStyle.target as string[])"
                            :available-target-options="availableColumnOptions"
                            :widget-columns-alias-map="widgetColumnsAliasMap"
                            option-label="alias"
                            option-value="id"
                            :disabled="columnStylesDisabled"
                            @change="onColumnsSelected($event, columnStyle)"
                        />
                        <label class="kn-material-input-label"> {{ $t('common.columns') }}</label>
                    </span>
                    <i v-if="widgetModel" :class="[index === 0 ? 'pi pi-plus-circle' : 'pi pi-trash', columnStylesDisabled ? 'icon-disabled' : '']" class="kn-cursor-pointer p-as-center p-ml-3" @click="index === 0 ? addColumnStyle() : removeColumnStyle(index)"></i>
                </div>
            </form>

            <WidgetEditorStyleToolbar :options="settingsDescriptor.defaultToolbarStyleOptions" :prop-model="columnStyle.properties" :disabled="columnStylesDisabled" @change="onStyleToolbarChange($event, columnStyle, index)"> </WidgetEditorStyleToolbar>

            <br v-if="widgetModel && index < columnStyles.styles.length - 1" />
            <br v-if="widgetModel && index < columnStyles.styles.length - 1" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetColumnStyle, IWidgetStyleToolbarModel, IWidgetColumn, ITableWidgetColumnGroup, ITableWidgetColumnStyles } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import settingsDescriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'table-widget-column-style',
    components: { Dropdown, InputNumber, WidgetEditorColumnsMultiselect, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ITableWidgetColumnStyles | null>, required: true }, mode: { type: String } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            settingsDescriptor,
            columnStyles: null as ITableWidgetColumnStyles | null,
            availableColumnOptions: [] as (IWidgetColumn | ITableWidgetColumnGroup | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any,
            getTranslatedLabel
        }
    },
    computed: {
        columnStylesDisabled() {
            return !this.columnStyles || !this.columnStyles.enabled
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
                    'background-color': 'rgb(0, 0, 0)',
                    color: 'rgb(255, 255, 255)',
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
            ;(columnStyle.properties['background-color'] = model['background-color'] ?? 'rgb(0, 0, 0)'),
                (columnStyle.properties.color = model.color ?? 'rgb(255, 255, 255)'),
                (columnStyle.properties['justify-content'] = model['justify-content'] ?? 'center'),
                (columnStyle.properties['font-size'] = model['font-size'] ?? '14px'),
                (columnStyle.properties['font-family'] = model['font-family'] ?? ''),
                (columnStyle.properties['font-style'] = model['font-style'] ?? 'normal'),
                (columnStyle.properties['font-weight'] = model['font-weight'] ?? '')
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

<style lang="scss" scoped></style>
