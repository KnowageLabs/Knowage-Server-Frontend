<template>
    <div class="visualizations-container">
        <!-- Visualizations Content -->
        <div class="visualizations-content">
            <!-- Add Visualization Button -->
            <div class="add-visualization-btn-container">
                <q-btn
                    unelevated
                    color="primary"
                    icon="add"
                    :label="$t('dashboard.widgetEditor.map.addVisualization')"
                    class="add-visualization-btn"
                    @click="openWizard()"
                />
            </div>

            <!-- Visualizations List -->
            <div class="visualizations-list">
                <div
                    v-for="(viz, index) in visualizations"
                    :key="viz.id"
                    class="viz-wrapper"
                >
                    <!-- Top Dropzone -->
                    <div
                        v-show="dropzoneTopVisible[index]"
                        class="dropzone-indicator"
                    ></div>
                    <div
                        class="dropzone-target"
                        :class="{ 'dropzone-active': dropzoneTopVisible[index] }"
                        @drop.stop="onDropComplete($event, 'before', index)"
                        @dragover.prevent
                        @dragenter.prevent="displayDropzone('top', index)"
                        @dragleave.prevent="hideDropzone('top', index)"
                    ></div>

                    <!-- Visualization Card -->
                    <div
                        class="visualization-item"
                        :class="{ 'inactive': !viz.visible }"
                        @click="editVisualization(viz)"
                    >
                        <div
                            class="viz-drag-handle"
                            draggable="true"
                            @dragstart="onDragStart($event, index)"
                            @click.stop
                        >
                            <q-icon name="drag_indicator" size="xs" />
                        </div>

                        <div class="viz-content">
                            <div class="viz-header">
                                <div class="viz-title-section">
                                    <q-icon
                                        :name="getVisualizationIcon(viz.type)"
                                        size="sm"
                                        class="viz-type-icon"
                                    />
                                    <div class="viz-info-main">
                                        <div class="viz-name">{{ viz.label }}</div>
                                        <div class="viz-details">
                                            <!-- Type -->
                                            <span class="viz-type-label">{{ getVisualizationTypeLabel(viz.type) }}</span>

                                            <!-- Layer/Dataset -->
                                            <template v-if="viz.target">
                                                <span class="detail-separator">•</span>
                                                <span class="detail-label">{{ getTargetType(viz.target) }}:</span>
                                                <span class="detail-value">{{ getTargetName(viz.target) }}</span>
                                            </template>

                                            <!-- Measure/Property (single mode) -->
                                            <template v-if="!viz.targetDataset">
                                                <template v-if="viz.targetMeasure">
                                                    <span class="detail-separator">•</span>
                                                    <span class="detail-label">{{ $t('common.measure') }}:</span>
                                                    <span class="detail-value">{{ viz.targetMeasure }}</span>
                                                </template>
                                                <template v-else-if="viz.targetProperty">
                                                    <span class="detail-separator">•</span>
                                                    <span class="detail-label">{{ $t('common.properties') }}:</span>
                                                    <span class="detail-value">{{ viz.targetProperty }}</span>
                                                </template>
                                            </template>

                                            <!-- Join mode -->
                                            <template v-if="viz.targetDataset">
                                                <span class="detail-separator">•</span>
                                                <span class="detail-label">{{ $t('common.dataset') }}:</span>
                                                <span class="detail-value">{{ getTargetName(viz.targetDataset) }}</span>

                                                <template v-if="viz.targetMeasure || viz.chartMeasures">
                                                    <span class="detail-separator">•</span>
                                                    <span class="detail-label">{{ $t('common.measure') }}:</span>
                                                    <span class="detail-value">{{ viz.chartMeasures ? viz.chartMeasures.join(', ') : viz.targetMeasure }}</span>
                                                </template>

                                                <template v-if="viz.targetDatasetForeignKeyColumn && viz.targetProperty">
                                                    <span class="detail-separator">•</span>
                                                    <span class="detail-label">JOIN:</span>
                                                    <span class="detail-value">{{ viz.targetProperty }} ↔ {{ viz.targetDatasetForeignKeyColumn }}</span>
                                                </template>
                                            </template>
                                        </div>
                                    </div>
                                </div>

                                <div class="viz-actions">
                                    <div class="viz-preview-colors" v-if="viz.type === 'choropleth' || viz.type === 'markers'">
                                        <div
                                            v-for="(color, i) in getVisualizationColors(viz)"
                                            :key="i"
                                            class="color-dot"
                                            :style="{ background: color }"
                                        ></div>
                                    </div>
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
                                    <q-btn flat dense round icon="edit" size="sm" @click.stop="editVisualization(viz)">
                                        <q-tooltip>{{ $t('common.edit') }}</q-tooltip>
                                    </q-btn>
                                    <q-btn flat dense round icon="delete" size="sm" @click.stop="confirmDelete(viz, index)">
                                        <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Dropzone -->
                    <div
                        class="dropzone-target"
                        :class="{ 'dropzone-active': dropzoneBottomVisible[index] }"
                        @drop.stop="onDropComplete($event, 'after', index)"
                        @dragover.prevent
                        @dragenter.prevent="displayDropzone('bottom', index)"
                        @dragleave.prevent="hideDropzone('bottom', index)"
                    ></div>
                    <div
                        v-show="dropzoneBottomVisible[index]"
                        class="dropzone-indicator"
                    ></div>
                </div>

                <!-- Empty State -->
                <div v-if="visualizations.length === 0" class="no-visualizations">
                    <q-icon name="auto_awesome" size="3rem" color="grey-4" />
                    <h4>{{ $t('dashboard.widgetEditor.map.noVisualizations') }}</h4>
                    <p>{{ $t('dashboard.widgetEditor.map.clickAddToCreateFirst') }}</p>
                </div>
            </div>
        </div>

        <!-- Wizard -->
        <MapLayerConfigurationWizard
            :visible="wizardVisible"
            :layer="getFirstLayer()"
            :datasets="availableDatasets"
            :widget-model="widgetModel"
            :selected-visualization="selectedVisualization"
            :dashboard-id="dashboardId"
            @close="closeWizard"
            @save="saveVisualization"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useQuasar } from 'quasar'
