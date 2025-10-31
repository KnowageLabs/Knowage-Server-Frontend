<template>
    <div v-if="visualizationTypeConfiguration" class="p-formgrid p-grid p-mt-2">
        <div class="p-field p-float-label p-col-12 p-lg-6 p-fluid">
            <Dropdown v-model="visualizationTypeConfiguration.method" class="kn-material-input" :options="descriptor.classesMethodOptions" option-value="value">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.classesMethodOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
            <label for="attributes" class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.classesMethodOptions.title') }}</label>
        </div>

        <div v-if="classifyByRanges" class="p-col-12 p-lg-6">
            <Button class="kn-button kn-button--primary" @click="onManageRangesClicked">{{ $t('dashboard.widgetEditor.map.manageRanges') }}</Button>
        </div>
        <div v-if="!classifyByRanges" class="p-float-label p-col-12 p-lg-6 p-fluid">
            <InputNumber v-model="visualizationTypeConfiguration.classes" class="kn-material-input" />
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.classesNumber') }}</label>
        </div>

        <div class="p-col-12" :class="{ 'p-lg-4': type === 'choropleth', 'p-lg-3': type === 'balloons' }">
            <WidgetEditorColorPicker :initial-value="visualizationTypeConfiguration.style.color" :label="$t('common.color')" @change="onSelectionColorChanged($event, 'color')"></WidgetEditorColorPicker>
        </div>

        <div v-if="!classifyByRanges && type !== 'balloons'" class="p-col-12" :class="{ 'p-lg-4': type === 'choropleth', 'p-lg-3': type === 'balloons' }">
            <WidgetEditorColorPicker :initial-value="(visualizationTypeConfiguration as IMapWidgetVisualizationTypeChoropleth).style.toColor" :label="$t('dashboard.widgetEditor.map.toColor')" @change="onSelectionColorChanged($event, 'toColor')"></WidgetEditorColorPicker>
        </div>

        <div v-if="type === 'balloons'" class="p-pl-5 p-col-12 p-lg-3">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.rangeLabel') }}</label>
            <q-range v-model="rangeValue" :min="1" :max="100" label-always switch-label-side @change="onRangeSizeChange" />
        </div>

        <div v-if="type !== 'balloons'" class="p-float-label p-col-12 p-lg-3 p-fluid">
            <InputNumber v-model="(visualizationTypeConfiguration as IMapWidgetVisualizationTypeChoropleth).style.borderWidth" class="kn-material-input" />
            <label class="kn-material-input-label">{{ $t('common.width') }}</label>
        </div>

        <MapVisualizationRangesDialog v-if="rangesDialogVisible" :visible="rangesDialogVisible" :prop-ranges="visualizationTypeConfiguration.properties ? visualizationTypeConfiguration.properties.thresholds : []" @setRanges="onSetRanges" @close="rangesDialogVisible = false"></MapVisualizationRangesDialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetVisualizationTypeChoropleth, IMapWidgetVisualizationTypeBalloons } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../MapVisualizationTypeDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import MapVisualizationRangesDialog from './MapVisualizationRangesDialog.vue'
import deepcopy from 'deepcopy'
import * as mapWidgetDefaultValues from '../../../../helpers/mapWidget/MapWidgetDefaultValues'

export default defineComponent({
    name: 'map-visualization-type-choropleth',
    components: { Dropdown, InputNumber, WidgetEditorColorPicker, MapVisualizationRangesDialog },
    props: { propVisualizationTypeConfiguration: { type: Object as PropType<IMapWidgetVisualizationTypeBalloons | IMapWidgetVisualizationTypeChoropleth | null>, required: true }, type: { type: String, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            visualizationTypeConfiguration: null as IMapWidgetVisualizationTypeChoropleth | IMapWidgetVisualizationTypeBalloons | null,
            rangesDialogVisible: false,
            rangeValue: { min: 1, max: 100 } as { min: number; max: number },
            getTranslatedLabel
        }
    },
    computed: {
        classifyByRanges() {
            return this.visualizationTypeConfiguration && this.visualizationTypeConfiguration.method === 'CLASSIFY_BY_RANGES'
        }
    },
    watch: {
        propChoroplethConfiguration() {
            this.loadChoroplethConfiguration()
        }
    },
    created() {
        this.loadChoroplethConfiguration()
    },
    methods: {
        loadChoroplethConfiguration() {
            this.visualizationTypeConfiguration = this.propVisualizationTypeConfiguration
            if (this.visualizationTypeConfiguration && !this.visualizationTypeConfiguration.style) this.visualizationTypeConfiguration.style = { color: mapWidgetDefaultValues.getDefaultVisualizationBalloonsConfiguration().style.color }
            if (this.type === 'balloons') this.loadRangeValue()
        },
        loadRangeValue() {
            if (!this.visualizationTypeConfiguration) return
            const configuration = this.visualizationTypeConfiguration as IMapWidgetVisualizationTypeBalloons
            this.rangeValue = { min: configuration.minSize ?? 1, max: configuration.maxSize ?? 100 }
        },
        onSelectionColorChanged(event: string | null, property: 'color' | 'toColor') {
            if (this.visualizationTypeConfiguration && event) this.visualizationTypeConfiguration.style[property] = event
        },
        onRangeSizeChange(event: { min: number; max: number }) {
            if (!this.visualizationTypeConfiguration) return
            const configuration = this.visualizationTypeConfiguration as IMapWidgetVisualizationTypeBalloons
            configuration.minSize = event.min
            configuration.maxSize = event.max
        },
        onManageRangesClicked() {
            this.rangesDialogVisible = true
        },
        onSetRanges(ranges: { color: string; from: number; to: number }[]) {
            if (!this.visualizationTypeConfiguration || !this.visualizationTypeConfiguration.properties) return
            this.visualizationTypeConfiguration.properties.thresholds = deepcopy(ranges)
            this.rangesDialogVisible = false
        }
    }
})
</script>
