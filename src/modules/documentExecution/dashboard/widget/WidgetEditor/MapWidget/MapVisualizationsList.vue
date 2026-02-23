<template>
    <div class="visualizations-container">
        <!-- Header -->
        <div class="visualizations-header">
            <div class="header-content">
                <h3>{{ $t('dashboard.widgetEditor.visualizations') }}</h3>
                <p class="subtitle" v-if="selectedLayer">
                    {{ selectedLayer.name }} - {{ visualizations.length }} {{ $t('dashboard.widgetEditor.visualizations').toLowerCase() }}
                </p>
                <p class="subtitle" v-else>
                    {{ $t('dashboard.widgetEditor.map.selectLayerToManageVisualizations') }}
                </p>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="!selectedLayer" class="empty-state">
            <q-icon name="layers" size="4rem" color="grey-4" />
            <h4>{{ $t('dashboard.widgetEditor.map.noLayerSelected') }}</h4>
            <p>{{ $t('dashboard.widgetEditor.map.selectLayerFromLeftPanel') }}</p>
        </div>

        <!-- Visualizations Grid -->
        <div v-else class="visualizations-content">
            <!-- Add Visualization Button -->
            <div class="add-visualization-card" @click="openWizard()">
                <q-icon name="add_circle_outline" size="3rem" color="primary" />
                <div class="add-text">{{ $t('dashboard.widgetEditor.map.addVisualization') }}</div>
                <div class="add-hint">{{ $t('dashboard.widgetEditor.map.addVisualizationHint') }}</div>
            </div>

            <!-- Visualization Cards -->
            <div
                v-for="(viz, index) in visualizations"
                :key="viz.id"
                class="visualization-card"
                :class="{ 'inactive': !viz.visible }"
            >
                <div class="card-header">
                    <div class="viz-icon">
                        <q-icon :name="getVisualizationIcon(viz.type)" size="md" />
                    </div>
                    <div class="card-actions">
                        <q-btn
                            flat
                            dense
                            round
                            :icon="viz.visible ? 'visibility' : 'visibility_off'"
                            size="sm"
                            @click.stop="toggleVisibility(viz)"
                        >
                            <q-tooltip>{{ viz.visible ? $t('common.hide') : $t('common.show') }}</q-tooltip>
                        </q-btn>
                        <q-btn
                            flat
                            dense
                            round
                            icon="edit"
                            size="sm"
                            @click.stop="editVisualization(viz)"
                        >
                            <q-tooltip>{{ $t('common.edit') }}</q-tooltip>
                        </q-btn>
                        <q-btn
                            flat
                            dense
                            round
                            icon="delete"
                            size="sm"
                            @click.stop="confirmDelete(viz, index)"
                        >
                            <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                        </q-btn>
                    </div>
                </div>

                <div class="card-body">
                    <h4 class="viz-label">{{ viz.label }}</h4>
                    <div class="viz-type-badge">{{ getVisualizationTypeLabel(viz.type) }}</div>

                    <div class="viz-info">
                        <div class="info-item" v-if="viz.target">
                            <q-icon name="storage" size="xs" />
                            <span>{{ getTargetName(viz.target) }}</span>
                        </div>
                        <div class="info-item" v-if="viz.targetMeasure">
                            <q-icon name="functions" size="xs" />
                            <span>{{ viz.targetMeasure }}</span>
                        </div>
                        <div class="info-item" v-if="viz.targetType">
                            <q-icon name="link" size="xs" />
                            <span>{{ viz.targetType }}</span>
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="viz-preview">
                        <div class="preview-colors" v-if="viz.type === 'choropleth' || viz.type === 'markers'">
                            <div
                                v-for="(color, i) in getVisualizationColors(viz)"
                                :key="i"
                                class="color-swatch"
                                :style="{ background: color }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty Visualizations State -->
            <div v-if="visualizations.length === 0" class="no-visualizations">
                <q-icon name="auto_awesome" size="3rem" color="grey-4" />
                <h4>{{ $t('dashboard.widgetEditor.map.noVisualizations') }}</h4>
                <p>{{ $t('dashboard.widgetEditor.map.clickAddToCreateFirst') }}</p>
            </div>
        </div>

        <!-- Wizard -->
        <MapLayerConfigurationWizard
            :visible="wizardVisible"
            :layer="selectedLayer"
            :datasets="availableDatasets"
            :widget-model="widgetModel"
            :selected-visualization="selectedVisualization"
            @close="closeWizard"
            @save="saveVisualization"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useQuasar } from 'quasar'
import { IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import MapLayerConfigurationWizard from './MapLayerConfigurationWizard.vue'

export default defineComponent({
    name: 'map-visualizations-list',
    components: { MapLayerConfigurationWizard },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, default: null },
        dashboardId: { type: String, required: true }
    },
    setup() {
        const $q = useQuasar()
        return { $q }
    },
    data() {
        return {
            wizardVisible: false,
            selectedVisualization: null as IMapWidgetVisualizationType | null,
            visualizations: [] as IMapWidgetVisualizationType[]
        }
    },
    computed: {
        availableDatasets() {
            return this.widgetModel?.layers?.filter((layer: IMapWidgetLayer) => layer.type === 'dataset') || []
        }
    },
    watch: {
        selectedLayer: {
            handler() {
                this.loadVisualizations()
            },
            immediate: true
        },
        widgetModel: {
            handler() {
                this.loadVisualizations()
            },
            deep: true
        }
    },
    methods: {
        loadVisualizations() {
            if (!this.selectedLayer) {
                this.visualizations = []
                return
            }

            // Filter visualizations for the selected layer
            this.visualizations = this.widgetModel?.settings?.visualizations?.filter(
                (viz: IMapWidgetVisualizationType) => viz.target === this.selectedLayer?.layerId
            ) || []
        },
        openWizard(visualization: IMapWidgetVisualizationType | null = null) {
            this.selectedVisualization = visualization
            this.wizardVisible = true
        },
        closeWizard() {
            this.wizardVisible = false
            this.selectedVisualization = null
        },
        saveVisualization(config: any) {
            if (!this.widgetModel.settings.visualizations) {
                this.widgetModel.settings.visualizations = []
            }

            if (this.selectedVisualization) {
                // Edit existing
                const index = this.widgetModel.settings.visualizations.findIndex(
                    (v: IMapWidgetVisualizationType) => v.id === this.selectedVisualization!.id
                )
                if (index !== -1) {
                    this.widgetModel.settings.visualizations[index] = { ...this.selectedVisualization, ...config }
                }
            } else {
                // Add new
                const newVisualization = {
                    id: crypto.randomUUID(),
                    ...config,
                    target: this.selectedLayer?.layerId
                }
                this.widgetModel.settings.visualizations.push(newVisualization)
            }

            this.closeWizard()
            this.loadVisualizations()
        },
        editVisualization(viz: IMapWidgetVisualizationType) {
            this.openWizard(viz)
        },
        toggleVisibility(viz: IMapWidgetVisualizationType) {
            viz.visible = !viz.visible
        },
        confirmDelete(viz: IMapWidgetVisualizationType, index: number) {
            this.$q.dialog({
                title: this.$t('common.confirm'),
                message: this.$t('common.confirmDelete'),
                cancel: true,
                persistent: true
            }).onOk(() => {
                this.deleteVisualization(index)
            })
        },
        deleteVisualization(index: number) {
            // Get the visualization BEFORE removing it from the array
            const vizToDelete = this.visualizations[index]

            // Remove from local visualizations array
            this.visualizations.splice(index, 1)

            // Also remove from widget model
            if (vizToDelete && this.widgetModel.settings.visualizations) {
                const modelIndex = this.widgetModel.settings.visualizations.findIndex(
                    (v: IMapWidgetVisualizationType) => v.id === vizToDelete.id
                )
                if (modelIndex !== -1) {
                    this.widgetModel.settings.visualizations.splice(modelIndex, 1)
                }
            }
        },
        getVisualizationIcon(type: string): string {
            const icons: Record<string, string> = {
                markers: 'place',
                choropleth: 'map',
                heatmap: 'blur_on',
                clusters: 'group_work',
                pies: 'pie_chart',
                balloons: 'chat_bubble'
            }
            return icons[type] || 'layers'
        },
        getVisualizationTypeLabel(type: string): string {
            return this.$t(`dashboard.widgetEditor.map.visTypes.${type}`)
        },
        getTargetName(targetId: string): string {
            const target = this.widgetModel?.layers?.find((l: IMapWidgetLayer) => l.layerId === targetId)
            return target?.name || targetId
        },
        getVisualizationColors(viz: IMapWidgetVisualizationType): string[] {
            // Get colors from visualization configuration
            if (viz.type === 'choropleth' && viz.analysisConf?.style) {
                const colors: string[] = []
                const style = viz.analysisConf.style
                if (style.color) colors.push(style.color)
                if (style.toColor) colors.push(style.toColor)
                if (colors.length > 0) return colors
            }
            if (viz.type === 'markers' && viz.markerConf?.style?.color) {
                return [viz.markerConf.style.color]
            }
            if (viz.type === 'pies' && viz.pieConf?.colors) {
                return viz.pieConf.colors
            }
            // Default fallback colors using theme variable
            const fabColor = getComputedStyle(document.documentElement).getPropertyValue('--kn-color-fab').trim()
            return [fabColor || '#c41b87']
        }
    }
})
</script>

