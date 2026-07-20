<template>
    <div
        v-if="legend"
        :class="['map-legend', positionClass, 'text-black']"
        :style="[
            {
                position: 'absolute',
                zIndex: 99,
                background: 'white',
                minWidth: '96px',
                maxWidth: legendWidth + 'px'
            },
            isDetached
                ? {
                      top: positionY + 'px',
                      left: positionX + 'px',
                      cursor: isDragging ? 'grabbing' : 'grab'
                  }
                : {}
        ]"
        @mousedown="isDetached && startDrag($event)"
        ref="legendRef"
    >
        <h2 v-if="legend.title">{{ legend.title }}</h2>
        <div :class="['map-legend-visualizations', { 'horizontal-layout': isHorizontalLayout }]">
            <div class="map-legend-section" :class="{ 'map-legend-section--full': !isHorizontalLayout }" v-for="(legendVizualizationSettings, index) in legend.visualizationTypes.filter((legendVisType: IMapWidgetVisualizationTypeLegendSettings) => legendVisType.visualizationType?.type !== 'geography')" :key="index">
                <div v-if="legendVizualizationSettings.visualizationType?.label" class="map-legend-section-title">{{ legendVizualizationSettings.visualizationType.label }}</div>
                <MapLegendVisualization :prop-map-widget-legend-visualization="legendVizualizationSettings" :legend-data="legendData" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetLegend, IMapWidgetVisualizationTypeLegendSettings } from '../../../interfaces/mapWidget/DashboardMapWidget'
import MapLegendVisualization from './MapLegendVisualization.vue'

export default defineComponent({
    name: 'map-legend',
    components: { MapLegendVisualization },
    props: {
        propMapWidgetLegend: {
            type: Object as PropType<IMapWidgetLegend>,
            required: true
        },
        legendData: {
            type: Object as PropType<Record<string, any> | null | undefined>,
            required: true
        }
    },
    data() {
        return {
            legend: null as IMapWidgetLegend | null,
            position: 'east',
            positionX: 0,
            positionY: 0,
            isDragging: false,
            offsetX: 0,
            offsetY: 0,
            isDetached: false,
            legendWidth: 200
        }
    },
    computed: {
        positionClass() {
            switch (this.position) {
                case 'north':
                    return 'legend-vertical legend-top'
                case 'south':
                    return 'legend-vertical legend-bottom'
                case 'west':
                    return 'legend-horizontal legend-west'
                case 'east':
                    return 'legend-horizontal legend-east'
                case 'center':
                    return 'legend-center'
                default:
                    return 'legend-east'
            }
        },
        isHorizontalLayout() {
            return this.position === 'north' || this.position === 'south'
        }
    },
    watch: {
        propMapWidgetLegend() {
            this.loadLegend()
        }
    },
    mounted() {
        this.loadLegend()
        window.addEventListener('mousemove', this.onDrag)
        window.addEventListener('mouseup', this.stopDrag)
    },
    beforeUnmount() {
        window.removeEventListener('mousemove', this.onDrag)
        window.removeEventListener('mouseup', this.stopDrag)
    },
    methods: {
        loadLegend() {
            this.legend = this.propMapWidgetLegend
            this.legendWidth = this.legend?.width ?? 200
            this.loadPosition()
        },

        loadPosition() {
            if (!this.legend) return

            this.position = this.legend.position
            this.isDetached = this.position === 'detached'

            this.$nextTick(() => {
                const parent = this.$el?.parentElement
                if (!parent) return

                const parentRect = parent.getBoundingClientRect()
                const width = parentRect.width
                const height = parentRect.height

                const legendWidth = this.legendWidth
                const legendHeight = 150

                if (!this.isDetached) {
                    switch (this.position) {
                        case 'north':
                            this.positionX = (width - legendWidth) / 2
                            this.positionY = 20
                            break
                        case 'south':
                            this.positionX = (width - legendWidth) / 2
                            this.positionY = height - legendHeight - 20
                            break
                        case 'west':
                            this.positionX = 20
                            this.positionY = (height - legendHeight) / 2
                            break
                        case 'east':
                            this.positionX = width - legendWidth - 20
                            this.positionY = (height - legendHeight) / 2
                            break
                        case 'center':
                            this.positionX = (width - legendWidth) / 2
                            this.positionY = (height - legendHeight) / 2
                            break
                        default:
                            this.positionX = width - legendWidth - 20
                            this.positionY = 100
                    }
                } else {
                    this.positionX = this.legend?.positionX ?? 0
                    this.positionY = this.legend?.positionY ?? 0
                }
            })
        },
        startDrag(event: MouseEvent) {
            this.isDragging = true
            this.offsetX = event.clientX - this.positionX
            this.offsetY = event.clientY - this.positionY
        },
        onDrag(event: MouseEvent) {
            if (!this.isDragging) return

            const parent = this.$el?.parentElement
            if (!parent) return

            const parentRect = parent.getBoundingClientRect()
            const legendRect = (this.$refs.legendRef as HTMLElement)?.getBoundingClientRect()

            if (!legendRect) return

            const parentWidth = parentRect.width
            const parentHeight = parentRect.height
            const legendWidth = legendRect.width
            const legendHeight = legendRect.height

            let newX = event.clientX - this.offsetX
            let newY = event.clientY - this.offsetY

            newX = Math.max(0, Math.min(newX, parentWidth - legendWidth))
            newY = Math.max(0, Math.min(newY, parentHeight - legendHeight))

            this.positionX = newX
            this.positionY = newY
            if (this.legend) {
                this.legend.positionX = this.positionX
                this.legend.positionY = this.positionY
            }
        },
        stopDrag() {
            this.isDragging = false
        }
    }
})
</script>

<style scoped>
.map-legend {
    position: absolute;
    z-index: 99 !important;
    background: white;
    padding: 10px 12px;
    border-radius: 0;
    box-shadow: none;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 100%;
    font-size: 0.875rem;
    line-height: 1.3;
}

.map-legend h2 {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    line-height: 1.2;
    font-weight: 600;
}

.map-legend-visualizations {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.map-legend-visualizations.horizontal-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.75rem;
    overflow-x: auto;
}

.legend-vertical {
    max-height: 300px;
}

.legend-horizontal {
    top: 0;
    bottom: 0;
}

.legend-top {
    top: 0;
}

.legend-bottom {
    bottom: 0;
}

.legend-east {
    right: 0;
}

.legend-west {
    left: 0;
}

.map-legend-section--full {
    width: 100%;
}

.map-legend-section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.map-legend-section-title {
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.2;
}
</style>
