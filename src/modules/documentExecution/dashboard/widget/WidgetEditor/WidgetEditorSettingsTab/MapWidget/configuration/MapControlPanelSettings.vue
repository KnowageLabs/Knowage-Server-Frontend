<template>
    <div v-if="controlPanelSettings">
        <div class="p-formgrid p-grid p-p-3">
            <span class="p-field p-col-12 p-lg-3 p-jc-center p-mt-3 p-pl-3">
                <InputSwitch v-model="controlPanelSettings.alwaysShow" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.widgetEditor.map.controlPanel.alwaysShow') }} </label>
            </span>

            <div class="p-col-12 p-lg-9 p-d-flex p-flex-row p-ai-center">
                <div class="p-float-label kn-flex">
                    <InputText v-model="controlPanelSettings.dimension" class="kn-material-input kn-width-full" />
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.controlPanel.dimension') }}</label>
                </div>
                <i v-tooltip.top="$t('dashboard.widgetEditor.map.controlPanel.dimensionHint')" class="pi pi-question-circle kn-cursor-pointer p-mx-3"></i>
            </div>

            <div v-if="widgetModel?.settings?.visualizations?.length" class="p-col-12">
                <label class="kn-material-input-label">{{ $t('common.fields') }}</label>

                <div v-for="visualization in widgetModel.settings.visualizations" :key="visualization.id ?? visualization.label" class="p-grid p-ai-center p-col-12 p-px-0 p-mt-2 control-panel-visualization-row">
                    <div class="p-col-12 p-lg-3 control-panel-visualization-label">{{ visualization.label }}</div>
                    <div class="p-col-12 p-lg-9">
                        <MultiSelect
                            class="kn-width-full"
                            :model-value="getSelectedFilterColumnNames(visualization)"
                            :options="getAvailableFilterColumns(visualization)"
                            option-label="alias"
                            option-value="name"
                            display="chip"
                            :placeholder="$t('common.fields')"
                            @update:model-value="(value) => onFilterColumnsChanged(value, visualization)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapNormalisedInteractionColumn, IMapWidgetControlPanel, IMapWidgetLayer, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import MultiSelect from 'primevue/multiselect'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { ensureMapVisualizationFilter, getAvailableMapFilterColumns, getMapFilterColumnsFromProperties, getSelectedMapFilterColumnNames, MapFilterColumnsCache, updateMapFilterColumns } from '../../../../MapWidget/MapWidgetControlPanelHelper'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'

export default defineComponent({
    name: 'map-control-panel-settings',
    components: { InputSwitch, MultiSelect },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: [String, Number], required: true } },
    data() {
        return {
            controlPanelSettings: null as IMapWidgetControlPanel | null,
            propertiesCache: new Map<string, IMapNormalisedInteractionColumn[]>() as MapFilterColumnsCache
        }
    },
    watch: {
        async widgetModel() {
            this.loadControlPanelSettings()
            await this.loadPropertiesForVisualizations()
        }
    },
    async created() {
        this.loadControlPanelSettings()
        await this.loadPropertiesForVisualizations()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadControlPanelSettings() {
            if (this.widgetModel?.settings?.configuration?.controlPanel) this.controlPanelSettings = this.widgetModel.settings.configuration.controlPanel
            this.widgetModel?.settings?.visualizations?.forEach((visualization: IMapWidgetVisualizationType) => ensureMapVisualizationFilter(visualization))
        },
        async loadPropertiesForVisualizations() {
            if (!this.widgetModel?.settings?.visualizations) return
            await Promise.all(this.widgetModel.settings.visualizations.map((visualization: IMapWidgetVisualizationType) => this.loadAvailableProperties(visualization)))
        },
        async loadAvailableProperties(visualization: IMapWidgetVisualizationType | null) {
            if (!visualization) return
            const targets = [visualization.target, visualization.targetDataset].filter((target): target is string => !!target)
            await Promise.all(targets.map((target: string) => this.loadAvailablePropertiesForLayer(target)))
        },
        async loadAvailablePropertiesForLayer(target: string) {
            const targetLayer = resolveLayerByTarget(this.widgetModel, target) as IMapWidgetLayer | null
            if (!targetLayer || targetLayer.type !== 'layer' || this.propertiesCache.has(targetLayer.layerId)) return

            this.setLoading(true)
            const properties = await getPropertiesByLayerLabel(targetLayer.label, this.dashboardId)
            this.propertiesCache.set(targetLayer.layerId, getMapFilterColumnsFromProperties(properties))
            this.setLoading(false)
        },
        getAvailableFilterColumns(visualization: IMapWidgetVisualizationType) {
            return getAvailableMapFilterColumns(this.widgetModel, visualization, this.propertiesCache)
        },
        getSelectedFilterColumnNames(visualization: IMapWidgetVisualizationType) {
            return getSelectedMapFilterColumnNames(visualization)
        },
        onFilterColumnsChanged(selectedColumnNames: string[] | null, visualization: IMapWidgetVisualizationType) {
            updateMapFilterColumns(visualization, selectedColumnNames, this.getAvailableFilterColumns(visualization))
        }
    }
})
</script>

<style lang="scss" scoped>
.control-panel-visualization-row {
    border-top: 1px solid #e5e7eb;
}

.control-panel-visualization-label {
    font-weight: 600;
    overflow-wrap: anywhere;
}
</style>
