<template>
    <div class="button-toggle-selector" :style="wrapperStyle">
        <q-btn-toggle
            :model-value="modelValue"
            :options="buttonOptions"
            :spread="buttonToggleStyle?.spread || false"
            :outline="buttonToggleStyle?.type === 'outline'"
            :flat="buttonToggleStyle?.type === 'flat'"
            :unelevated="!buttonToggleStyle?.type || buttonToggleStyle?.type === 'unelevated'"
            :rounded="buttonToggleStyle?.rounded || false"
            :dense="buttonToggleStyle?.dense || false"
            :size="buttonToggleStyle?.size || undefined"
            :color="getColorClass(buttonToggleStyle?.color, 'secondary')"
            :text-color="getColorClass(buttonToggleStyle?.textColor, undefined)"
            :toggle-color="getColorClass(buttonToggleStyle?.toggleColor, 'primary')"
            :toggle-text-color="getColorClass(buttonToggleStyle?.toggleTextColor, undefined)"
            @update:model-value="onValueChanged"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetButtonToggleStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

export default defineComponent({
    name: 'button-toggle-selector',
    props: {
        modelValue: { type: [Number, String, null], default: null },
        buttonToggleStyle: { type: Object as PropType<ISelectorWidgetButtonToggleStyle>, default: () => ({}) },
        options: { type: Array as PropType<{ label: string; value: string; disable?: boolean }[]>, default: () => [] }
    },
    emits: ['update:modelValue'],
    computed: {
        buttonOptions(): { label: string; value: string; disable?: boolean }[] {
            return this.options
        },
        wrapperStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            if (this.isCustomColor(this.buttonToggleStyle?.color)) style['--btn-color'] = this.buttonToggleStyle!.color!
            if (this.isCustomColor(this.buttonToggleStyle?.textColor)) style['--btn-text-color'] = this.buttonToggleStyle!.textColor!
            if (this.isCustomColor(this.buttonToggleStyle?.toggleColor)) style['--btn-active-color'] = this.buttonToggleStyle!.toggleColor!
            if (this.isCustomColor(this.buttonToggleStyle?.toggleTextColor)) style['--btn-active-text-color'] = this.buttonToggleStyle!.toggleTextColor!
            return style
        }
    },
    methods: {
        isCustomColor(color: string | undefined): boolean {
            if (!color) return false
            return color.startsWith('#') || color.startsWith('rgb')
        },
        getColorClass(color: string | undefined, fallback: string | undefined): string | undefined {
            if (!color) return fallback
            return this.isCustomColor(color) ? fallback : color
        },
        onValueChanged(value: string | null) {
            this.$emit('update:modelValue', value)
        }
    }
})
</script>

<style lang="scss" scoped>
.button-toggle-selector {
    // Inactive color — background in solid/push modes, text in flat, text+border in outline
    &[style*='--btn-color'] {
        ::v-deep(.q-btn-toggle:not(.q-btn-group--flat):not(.q-btn-group--outline) .q-btn[aria-pressed='false']) {
            background: var(--btn-color) !important;
        }
        ::v-deep(.q-btn-toggle.q-btn-group--flat .q-btn[aria-pressed='false']) {
            color: var(--btn-color) !important;
        }
        ::v-deep(.q-btn-toggle.q-btn-group--outline .q-btn[aria-pressed='false']) {
            color: var(--btn-color) !important;
            border: var(--btn-color) !important;
        }
    }

    // Inactive explicit text color override (all modes)
    &[style*='--btn-text-color'] {
        ::v-deep(.q-btn-toggle .q-btn[aria-pressed='false'] .q-btn__content) {
            color: var(--btn-text-color) !important;
        }
        // In outline mode also sync border to the explicit text color
        ::v-deep(.q-btn-toggle.q-btn-group--outline .q-btn[aria-pressed='false']) {
            border: var(--btn-text-color) !important;
        }
    }

    // Active color — background in solid/push modes, text in flat, text+border in outline
    &[style*='--btn-active-color'] {
        ::v-deep(.q-btn-toggle:not(.q-btn-group--flat):not(.q-btn-group--outline) .q-btn[aria-pressed='true']) {
            background: var(--btn-active-color) !important;
        }
        ::v-deep(.q-btn-toggle.q-btn-group--flat .q-btn[aria-pressed='true']) {
            color: var(--btn-active-color) !important;
        }
        ::v-deep(.q-btn-toggle.q-btn-group--outline .q-btn[aria-pressed='true']) {
            color: var(--btn-active-color) !important;
            border: var(--btn-active-color) !important;
        }
    }

    // Active explicit text color override (all modes)
    &[style*='--btn-active-text-color'] {
        ::v-deep(.q-btn-toggle .q-btn[aria-pressed='true'] .q-btn__content) {
            color: var(--btn-active-text-color) !important;
        }
        // In outline mode also sync border to the explicit text color
        ::v-deep(.q-btn-toggle.q-btn-group--outline .q-btn[aria-pressed='true']) {
            border: var(--btn-active-text-color) !important;
        }
    }
}
</style>
