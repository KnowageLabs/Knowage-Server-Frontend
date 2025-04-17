<template>
    <div
        v-if="legend"
        :class="['map-legend', positionClass, 'q-pa-sm shadow-2 text-black rounded-borders']"
        :style="[
            {
                position: 'absolute',
                zIndex: 2147483647,
                background: 'white'
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

        <div class="p-formgrid p-grid">
            <MapLegendVisualization class="p-col-12" v-for="(legendVizualizationSettings, index) in legend.visualizationTypes" :key="index" :prop-map-widget-legend-visualization="legendVizualizationSettings" :legend-data="legendData" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetLegend } from '../../../interfaces/mapWidget/DashboardMapWidget'
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
            isDetached: false
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

                const legendWidth = 300
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
            this.positionX = event.clientX - this.offsetX
            this.positionY = event.clientY - this.offsetY
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
    width: 300px;
    z-index: 2147483647 !important;
    background: white;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    max-height: 100%;
}

.legend-vertical {
    max-height: 300px;
    width: 100%;
}

.legend-horizontal {
    height: 100%;
    max-width: 300px;
}

.legend-top {
    top: -300px;
}

.legend-bottom {
    bottom: -300px;
}

.legend-east {
    right: -300px;
}

.legend-west {
    left: -300px;
}
</style>
