<template>
    <div class="slider-selector" :class="getPaddingClass()" :style="getSliderWrapperStyle()">
        <q-slider :model-value="sliderIndexValue" :min="0" :max="maxIndex" :step="1" :vertical="sliderStyle?.layout === 'vertical'" :dense="sliderStyle?.dense || false" :dark="sliderStyle?.darkMode || false" :color="getColorClass()" :thumb-color="getThumbColorClass()" :track-size="sliderStyle?.trackSize || '4px'" :switch-marker-labels-side="sliderStyle?.switchMarkerLabelsSide || false" marker-labels markers @change="onValueChanged">
            <template v-slot:marker-label-group="scope">
                <div v-for="marker in scope.markerList" :key="marker.index" :class="[marker.classes, { 'marker-disabled': isMarkerDisabled(marker.index) }]" :style="getMarkerStyle(marker)">
                    {{ options[marker.value]?.column_1 }}
                </div>
            </template>
        </q-slider>
    </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetSliderStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

export default defineComponent({
    name: 'slider-selector',
    props: {
        modelValue: { type: [Number, String, null], default: null },
        sliderStyle: { type: Object as PropType<ISelectorWidgetSliderStyle>, default: () => ({}) },
        options: { type: Array as PropType<any[]>, default: () => [] }
    },
    emits: ['update:modelValue'],
    computed: {
        sliderIndexValue(): number {
            if (this.options.length === 0) return 0
            const index = this.options.findIndex((opt: any) => String(opt.column_1) === String(this.modelValue))
            return index >= 0 ? index : 0
        },
        maxIndex(): number {
            return Math.max(0, this.options.length - 1)
        },
        disabledIndices(): Set<number> {
            const disabled = new Set<number>()
            this.options.forEach((opt: any, index: number) => {
                if (opt.disabled) disabled.add(index)
            })
            return disabled
        }
    },
    methods: {
        isHexColor(color: string | undefined): boolean {
            if (!color) return false
            return /^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(color)
        },
        getColorClass(): string {
            const color = this.sliderStyle?.color || 'primary'
            return this.isHexColor(color) ? 'primary' : color
        },
        getThumbColorClass(): string {
            const thumbColor = this.sliderStyle?.thumbColor || 'primary'
            return this.isHexColor(thumbColor) ? 'primary' : thumbColor
        },
        getSliderWrapperStyle(): any {
            const style: any = {}
            if (this.isHexColor(this.sliderStyle?.color)) {
                style['--slider-color'] = this.sliderStyle?.color
            }
            if (this.isHexColor(this.sliderStyle?.thumbColor)) {
                style['--slider-thumb-color'] = this.sliderStyle?.thumbColor
            }
            return style
        },
        getPaddingClass(): string {
            if (this.sliderStyle?.layout === 'vertical') {
                return 'slider-selector-vertical'
            }
            return 'slider-selector-horizontal'
        },
        getMarkerStyle(marker: any): any {
            const baseStyle = (marker.style as any) || {}
            if (this.sliderStyle?.labelColor || this.sliderStyle?.markerFontSize) {
                return {
                    ...baseStyle,
                    color: this.sliderStyle?.labelColor || undefined,
                    fontSize: this.sliderStyle?.markerFontSize || undefined
                }
            }
            return baseStyle
        },
        isMarkerDisabled(index: number): boolean {
            return this.disabledIndices.has(index)
        },
        onValueChanged(indexValue: number | null) {
            if (indexValue === undefined || indexValue === null || this.options.length === 0) return
            const selectedOption = this.options[indexValue]
            const actualValue = selectedOption?.column_1

            // Check if the selected value is disabled
            if (selectedOption?.disabled) {
                console.log('[SliderSelector] slider at index:', indexValue, '-> value unavailable, not emitting:', actualValue)
                return
            }

            console.log('[SliderSelector] slider released at index:', indexValue, '-> actual value:', actualValue)
            this.$emit('update:modelValue', actualValue)
        }
    }
})
</script>

<style lang="scss" scoped>
.slider-selector {
    &[style*='--slider-color'],
    &[style*='--slider-thumb-color'] {
        ::v-deep(.q-slider) {
            .q-slider__selection {
                background-color: var(--slider-color, inherit);
            }

            .q-slider__thumb {
                svg path {
                    stroke: var(--slider-thumb-color, inherit);
                    fill: var(--slider-thumb-color, inherit);
                }
            }
        }
    }
}

.slider-selector-horizontal {
    padding: 1.2rem;
}

.slider-selector-vertical {
    padding: 1.2rem 0;
}

.marker-disabled {
    opacity: 0.5;
}
</style>
