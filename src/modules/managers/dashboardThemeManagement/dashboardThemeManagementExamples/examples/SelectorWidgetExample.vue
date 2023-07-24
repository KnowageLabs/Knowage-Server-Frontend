<template>
    <div v-if="options" class="selector-widget dashboard-scrollbar">
        <div class="vertical-layout">
            <div v-for="(value, index) in options.rows" :key="index" class="multi-select p-p-1">
                <RadioButton v-model="selectedValue" :input-id="`radio-${index}`" class="p-mr-2" :name="value.column_1" :value="value.column_1" />
                <label :for="`radio-${index}`" class="multi-select-label">{{ value.column_1 }}</label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import RadioButton from 'primevue/radiobutton'

export default defineComponent({
    name: 'selector-widget-example',
    components: { RadioButton },
    emits: ['close'],
    data() {
        return {
            options: {
                rows: [
                    { id: 1, column_1: 'Q2', disabled: false },
                    { id: 2, column_1: 'Q3', disabled: false },
                    { id: 3, column_1: 'Q1', disabled: false },
                    { id: 4, column_1: 'Q4', disabled: false }
                ]
            } as any,
            selectedValue: null as any
        }
    },
    created() {},
    methods: {}
})
</script>
