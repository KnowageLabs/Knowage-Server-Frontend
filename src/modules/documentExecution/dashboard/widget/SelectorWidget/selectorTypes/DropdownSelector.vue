<template>
    <div class="dropdown-selector" :class="{ 'has-custom-color': isCustomColor, 'has-custom-bg': isCustomBgColor }" :style="customStyles">
        <q-select
            v-model="internalValue"
            :options="optionsWithDisable"
            option-value="column_1"
            option-label="column_1"
            :disable="baseOptions.length === 0"
            :dense="dropdownStyle.dense"
            :options-dense="dropdownStyle.denseOptions"
            :filled="computedType === 'filled'"
            :outlined="computedType === 'outlined'"
            :borderless="computedType === 'borderless'"
            :rounded="isRoundedShape"
            :square="isSquareShape"
            :color="computedColor"
            :bg-color="computedBgColor"
            :dark="dropdownStyle.darkMode"
            emit-value
            map-options
            use-input
            @filter="onFilterOptions"
            @update:model-value="onSelectionChanged"
        >
            <template #prepend>
                <q-icon v-if="dropdownStyle.icon" :name="dropdownStyle.icon" />
            </template>
        </q-select>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetDropdownStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

interface DropdownOption {
    column_1: string
    disabled?: boolean
    disable?: boolean
}

export default defineComponent({
    name: 'dropdown-selector',
    props: {
        modelValue: { type: String, required: true },
        baseOptions: { type: Array as PropType<DropdownOption[]>, required: true },
        dropdownStyle: { type: Object as PropType<ISelectorWidgetDropdownStyle>, required: true },
        showMode: { type: String, default: 'showDisabled' }
    },
    emits: ['update:modelValue', 'filter'],
    data() {
        return {
            internalValue: this.modelValue,
            filteredOptions: [...this.baseOptions]
        }
    },
    computed: {
        computedType(): string {
            return this.dropdownStyle?.type || 'outlined'
        },
        isRoundedShape(): boolean {
            const shape = this.dropdownStyle?.shape || 'standard'
            return shape === 'rounded'
        },
        isSquareShape(): boolean {
            const shape = this.dropdownStyle?.shape || 'standard'
            return shape === 'squared'
        },
        isCustomColor(): boolean {
            const color = this.dropdownStyle?.color || ''
            return /^(#|rgb)/.test(color)
        },
        isCustomBgColor(): boolean {
            const color = this.dropdownStyle?.bgColor || ''
            return /^(#|rgb)/.test(color)
        },
        computedColor(): string | undefined {
            if (this.isCustomColor) return undefined
            return this.dropdownStyle?.color || 'primary'
        },
        computedBgColor(): string | undefined {
            if (this.isCustomBgColor) return undefined
            return this.dropdownStyle?.bgColor || undefined
        },
        customStyles(): Record<string, string> {
            const styles: Record<string, string> = {}
            if (this.isCustomColor) {
                styles.color = this.dropdownStyle.color!
            }
            if (this.isCustomBgColor) {
                styles['--custom-bg-color'] = this.dropdownStyle.bgColor!
            }
            return styles
        },
        optionsWithDisable(): DropdownOption[] {
            if (this.showMode === 'showDisabled') {
                return this.filteredOptions.map((opt: DropdownOption) => ({
                    ...opt,
                    disable: opt.disabled || false
                }))
            }
            return this.filteredOptions.map((opt: DropdownOption) => ({
                ...opt,
                disable: false
            }))
        }
    },
    watch: {
        modelValue(newVal) {
            this.internalValue = newVal
        },
        baseOptions(newVal) {
            const limited = newVal.slice(0, 500)
            if (this.internalValue && !limited.find((opt: DropdownOption) => opt.column_1 === this.internalValue)) {
                const selectedOpt = newVal.find((opt: DropdownOption) => opt.column_1 === this.internalValue)
                if (selectedOpt) {
                    this.filteredOptions = [selectedOpt, ...limited.slice(0, 499)]
                    return
                }
            }
            this.filteredOptions = limited
        }
    },
    methods: {
        onSelectionChanged() {
            this.$emit('update:modelValue', this.internalValue)
        },
        onFilterOptions(val: string, update: (callback: () => void) => void) {
            if (!val || val.length === 0) {
                update(() => {
                    const baseOpts = this.baseOptions
                    const limited = baseOpts.slice(0, 500)

                    if (this.internalValue && !limited.find((opt: DropdownOption) => opt.column_1 === this.internalValue)) {
                        const selectedOpt = baseOpts.find((opt: DropdownOption) => opt.column_1 === this.internalValue)
                        if (selectedOpt) {
                            this.filteredOptions = [selectedOpt, ...limited.slice(0, 499)]
                            return
                        }
                    }

                    this.filteredOptions = limited
                })
                return
            }

            update(() => {
                const input = val.toLowerCase()
                const filtered = this.baseOptions.filter((opt: DropdownOption) => String(opt.column_1).toLowerCase().includes(input))

                if (this.internalValue && !filtered.find((opt: DropdownOption) => String(opt.column_1) === this.internalValue)) {
                    const selectedOpt = this.baseOptions.find((opt: DropdownOption) => String(opt.column_1) === this.internalValue)
                    if (selectedOpt) {
                        filtered.unshift(selectedOpt)
                    }
                }

                this.filteredOptions = filtered.slice(0, 500)
            })
        }
    }
})
</script>

<style lang="scss" scoped>
.dropdown-selector {
    width: 100%;

    &.has-custom-color :deep(.q-field__control),
    &.has-custom-color :deep(.q-field__append),
    &.has-custom-color :deep(.q-field__prepend) {
        color: inherit !important;
    }

    &.has-custom-bg :deep(.q-field__control) {
        background-color: var(--custom-bg-color) !important;
    }
}
</style>
