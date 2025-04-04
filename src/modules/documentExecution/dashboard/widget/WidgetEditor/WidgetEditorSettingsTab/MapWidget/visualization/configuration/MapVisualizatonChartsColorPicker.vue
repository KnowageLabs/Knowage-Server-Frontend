<template>
    <div class="p-field p-col-12 p-d-flex">
        <div class="kn-flex">
            <span class="p-float-label">
                <InputText id="customColor" v-model="customColorValue" class="kn-material-input kn-width-full" :disabled="true" />
                <label for="customColor" class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.customColor') }}</label>
            </span>
        </div>
        <Button class="kn-button kn-button--primary click-outside p-mx-1 p-p-0 kn-flex" :style="`background-color:${customColorValue}`" @click="toggleColorPicker(-1)"></Button>
        <Button icon="fas fa-plus fa-1x" class="p-button-text p-button-plain p-ml-2" @click="addColor" />
    </div>

    <ColorPicker v-if="colorPickerVisible" class="dashboard-color-picker click-outside" theme="light" :color="customColorValue" :colors-default="descriptor.defaultColors" :sucker-hide="true" @changeColor="changeColor" />

    <DataTable v-if="visualizationType" class="pallete-table p-col-12 p-p-0" :style="descriptor.colorPaletteStyle.table" :value="visualizationType.colors" :reorderable-columns="false" responsive-layout="scroll" @rowReorder="onRowReorder">
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
                    <i class="pi pi-pencil kn-cursor-pointer p-mr-2 click-outside" @click="toggleColorPicker(slotProps.index)"></i>
                    <i class="pi pi-trash kn-cursor-pointer p-mr-2" @click="deleteColor(slotProps.index)"></i>
                </span>
            </template>
        </Column>
    </DataTable>

    <br />
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import { IMapWidgetVisualizationTypePie } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { ColorPicker } from 'vue-color-kit'
import { useClickOutside } from '../../../common/styleToolbar/useClickOutside'
import 'vue-color-kit/dist/vue-color-kit.css'
import descriptor from './MapVisualizationDescriptor.json'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

export default defineComponent({
    name: 'map-visualizations-charts-color-picker',
    components: { DataTable, Column, ColorPicker },
    props: { propVisualizationType: { type: Object as PropType<IMapWidgetVisualizationTypePie | undefined>, required: true } },
    setup() {
        const knowageStyleIcon = ref(null)
        const colorPickerVisible = ref(false)
        const contextMenuVisible = ref(false)
        useClickOutside(knowageStyleIcon, () => {
            colorPickerVisible.value = false
            contextMenuVisible.value = false
        })
        return { colorPickerVisible, contextMenuVisible, knowageStyleIcon }
    },
    data() {
        return {
            descriptor,
            customColorValue: '#8D8D8D',
            editIndex: -1,
            colorPickTimer: null as any,
            useClickOutside,
            visualizationType: null as IMapWidgetVisualizationTypePie | null
        }
    },
    watch: {
        widgetModel() {
            this.loadVisualizationType()
        }
    },
    created() {
        this.loadVisualizationType()
    },
    unmounted() {},
    methods: {
        loadVisualizationType() {
            this.visualizationType = this.propVisualizationType ?? null
        },
        toggleColorPicker(index) {
            this.colorPickerVisible = !this.colorPickerVisible
            this.editIndex = index
        },
        onRowReorder(event: { value: string[] }) {
            if (this.visualizationType) this.visualizationType.colors = [...event.value]
        },
        addColor() {
            if (this.visualizationType) this.visualizationType.colors.push(this.customColorValue)
        },
        changeColor(color: any) {
            const { r, g, b, a } = color.rgba

            if (this.colorPickTimer) {
                clearTimeout(this.colorPickTimer)
                this.colorPickTimer = null
            }
            this.colorPickTimer = setTimeout(() => {
                if (!this.customColorValue || !this.visualizationType) return
                if (this.editIndex != -1) this.visualizationType.colors[this.editIndex] = `rgba(${r}, ${g}, ${b}, ${a})`
                else this.customColorValue = `rgba(${r}, ${g}, ${b}, ${a})`
            }, 200)
        },
        deleteColor(index: number) {
            if (this.visualizationType) this.visualizationType.colors.splice(index, 1)
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
