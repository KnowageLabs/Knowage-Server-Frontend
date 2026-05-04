<template>
    <q-input v-model="color" :label="label ? $t(label) : undefined" :disable="disabled" dense outlined @update:model-value="onInputChange">
        <template #prepend>
            <div class="color-preview" :style="{ backgroundColor: color || 'transparent' }" />
        </template>
        <template #append>
            <q-icon name="colorize" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color v-model="color" format-model="hexa" :disable="disabled" @update:model-value="onColorChange" />
                </q-popup-proxy>
            </q-icon>
        </template>
    </q-input>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'widget-editor-color-picker',
    components: {},
    props: {
        initialValue: { type: String, default: '' },
        label: { type: String, default: '' },
        disabled: { type: Boolean, default: false }
    },
    emits: ['change'],
    data() {
        return {
            color: '' as string
        }
    },
    watch: {
        initialValue(val: string) {
            this.color = val ?? ''
        }
    },
    created() {
        this.color = this.initialValue ?? ''
    },
    methods: {
        onInputChange(val: string | number | null) {
            this.color = val != null ? String(val) : ''
            this.$emit('change', this.color)
        },
        onColorChange(val: string | null) {
            this.color = val ?? ''
            this.$emit('change', this.color)
        }
    }
})
</script>

<style lang="scss" scoped>
.color-preview {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.24);
}
</style>
