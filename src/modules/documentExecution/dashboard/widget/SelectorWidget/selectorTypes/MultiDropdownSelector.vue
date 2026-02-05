<template>
    <div class="multi-dropdown-selector" :class="{ 'has-custom-color': isCustomColor, 'has-custom-bg': isCustomBgColor }" :style="customStyles">
        <q-select
            v-model="internalValues"
            :options="optionsWithDisable"
            option-value="column_1"
            option-label="column_1"
            :disable="baseOptions.length === 0"
            :dense="multiDropdownStyle.dense"
            :options-dense="multiDropdownStyle.denseOptions"
            :filled="computedType === 'filled'"
            :outlined="computedType === 'outlined'"
            :borderless="computedType === 'borderless'"
            :rounded="isRoundedShape"
            :square="isSquareShape"
            :color="computedColor"
            :bg-color="computedBgColor"
            :dark="multiDropdownStyle.darkMode"
            :max-values="multiDropdownStyle.maxValues || undefined"
            :counter="multiDropdownStyle.counter"
            :hint="multiDropdownStyle.hint"
            :use-chips="multiDropdownStyle.chips"
            multiple
            emit-value
            map-options
            use-input
            @filter="onFilterOptions"
            @update:model-value="onSelectionChanged"
        >
            <template #prepend>
                <q-icon v-if="multiDropdownStyle.icon" :name="multiDropdownStyle.icon" />
            </template>
        </q-select>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetMultiDropdownStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

interface MultiDropdownOption {
    column_1: string
    disabled?: boolean
    disable?: boolean
}

export default defineComponent({
    name: 'multi-dropdown-selector',
    props: {
        modelValue: { type: Array as PropType<string[]>, required: true },
        baseOptions: { type: Array as PropType<MultiDropdownOption[]>, required: true },
        multiDropdownStyle: { type: Object as PropType<ISelectorWidgetMultiDropdownStyle>, required: true },
        showMode: { type: String, default: 'showDisabled' }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            internalValues: [...this.modelValue],
            filteredOptions: [...this.baseOptions]
        }
    },
    computed: {
        computedType(): string {
            return this.multiDropdownStyle?.type || 'outlined'
        },
        isRoundedShape(): boolean {
            const shape = this.multiDropdownStyle?.shape || 'standard'
            return shape === 'rounded'
        },
        isSquareShape(): boolean {
            const shape = this.multiDropdownStyle?.shape || 'standard'
            return shape === 'squared'
        },
        isCustomColor(): boolean {
            const color = this.multiDropdownStyle?.color || ''
            return /^(#|rgb)/.test(color)
        },
        isCustomBgColor(): boolean {
            const color = this.multiDropdownStyle?.bgColor || ''
            return /^(#|rgb)/.test(color)
        },
        computedColor(): string | undefined {
            if (this.isCustomColor) return undefined
            return this.multiDropdownStyle?.color || 'primary'
        },
        computedBgColor(): string | undefined {
            if (this.isCustomBgColor) return undefined
            return this.multiDropdownStyle?.bgColor || undefined
        },
        customStyles(): Record<string, string> {
            const styles: Record<string, string> = {}
            if (this.isCustomColor) {
                styles.color = this.multiDropdownStyle.color!
            }
            if (this.isCustomBgColor) {
                styles['--custom-bg-color'] = this.multiDropdownStyle.bgColor!
            }
            return styles
        },
        optionsWithDisable(): MultiDropdownOption[] {
            if (this.showMode === 'showDisabled') {
                return this.filteredOptions.map((opt: MultiDropdownOption) => ({
                    ...opt,
                    disable: opt.disabled || false
                }))
            }
            return this.filteredOptions.map((opt: MultiDropdownOption) => ({
                ...opt,
                disable: false
            }))
        }
    },
    watch: {
        modelValue(newVal) {
            this.internalValues = [...newVal]
        },
        baseOptions(newVal) {
            const limited = newVal.slice(0, 500)
            const selectedOptions: MultiDropdownOption[] = []

            if (this.internalValues && this.internalValues.length > 0) {
                this.internalValues.forEach((val: string) => {
                    if (!limited.find((opt: MultiDropdownOption) => opt.column_1 === val)) {
                        const selectedOption = newVal.find((opt: MultiDropdownOption) => opt.column_1 === val)
                        if (selectedOption) {
                            selectedOptions.push(selectedOption)
                        }
                    }
                })
            }

            if (selectedOptions.length > 0) {
                this.filteredOptions = [...selectedOptions, ...limited.slice(0, 500 - selectedOptions.length)]
            } else {
                this.filteredOptions = limited
            }
        }
    },
    methods: {
        onSelectionChanged() {
            this.$emit('update:modelValue', this.internalValues)
        },
        onFilterOptions(val: string, update: (callback: () => void) => void) {
            if (!val || val.length === 0) {
                update(() => {
                    const baseOpts = this.baseOptions
                    const limited = baseOpts.slice(0, 500)
                    const selectedOptions: MultiDropdownOption[] = []

                    if (this.internalValues && this.internalValues.length > 0) {
                        this.internalValues.forEach((val: string) => {
                            if (!limited.find((opt: MultiDropdownOption) => opt.column_1 === val)) {
                                const selectedOpt = baseOpts.find((opt: MultiDropdownOption) => opt.column_1 === val)
                                if (selectedOpt) {
                                    selectedOptions.push(selectedOpt)
                                }
                            }
                        })
                    }

                    if (selectedOptions.length > 0) {
                        this.filteredOptions = [...selectedOptions, ...limited.slice(0, 500 - selectedOptions.length)]
                    } else {
                        this.filteredOptions = limited
                    }
                })
                return
            }

            update(() => {
                const input = val.toLowerCase()
                const filtered = this.baseOptions.filter((opt: MultiDropdownOption) => String(opt.column_1).toLowerCase().includes(input))

                const selectedOptions: MultiDropdownOption[] = []
                if (this.internalValues && this.internalValues.length > 0) {
                    this.internalValues.forEach((val: string) => {
                        if (!filtered.find((opt: MultiDropdownOption) => String(opt.column_1) === val)) {
                            const selectedOpt = this.baseOptions.find((opt: MultiDropdownOption) => String(opt.column_1) === val)
                            if (selectedOpt) {
                                selectedOptions.push(selectedOpt)
                            }
                        }
                    })
                }

                if (selectedOptions.length > 0) {
                    this.filteredOptions = [...selectedOptions, ...filtered.slice(0, 500 - selectedOptions.length)]
                } else {
                    this.filteredOptions = filtered.slice(0, 500)
                }
            })
        }
    }
})
</script>

<style lang="scss" scoped>
.multi-dropdown-selector {
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
