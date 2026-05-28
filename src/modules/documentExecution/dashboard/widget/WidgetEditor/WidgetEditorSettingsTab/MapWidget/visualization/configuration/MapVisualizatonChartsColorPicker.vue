<template>
    <div class="p-field p-col-12 p-d-flex">
        <div class="kn-flex">
            <span class="p-float-label">
                <InputText id="customColor" v-model="customColorValue" class="kn-material-input kn-width-full" :disabled="true" />
                <label for="customColor" class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.customColor') }}</label>
            </span>
        </div>
        <q-btn class="kn-button kn-button--primary p-mx-1 p-p-0 kn-flex" :style="`background-color:${customColorValue}`" unelevated>
            <q-menu touch-position>
                <q-color v-model="customColorValue" format-model="hexa" :palette="descriptor.defaultColors" />
            </q-menu>
        </q-btn>
        <q-btn icon="fas fa-plus" class="p-button-text" color="primary" unelevated @click="addColor" />
    </div>

    <DataTable v-if="colorsModel" class="pallete-table p-col-12 p-p-0" :style="descriptor.colorPaletteStyle.table" :value="colorsModel" :reorderable-columns="false" responsive-layout="scroll" @rowReorder="onRowReorder">
        <Column :row-reorder="true" :reorderable-column="false" :style="descriptor.colorPaletteStyle.column">
            <template #body="slotProps">
                <span class="kn-height-full" :style="`background-color: ${slotProps.data};`">
                    <i class="p-datatable-reorderablerow-handle pi pi-bars p-m-2"></i>
                </span>
            </template>
        </Column>
        <Column :sortable="false" :style="descriptor.colorPaletteStyle.columnMain">
            <template #body="slotProps">
                <span class="kn-flex" :style="`background-color: ${slotProps.data};`">{{ slotProps.data }}</span>
            </template>
        </Column>
        <Column :row-reorder="true" :reorderable-column="false" :style="descriptor.colorPaletteStyle.column">
            <template #body="slotProps">
                <span class="kn-height-full" :style="`background-color: ${slotProps.data};`">
                    <i class="pi pi-pencil kn-cursor-pointer p-mr-2">
                        <q-menu touch-position>
                            <q-color v-model="colorsModel[slotProps.index]" format-model="hexa" :palette="descriptor.defaultColors" @change="colorsChanged" />
                        </q-menu>
                    </i>
                    <i class="pi pi-trash kn-cursor-pointer p-mr-2" @click="deleteColor(slotProps.index)"></i>
                </span>
            </template>
        </Column>
    </DataTable>

    <br />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetVisualizationTypePie } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import descriptor from './MapVisualizationDescriptor.json'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import * as mapWidgetDefaultValues from '../../../../helpers/mapWidget/MapWidgetDefaultValues'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'map-visualizations-charts-color-picker',
    components: { DataTable, Column },
    props: { propVisualizationType: { type: Object as PropType<IMapWidgetVisualizationTypePie | undefined>, required: true } },
    data() {
        return {
            descriptor,
            customColorValue: '#8D8D8D',
            visualizationType: null as IMapWidgetVisualizationTypePie | null,
            colorsModel: null as string[] | null
        }
    },
    watch: {
        propVisualizationType() {
            this.loadVisualizationType()
        }
    },
    created() {
        this.loadVisualizationType()
    },
    methods: {
        loadVisualizationType() {
            this.visualizationType = this.propVisualizationType ?? null
            if (!this.visualizationType) {
                this.colorsModel = null
                return
            }
            const defaultColors = mapWidgetDefaultValues.getDefaultVisualizationPieConfiguration().colors
            const sourceColors = this.visualizationType.colors?.length ? this.visualizationType.colors : defaultColors
            this.colorsModel = deepcopy(sourceColors)
            if (!this.visualizationType.colors || this.visualizationType.colors.length === 0) this.colorsChanged()
        },
        onRowReorder(event: { value: string[] }) {
            if (!this.colorsModel) return
            this.colorsModel.splice(0, this.colorsModel.length, ...event.value)
            this.colorsChanged()
        },
        addColor() {
            if (!this.colorsModel) this.colorsModel = []
            this.colorsModel.push(this.customColorValue)
            this.colorsChanged()
        },
        colorsChanged() {
            if (!this.visualizationType || !this.colorsModel) return
            this.visualizationType.colors = deepcopy(this.colorsModel)
        },
        deleteColor(index: number) {
            if (!this.colorsModel) return
            this.colorsModel.splice(index, 1)
            this.colorsChanged()
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
