<template>
    <div :class="getContainerClass()" :style="getContainerStyle()">
        <div v-for="(option, index) of options" :key="index" class="radio-option" :style="getOptionStyle()">
            <div class="radio-wrapper" :style="getRadioWrapperStyle()">
                <q-radio :model-value="modelValue" :val="option.value" :disable="option.disable" :size="radioSize" :color="computedRadioColor" :unchecked-icon="radioIcon" :checked-icon="checkedIcon" :keep-color="radioStyle.keepColor" dense @update:model-value="$emit('update:modelValue', $event)" />
            </div>
            <label class="radio-label" :style="getLabelStyle()">{{ option.label }}</label>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetRadioStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

interface RadioOption {
    label: string
    value: any
    disable: boolean
}

export default defineComponent({
    name: 'radio-selector',
    props: {
        modelValue: { type: [String, Number, Boolean], required: true },
        options: { type: Array as PropType<RadioOption[]>, required: true },
        radioStyle: { type: Object as PropType<ISelectorWidgetRadioStyle>, required: true }
    },
    emits: ['update:modelValue'],
    computed: {
        radioSize(): string {
            return this.radioStyle?.size || 'md'
        },
        radioColor(): string {
            return this.radioStyle?.color || 'primary'
        },
        isCustomColor(): boolean {
            const color = this.radioColor
            // Check if color is a hex or rgb/rgba value
            return /^(#|rgb)/.test(color)
        },
        computedRadioColor(): string {
            // Only pass color to q-radio if it's a named Quasar color
            return this.isCustomColor ? 'primary' : this.radioColor
        },
        radioIcon(): string | undefined {
            return this.radioStyle?.icon || undefined
        },
        checkedIcon(): string | undefined {
            return this.radioStyle?.checkedIcon || undefined
        }
    },
    methods: {
        getContainerClass(): string {
            const layout = this.radioStyle?.layout || 'column'
            const classMap = {
                column: 'radio-container-column',
                row: 'radio-container-row',
                grid: 'radio-container-grid'
            }
            return classMap[layout as keyof typeof classMap] || 'radio-container-column'
        },
        getContainerStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            const layout = this.radioStyle?.layout || 'column'

            if (layout === 'grid') {
                const columns = this.radioStyle?.gridColumns || '2'
                style.display = 'grid'
                style.gridTemplateColumns = `repeat(${columns}, 1fr)`
                style.gap = this.radioStyle?.margin || '0px'
            }

            return style
        },
        getOptionStyle(): Record<string, string> {
            const style: Record<string, string> = {}

            if (this.radioStyle?.padding) {
                style.padding = this.radioStyle.padding
            }

            if (this.radioStyle?.margin) {
                const layout = this.radioStyle?.layout || 'column'
                if (layout !== 'grid') {
                    style.margin = this.radioStyle.margin
                }
            }

            return style
        },
        getRadioWrapperStyle(): Record<string, string> {
            const style: Record<string, string> = {}

            // For custom colors, apply CSS variable to override radio color
            if (this.isCustomColor) {
                style['--q-primary'] = this.radioColor
            }

            return style
        },
        getLabelStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            const labelStyle = this.radioStyle?.label

            if (!labelStyle) return style

            if (labelStyle['font-weight']) style.fontWeight = labelStyle['font-weight']
            if (labelStyle['font-style']) style.fontStyle = labelStyle['font-style']
            if (labelStyle['font-size']) style.fontSize = labelStyle['font-size']
            if (labelStyle['font-family']) style.fontFamily = labelStyle['font-family']
            if (labelStyle.color) style.color = labelStyle.color
            if (labelStyle['background-color']) style.backgroundColor = labelStyle['background-color']

            return style
        }
    }
})
</script>

<style lang="scss" scoped>
.radio-container-column {
    display: flex;
    flex-direction: column;
}

.radio-container-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.radio-container-grid {
    display: grid;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .radio-wrapper {
        display: flex;
        align-items: center;
    }

    .radio-label {
        margin: 0;
        cursor: pointer;
        user-select: none;
    }
}
</style>
