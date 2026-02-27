<template>
    <div class="range-selector" :class="getRangeLayout()" :style="getRangeWrapperStyle()">
        <q-range :model-value="rangeModel" :min="0" :max="maxValue" :step="1" :label="false" :color="getRangeColorClass()" :track-size="rangeStyle?.trackSize || '4px'" :vertical="rangeStyle?.layout === 'vertical'" :dense="rangeStyle?.dense || false" :dark="rangeStyle?.darkMode || false" :switch-marker-labels-side="rangeStyle?.switchMarkerLabelsSide || false" markers marker-labels @change="updateRangeModel">
            <template v-slot:marker-label-group="scope">
                <div v-for="marker in scope.markerList" :key="marker.index" :class="[marker.classes, { 'marker-disabled': isMarkerDisabled(marker.index) }]" :style="getMarkerStyle(marker)">
                    {{ options[marker.value]?.column_1 }}
                </div>
            </template>
        </q-range>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetRangeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

export default defineComponent({
    name: 'range-selector',
    props: {
        modelValue: { type: Array as PropType<number[]>, default: () => [] },
        rangeStyle: { type: Object as PropType<ISelectorWidgetRangeStyle>, default: () => ({}) },
        options: { type: Array as PropType<any[]>, default: () => [] }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            rangeModel: {
                min: 0,
                max: 0
            }
        }
    },
    computed: {
        maxValue(): number {
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
    watch: {
        options(newOptions, oldOptions) {
            const newLength = newOptions ? newOptions.length : 0
            const oldLength = oldOptions ? oldOptions.length : 0

            // Only reinitialize if the length actually changed (new data set), not just if reference changed
            if (newLength !== oldLength) {
                this.initializeRange()
            }
        },
        modelValue() {
            this.loadModelValue()
        }
    },
    created() {
        this.initializeRange()
        this.loadModelValue()
    },
    methods: {
        isHexColor(color: string | undefined): boolean {
            if (!color) return false
            return /^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(color)
        },
        getRangeColorClass(): string {
            const color = this.rangeStyle?.color || 'primary'
            return this.isHexColor(color) ? 'primary' : color
        },
        getRangeWrapperStyle(): any {
            const style: any = {}
            if (this.isHexColor(this.rangeStyle?.color)) {
                style['--range-color'] = this.rangeStyle?.color
            }
            if (this.isHexColor(this.rangeStyle?.thumbColor)) {
                style['--range-thumb-color'] = this.rangeStyle?.thumbColor
            }
            return style
        },
        getRangeLayout(): string {
            return this.rangeStyle?.layout === 'vertical' ? 'range-selector-vertical' : 'range-selector-horizontal'
        },
        getMarkerStyle(marker: any): any {
            const baseStyle = (marker.style as any) || {}
            if (this.rangeStyle?.labelColor || this.rangeStyle?.markerFontSize) {
                return {
                    ...baseStyle,
                    color: this.rangeStyle?.labelColor || undefined,
                    fontSize: this.rangeStyle?.markerFontSize || undefined
                }
            }
            return baseStyle
        },
        isMarkerDisabled(index: number): boolean {
            return this.disabledIndices.has(index)
        },
        initializeRange() {
            if (this.options.length === 0) {
                this.rangeModel = { min: 0, max: 0 }
            } else {
                this.rangeModel = { min: 0, max: this.maxValue }
            }
        },
        loadModelValue() {
            if (!this.modelValue || this.modelValue.length < 2) {
                return
            }
            const minIdx = this.modelValue[0]
            const maxIdx = this.modelValue[1]

            // Only load if it's a real saved state (not the default [0, 0])
            if (minIdx >= 0 && maxIdx >= 0 && (minIdx !== 0 || maxIdx !== 0)) {
                this.rangeModel = { min: minIdx, max: maxIdx }
            }
        },
        updateRangeModel(newRange: any) {
            this.rangeModel = newRange
            this.emitRangeValues()
        },
        emitRangeValues() {
            const minIdx = Math.max(0, Math.floor(this.rangeModel.min))
            const maxIdx = Math.min(this.maxValue, Math.ceil(this.rangeModel.max))

            const rangeValues: string[] = []
            for (let i = minIdx; i <= maxIdx; i++) {
                if (this.options[i] && !this.isMarkerDisabled(i)) {
                    rangeValues.push(String(this.options[i].column_1))
                }
            }

            this.$emit('update:modelValue', { ranges: [this.rangeModel.min, this.rangeModel.max], filteredValues: rangeValues })
        }
    }
})
</script>

<style lang="scss" scoped>
.range-selector {
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &[style*='--range-color'],
    &[style*='--range-thumb-color'] {
        ::v-deep(.q-range) {
            .q-slider__selection {
                background-color: var(--range-color, inherit);
            }

            .q-slider__thumb {
                svg path {
                    stroke: var(--range-thumb-color, inherit);
                    fill: var(--range-thumb-color, inherit);
                }
            }
        }
    }
}

.range-selector-horizontal {
    .q-range {
        width: 100%;
    }
}

.range-selector-vertical {
    .q-range {
        height: 300px;
    }
}

.marker-disabled {
    opacity: 0.5;
}
</style>
