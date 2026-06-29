<template>
    <div v-if="controlPanelSettings">
        <div class="q-px-md q-pb-sm">
            <div class="row q-col-gutter-sm q-mb-sm items-center">
                <div class="col-6">
                    <q-input v-model="controlPanelSettings.dimension" :label="$t('dashboard.widgetEditor.map.controlPanel.dimension')" outlined dense>
                        <template #append>
                            <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                <q-tooltip>{{ $t('dashboard.widgetEditor.map.controlPanel.dimensionHint') }}</q-tooltip>
                            </q-icon>
                        </template>
                    </q-input>
                </div>
                <div class="col-auto">
                    <q-toggle v-model="controlPanelSettings.alwaysShow" :label="$t('dashboard.widgetEditor.map.controlPanel.alwaysShow')" dense />
                </div>
            </div>
            <q-separator v-if="widgetModel?.settings?.visualizations?.length" class="q-mb-sm"></q-separator>
            <div v-if="widgetModel?.settings?.visualizations?.length">
                <div class="text-subtitle2 q-mb-sm">{{ $t('common.fields') }}</div>
                <div v-for="visualization in widgetModel.settings.visualizations" :key="visualization.id ?? visualization.label" class="control-panel-visualization-row row no-wrap q-mb-sm">
                    <div class="kn-action-handle kn-action-handle-disabled"></div>
                    <div class="col q-pa-sm">
                        <div class="text-subtitle2 text-weight-bold q-mb-xs">{{ visualization.label }}</div>
                        <q-select :model-value="getSelectedFilterColumnNames(visualization)" :options="getAvailableFilterColumns(visualization)" option-label="alias" option-value="name" emit-value map-options multiple use-chips :placeholder="$t('common.fields')" outlined dense @update:model-value="(value) => onFilterColumnsChanged(value, visualization)" />
                    </div>
                    <div class="kn-action-handle kn-action-handle-disabled"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapNormalisedInteractionColumn, IMapWidgetControlPanel, IMapWidgetLayer, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { ensureMapVisualizationFilter, getAvailableMapFilterColumns, getMapFilterColumnsFromProperties, getSelectedMapFilterColumnNames, MapFilterColumnsCache, updateMapFilterColumns } from '../../../../MapWidget/MapWidgetControlPanelHelper'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'

export default defineComponent({
    name: 'map-control-panel-settings',
    components: {},
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
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
