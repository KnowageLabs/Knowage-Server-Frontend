<template>
    <div class="p-field p-col-12 p-d-flex">
        <div class="kn-flex">
            <span class="p-float-label">
                <InputText id="fileName" v-model="customColorValue" class="kn-material-input kn-width-full" :disabled="true" />
                <label for="fileName" class="kn-material-input-label"> Custom color </label>
            </span>
        </div>
        <q-btn class="kn-button kn-button--primary p-mx-1 p-p-0 kn-flex" :style="`background-color:${customColorValue}`" unelevated>
            <q-menu touch-position>
                <q-color v-model="customColorValue" format-model="hexa" :palette="descriptor.defaultColors" @change="colorsChanged" />
            </q-menu>
        </q-btn>
        <q-btn icon="fas fa-plus" class="p-button-text" color="primary" unelevated @click="addColor"> </q-btn>
    </div>

    <DataTable v-if="colorsModel" class="pallete-table p-m-2" :style="descriptor.colorPaletteStyle.table" :value="colorsModel" :reorderable-columns="false" responsive-layout="scroll" @rowReorder="onRowReorder">
        <Column :row-reorder="true" :reorderable-column="false" :style="descriptor.colorPaletteStyle.column">
            <template #body="slotProps">
                <span class="kn-height-full" :style="`background-color: ${slotProps.data}; color:${getContrastYIQ()}`">
                    <i class="p-datatable-reorderablerow-handle pi pi-bars p-m-2"></i>
                </span>
            </template>
        </Column>
        <Column :sortable="false" :style="descriptor.colorPaletteStyle.columnMain">
            <template #body="slotProps">
                <span class="kn-flex" :style="`background-color: ${slotProps.data}; color:${getContrastYIQ()}`">{{ slotProps.data }}</span>
            </template>
        </Column>
        <Column :row-reorder="true" :reorderable-column="false" :style="descriptor.colorPaletteStyle.column">
            <template #body="slotProps">
                <span class="kn-height-full" :style="`background-color: ${slotProps.data}; color:${getContrastYIQ()}`">
                    <i class="pi pi-pencil p-mr-2">
                        <q-menu touch-position>
                            <q-color v-model="colorsModel[slotProps.index]" format-model="hexa" @change="colorsChanged" />
                        </q-menu>
                    </i>
                    <i class="pi pi-trash p-mr-2" @click="deleteColor(slotProps.index)"></i>
                </span>
            </template>
        </Column>
    </DataTable>

    <br />
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { useClickOutside } from '../../common/styleToolbar/useClickOutside'
import descriptor from './ChartColorSettingsDescriptor.json'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'hihgcharts-color-settings',
    components: { DataTable, Column },
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Array as PropType<string[] | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            customColorValue: '#8D8D8D',
            editIndex: -1,
            colorsModel: null as string[] | null
        }
    },
    watch: {
        widgetModel() {
            this.loadColorsModel()
        },
        themeStyle() {
            this.loadColorsModel()
        }
    },
    created() {
        this.setEventListeners()
        this.loadColorsModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('chartTypeChanged', this.loadColorsModel)
            emitter.on('themeSelected', this.loadColorsModel)
        },
        removeEventListeners() {
            emitter.off('chartTypeChanged', this.loadColorsModel)
            emitter.off('themeSelected', this.loadColorsModel)
        },
        loadColorsModel() {
            if (this.widgetModel?.settings?.chart?.colors) {
                this.colorsModel = this.widgetModel.settings.chart.colors
            } else if (this.themeStyle) {
                this.colorsModel = this.themeStyle
            }
        },
        onRowReorder(event) {
            if (!this.colorsModel) return
            this.colorsModel.splice(0, this.colorsModel.length, ...event.value)
            this.colorsChanged()
        },
        addColor() {
            if (!this.colorsModel) return
            this.colorsModel.push(this.customColorValue)
            this.colorsChanged()
        },
        deleteColor(index) {
            if (!this.colorsModel) return
            this.colorsModel.splice(index, 1)
            this.colorsChanged()
        },
        colorsChanged() {
            if (this.widgetModel) {
                this.widgetModel.settings.chart.colors = deepcopy(this.colorsModel)
                if (this.widgetModel.settings.chartModel?.model) {
                    this.widgetModel.settings.chartModel.model.colors = deepcopy(this.colorsModel)
                }
                emitter.emit('refreshChart', this.widgetModel?.id)
                this.$emit('styleChanged')
            }
        },
        getContrastYIQ() {
            //getContrastYIQ(hexcolor) {
            // var getRGBA = function(string) {
            //     var match = string.match(/^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/)
            //     return match
            //         ? {
            //               r: Number(match[1]),
            //               g: Number(match[2]),
            //               b: Number(match[3]),
            //               a: Number(match[4])
            //           }
            //         : {}
            // }
            // var rgba = getRGBA(hexcolor) as any
            // var yiq = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000
            // return yiq >= 128 ? 'black' : 'white'
        }
    }
})
</script>

<style lang="scss">
.pallete-table .p-datatable-tbody {
    tr {
        td {
            height: 30px;
            span {
                display: flex;
                align-items: center;
            }
        }
    }
}
</style>
