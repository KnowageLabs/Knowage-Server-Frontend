<template>
    <div ref="knowageStyleIcon" class="color-picker-container" :style="disabled ? 'border-bottom: 1px solid #cccccc' : ''">
        <span class="p-float-label" style="text-align: center">
            <Button :disabled="disabled" class="click-outside color-picker-button" :style="`background-color:${color ? color : '#000000'}; padding: 0;`" @click="colorPickerVisible = !colorPickerVisible"></Button>
            <label v-if="label" class="color-picker-label">{{ $t(label) }}</label>
        </span>
    </div>
    <ColorPicker v-if="colorPickerVisible" class="dashboard-color-picker click-outside" theme="light" :color="color" :sucker-hide="true" @changeColor="changeColor" />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import 'vue-color-kit/dist/vue-color-kit.css'
import { useClickOutside } from './styleToolbar/useClickOutside'
import { ColorPicker } from 'vue-color-kit'
import { getRGBColorFromString } from '../../helpers/WidgetEditorHelpers'

export default defineComponent({
    name: 'widget-editor-color-picker',
    components: { ColorPicker },
    props: {
        initialValue: { type: String },
        label: { type: String },
        disabled: { type: Boolean }
    },
    emits: ['change'],
    setup() {
        const knowageStyleIcon = ref(null)
        const colorPickerVisible = ref(false)
        const contextMenuVisible = ref(false)
        useClickOutside(knowageStyleIcon, () => {
            colorPickerVisible.value = false
            contextMenuVisible.value = false
        })
        return { colorPickerVisible, contextMenuVisible, knowageStyleIcon }
    },
    data() {
        return {
            modelValue: null as any,
            color: '',
            colorPickTimer: null as any,
            useClickOutside
        }
    },
    watch: {
        initialValue() {
            this.loadValue()
        }
    },
    created() {
        this.loadValue()
    },
    methods: {
        changeColor(color) {
            const { r, g, b, a } = color.rgba

            if (this.colorPickTimer) {
                clearTimeout(this.colorPickTimer)
                this.colorPickTimer = null
            }
            this.colorPickTimer = setTimeout(() => {
                if (!this.modelValue) return
                this.color = `rgba(${r}, ${g}, ${b}, ${a})`
                this.$emit('change', this.color)
            }, 200)
        },
        loadValue() {
            this.modelValue = this.initialValue ? getRGBColorFromString(this.initialValue) : {}
            this.color = this.initialValue ?? ''
        }
    }
})
</script>

<style lang="scss">
.color-picker-container {
    border-bottom: 1px solid rgba(0, 0, 0, 0.38);
    display: flex;
    height: 37.75px;
    flex-direction: column;
    .color-picker-button {
        width: 92%;
        font-size: 0.875rem;
        padding: 0.65625rem 0.65625rem;
        background-color: rgb(212, 212, 212);
        margin-top: 12px;
    }
    .color-picker-label {
        font-size: 12px;
        top: -0.5rem;
        background-color: #ffffff;
        padding: 2px 4px;
        margin-left: -4px;
        margin-top: 0;
        color: #43749e;
    }
}
.dashboard-color-picker {
    position: absolute;
    right: 45px;
    width: 220px !important;
}
</style>
