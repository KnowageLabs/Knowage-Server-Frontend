<template>
    <div :class="getContainerClass()" :style="getContainerStyle()">
        <div v-for="(option, index) of options" :key="index" class="checkbox-option" :style="getOptionStyle()">
            <div class="checkbox-wrapper" :style="getCheckboxWrapperStyle()">
                <q-checkbox :model-value="modelValue.includes(option.value)" :val="option.value" :disable="option.disable" :size="checkboxSize" :color="computedCheckboxColor" :unchecked-icon="checkboxIcon" :checked-icon="checkedCheckboxIcon" :keep-color="checkboxStyle.keepColor" dense @update:model-value="onCheckboxChange(option.value, $event)" />
            </div>
            <label class="checkbox-label" :style="getLabelStyle()">{{ option.label }}</label>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetCheckboxStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

interface CheckboxOption {
    label: string
    value: any
    disable: boolean
}

export default defineComponent({
    name: 'checkbox-selector',
    props: {
        modelValue: { type: Array as PropType<any[]>, required: true },
        options: { type: Array as PropType<CheckboxOption[]>, required: true },
        checkboxStyle: { type: Object as PropType<ISelectorWidgetCheckboxStyle>, required: true }
    },
    emits: ['update:modelValue'],
    computed: {
        checkboxSize(): string {
            return this.checkboxStyle?.size || 'md'
        },
        checkboxColor(): string {
            return this.checkboxStyle?.color || 'primary'
        },
        isCustomColor(): boolean {
            const color = this.checkboxColor
            return /^(#|rgb)/.test(color)
        },
        computedCheckboxColor(): string {
            return this.isCustomColor ? 'primary' : this.checkboxColor
        },
        checkboxIcon(): string | undefined {
            return this.checkboxStyle?.icon || undefined
        },
        checkedCheckboxIcon(): string | undefined {
            return this.checkboxStyle?.checkedIcon || undefined
        }
    },
    methods: {
        getContainerClass(): string {
            const layout = this.checkboxStyle?.layout || 'column'
            const classMap = {
                column: 'checkbox-container-column',
                row: 'checkbox-container-row',
                grid: 'checkbox-container-grid'
            }
            return classMap[layout as keyof typeof classMap] || 'checkbox-container-column'
        },
        getContainerStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            const layout = this.checkboxStyle?.layout || 'column'

            if (layout === 'grid') {
                const columns = this.checkboxStyle?.gridColumns || '2'
                style.display = 'grid'
                style.gridTemplateColumns = `repeat(${columns}, 1fr)`
                style.gap = this.checkboxStyle?.margin || '0px'
            }

            return style
        },
        getOptionStyle(): Record<string, string> {
            const style: Record<string, string> = {}

            if (this.checkboxStyle?.padding) {
                style.padding = this.checkboxStyle.padding
            }

            if (this.checkboxStyle?.margin) {
                const layout = this.checkboxStyle?.layout || 'column'
                if (layout !== 'grid') {
                    style.margin = this.checkboxStyle.margin
                }
            }

            return style
        },
        getCheckboxWrapperStyle(): Record<string, string> {
            const style: Record<string, string> = {}

            if (this.isCustomColor) {
                style['--q-primary'] = this.checkboxColor
            }

            return style
        },
        getLabelStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            const labelStyle = this.checkboxStyle?.label

            if (!labelStyle) return style

            if (labelStyle['font-weight']) style.fontWeight = labelStyle['font-weight']
            if (labelStyle['font-style']) style.fontStyle = labelStyle['font-style']
            if (labelStyle['font-size']) style.fontSize = labelStyle['font-size']
            if (labelStyle['font-family']) style.fontFamily = labelStyle['font-family']
            if (labelStyle.color) style.color = labelStyle.color
            if (labelStyle['background-color']) style.backgroundColor = labelStyle['background-color']

            return style
        },
        onCheckboxChange(value: any, isChecked: boolean) {
            let updatedValues: any[]
            if (isChecked) {
                updatedValues = [...this.modelValue, value]
            } else {
                updatedValues = this.modelValue.filter((v) => v !== value)
            }
            this.$emit('update:modelValue', updatedValues)
        }
    }
})
</script>

<style lang="scss" scoped>
.checkbox-container-column {
    display: flex;
    flex-direction: column;
}

.checkbox-container-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.checkbox-container-grid {
    display: grid;
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .checkbox-wrapper {
        display: flex;
        align-items: center;
    }

    .checkbox-label {
        margin: 0;
        cursor: pointer;
        user-select: none;
    }
}
</style>
