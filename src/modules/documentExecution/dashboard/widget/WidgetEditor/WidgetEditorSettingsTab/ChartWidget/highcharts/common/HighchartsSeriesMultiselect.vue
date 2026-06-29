<template>
    <q-select v-model="modelValue" :options="options" :label="$t('dashboard.widgetEditor.series.title')" multiple outlined dense :disable="disabled" @update:model-value="onUpdate">
        <template #no-option>
            <q-item>
                <q-item-section class="text-grey">{{ $t('common.info.noAvailableItems') }}</q-item-section>
            </q-item>
        </template>
    </q-select>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
    name: 'widget-editor-series-multiselect',
    components: {},
    props: {
        value: { type: Array },
        availableSeriesOptions: { type: Array as PropType<string[]>, required: true },
        disabled: { type: Boolean }
    },
    emits: ['change'],
    data() {
        return {
            modelValue: [] as string[]
        }
    },
    computed: {
        options(): string[] {
            const selected = this.modelValue as string[]
            const extra = (this.availableSeriesOptions as string[]).filter((s) => !selected.includes(s))
            return [...selected, ...extra]
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
            this.modelValue = (this.value as string[]) ?? []
        },
        onUpdate(newVal: string[]) {
            // Emit same shape as PrimeVue MultiSelect @change so all parents keep working
            this.$emit('change', { value: newVal })
        }
    }
})
</script>