<style lang="scss" scoped>
.visualizations-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f8f9fa;
}

.visualizations-header {
    padding: 24px 32px;
    background: #ffffff;
    border-bottom: 1px solid #e9ecef;

    .header-content {
        h3 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #212529;
        }

        .subtitle {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
    }
}

.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    text-align: center;

    h4 {
        margin: 16px 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: #495057;
    }

    p {
        margin: 0;
        color: #6c757d;
        font-size: 14px;
    }
}

.visualizations-content {
    flex: 1;
    padding: 32px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    align-content: start;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        padding: 16px;
    }
}

.add-visualization-card {
    background: #ffffff;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    padding: 48px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 280px;

    &:hover {
        border-color: var(--kn-color-fab);
        background: color-mix(in srgb, var(--kn-color-fab), transparent 98%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--kn-color-fab), transparent 90%);
    }

    .add-text {
        margin-top: 16px;
        font-size: 16px;
        font-weight: 600;
        color: var(--kn-color-fab);
    }

    .add-hint {
        margin-top: 8px;
        font-size: 13px;
        color: #6c757d;
        text-align: center;
    }
}

.visualization-card {
    background: #ffffff;
    border: 2px solid #e9ecef;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    min-height: 280px;

    &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
    }

    &.inactive {
        opacity: 0.6;

        .card-header {
            background: #f1f3f5;
        }
    }

    .card-header {
        padding: 16px 20px;
        background: var(--kn-color-fab);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .viz-icon {
            color: #ffffff;

            .q-icon {
                color: #ffffff;
            }
        }

        .card-actions {
            display: flex;
            gap: 4px;

            :deep(.q-btn) {
                color: rgba(255, 255, 255, 0.9);

                &:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.2);
                }
            }
        }
    }

    .card-body {
        flex: 1;
        padding: 20px;

        .viz-label {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: #212529;
        }

        .viz-type-badge {
            display: inline-block;
            padding: 4px 12px;
            background: color-mix(in srgb, var(--kn-color-fab), transparent 85%);
            color: var(--kn-color-fab);
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 16px;
        }

        .viz-info {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #6c757d;
                font-size: 13px;

                .q-icon {
                    color: #adb5bd;
                }
            }
        }
    }

    .card-footer {
        padding: 16px 20px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;

        .viz-preview {
            .preview-colors {
                display: flex;
                height: 24px;
                border-radius: 4px;
                overflow: hidden;

                .color-swatch {
                    flex: 1;
                }
            }
        }
    }
}

.no-visualizations {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    text-align: center;

    h4 {
        margin: 16px 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: #495057;
    }

    p {
        margin: 0;
        color: #6c757d;
        font-size: 14px;
    }
}
</style>

