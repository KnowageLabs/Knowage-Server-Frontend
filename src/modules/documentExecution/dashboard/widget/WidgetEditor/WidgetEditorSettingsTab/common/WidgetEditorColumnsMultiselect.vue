<template>
    <q-select v-model="modelValue" :options="options" :option-label="optionLabel" :option-value="optionsValue" :disable="disabled" emit-value map-options multiple outlined dense @update:model-value="(val) => $emit('change', { value: val })" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-multiselect',
    components: {},
    props: { value: { type: Array }, availableTargetOptions: { type: Array, required: true }, widgetColumnsAliasMap: { type: Object, required: true }, optionLabel: { type: String }, optionsValue: { type: String }, disabled: { type: Boolean } },
    emits: ['change'],
    data() {
        return {
            modelValue: [] as any[]
        }
    },
    computed: {
        options() {
            const targetOptions = [] as (IWidgetColumn | { id: string; alias: string })[]
            this.modelValue.forEach((target: string) => {
                const tempColumn = { id: target, alias: this.widgetColumnsAliasMap[target] }
                if (tempColumn) targetOptions.push(tempColumn)
            })
            const merged = this.mergeTargetOptionsWithAvailableTargetOptions(targetOptions)
            return Object.values(merged) ?? []
        }
    },
    watch: {
        value() {
            this.loadValue()
        }
    },
    created() {
        this.loadValue()
    },
    methods: {
        loadValue() {
            this.modelValue = this.value as any[]
        },
        mergeTargetOptionsWithAvailableTargetOptions(targetOptions: (IWidgetColumn | { id: string; alias: string })[]) {
            const merged = [...targetOptions, ...this.availableTargetOptions].reduce((acc: any, curr: any) => {
                if (!acc[curr.id]) {
                    acc[curr.id] = curr
                }
                return acc
            }, {}) as any
            return Object.values(merged)
        }
    }
})
</script>