import { IWidget } from '../../../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../../../interfaces/mapWidget/DashboardMapWidget'
import MapLayerConfigurationWizard from '../../../MapWidget/MapLayerConfigurationWizard.vue'

export default defineComponent({
    name: 'map-visualization-type',
    components: { MapLayerConfigurationWizard },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: [String, Number] as PropType<string | number>, required: false }
    },
    setup() {
        const $q = useQuasar()
        return { $q }
    },
    data() {
        return {
            wizardVisible: false,
            selectedVisualization: null as IMapWidgetVisualizationType | null,
            visualizations: [] as IMapWidgetVisualizationType[],
            dropzoneTopVisible: {} as Record<number, boolean>,
            dropzoneBottomVisible: {} as Record<number, boolean>
        }
    },
    computed: {
        availableDatasets() {
            return this.widgetModel?.layers?.filter((layer: IMapWidgetLayer) => layer.type === 'dataset') || []
        }
    },
    watch: {
        widgetModel: {
            handler() {
                this.loadVisualizations()
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        loadVisualizations() {
            this.visualizations = this.widgetModel?.settings?.visualizations || []
        },
        getFirstLayer() {
            return this.widgetModel?.layers?.[0] || null
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
            // Validate config has required fields
            if (!config || !config.label || !config.type) {
                console.warn('Invalid visualization config:', config)
                this.closeWizard()
                return
            }

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
                    visible: true,
                    ...config
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
            if (this.widgetModel.settings.visualizations) {
                this.widgetModel.settings.visualizations.splice(index, 1)
            }
            this.loadVisualizations()
        },
        getVisualizationIcon(type: string): string {
            const icons: Record<string, string> = {
                markers: 'place',
                choropleth: 'map',
                heatmap: 'blur_on',
                clusters: 'group_work',
                charts: 'pie_chart',
                pies: 'pie_chart', // backward compatibility
                balloons: 'bubble_chart'
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
        getTargetType(targetId: string): string {
            const target = this.widgetModel?.layers?.find((l: IMapWidgetLayer) => l.layerId === targetId)
            return target?.type === 'layer' ? this.$t('common.layer') : this.$t('common.dataset')
        },
        getVisualizationColors(viz: IMapWidgetVisualizationType): string[] {
            // Get colors from style configuration
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

            // Default fallback colors
            return ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
        },
        onDragStart(event: DragEvent, index: number) {
            event.dataTransfer!.setData('text/plain', JSON.stringify(index))
            event.dataTransfer!.dropEffect = 'move'
            event.dataTransfer!.effectAllowed = 'move'
        },
        onDropComplete(event: DragEvent, position: 'before' | 'after', index: number) {
            this.hideDropzone('bottom', index)
            this.hideDropzone('top', index)
            const eventData = JSON.parse(event.dataTransfer!.getData('text/plain'))
            this.onRowsMove(eventData, index, position)
        },
        displayDropzone(position: 'top' | 'bottom', index: number) {
            if (position === 'top') {
                this.dropzoneTopVisible[index] = true
            } else {
                this.dropzoneBottomVisible[index] = true
            }
        },
        hideDropzone(position: 'top' | 'bottom', index: number) {
            if (position === 'top') {
                this.dropzoneTopVisible[index] = false
            } else {
                this.dropzoneBottomVisible[index] = false
            }
        },
        onRowsMove(sourceRowIndex: number, targetRowIndex: number, position: 'before' | 'after') {
            if (sourceRowIndex === targetRowIndex) return

            const newIndex = sourceRowIndex > targetRowIndex && position === 'after'
                ? targetRowIndex + 1
                : targetRowIndex

            // Move in widget model
            if (this.widgetModel.settings.visualizations) {
                this.widgetModel.settings.visualizations.splice(
                    newIndex,
                    0,
                    this.widgetModel.settings.visualizations.splice(sourceRowIndex, 1)[0]
                )
            }

            // Reload visualizations
            this.loadVisualizations()
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

.visualizations-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.add-visualization-btn-container {
    padding: 0 0 8px 0;

    .add-visualization-btn {
        width: 100%;
        text-transform: none;
        font-weight: 500;
        padding: 12px;
        border-radius: 8px;
    }
}

.visualizations-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.viz-wrapper {
    position: relative;
}

.dropzone-target {
    height: 20px;
    width: 100%;
    opacity: 0;
    visibility: visible;
    transition: opacity 0.2s, visibility 0.2s;

    &.dropzone-active {
        opacity: 1;
        visibility: visible;
        background-color: #aec1d3;
    }
}

.dropzone-indicator {
    height: 20px;
    width: 100%;
    background-color: #aec1d3;
}

.visualization-item {
    background: #ffffff;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    &:hover {
        border-color: rgba(59, 130, 246, 0.3);
        background: #f8f9fa;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    &.inactive {
        opacity: 0.6;
    }

    .viz-drag-handle {
        padding: 16px 8px 16px 12px;
        display: flex;
        align-items: flex-start;
        color: #adb5bd;
        cursor: grab;

        &:active {
            cursor: grabbing;
        }

        &:hover {
            color: #6c757d;
        }
    }


    .viz-content {
        flex: 1;
        padding: 16px 16px 16px 0;
    }

    .viz-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
    }

    .viz-title-section {
        display: flex;
        gap: 12px;
        flex: 1;
        min-width: 0;
    }

    .viz-type-icon {
        color: #3b82f6;
        margin-top: 2px;
    }

    .viz-info-main {
        flex: 1;
        min-width: 0;
    }

    .viz-name {
        font-size: 16px;
        font-weight: 500;
        color: #212529;
        margin-bottom: 6px;
    }

    .viz-details {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #6c757d;
        flex-wrap: wrap;

        .viz-type-label {
            color: #3b82f6;
            font-family: monospace;
            font-size: 12px;
            background: none;
            padding: 0;
            font-weight: 600;
        }

        .detail-separator {
            color: #adb5bd;
            font-weight: 300;
        }

        .detail-label {
            color: #6c757d;
            font-weight: 500;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .detail-value {
            color: #212529;
            font-weight: 500;
        }

        .viz-target,
        .viz-measure {
            display: flex;
            align-items: center;
            gap: 4px;

            .q-icon {
                font-size: 14px;
            }
        }
    }

    .viz-actions {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        flex-shrink: 0;
    }

    .viz-preview-colors {
        display: flex;
        gap: 4px;
        margin-right: 8px;
        align-items: center;

        .color-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 1px solid rgba(0, 0, 0, 0.1);
        }
    }
}

.no-visualizations {
    padding: 64px 24px;
    text-align: center;
    color: #adb5bd;

    h4 {
        margin: 16px 0 8px 0;
        color: #6c757d;
        font-weight: 500;
    }

    p {
        margin: 0;
        font-size: 14px;
    }
}
</style>

