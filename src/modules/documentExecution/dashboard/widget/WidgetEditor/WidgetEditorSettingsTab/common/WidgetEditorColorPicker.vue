<template>
    <div ref="knowageStyleIcon" class="color-picker-container" :style="disabled ? 'border-bottom: 1px solid #cccccc' : ''">
        <span class="p-float-label" style="text-align: center">
            <Button :disabled="disabled" class="click-outside color-picker-button" :style="`background-color:${color ? color : '#000000'}; padding: 0;`" @click="togglePicker"></Button>
            <label v-if="label" class="color-picker-label">{{ $t(label) }}</label>
        </span>
    </div>

    <!-- Teleport the picker to body and position it fixed so it cannot cause layout shifts -->
    <Teleport to="body">
        <div v-show="colorPickerVisible" ref="pickerEl" class="dashboard-color-picker click-outside" :style="pickerStyle">
            <ColorPicker theme="light" :color="color" :sucker-hide="true" @changeColor="changeColor" />
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch as vueWatch } from 'vue'
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
        const pickerEl = ref<HTMLElement | null>(null)
        const pickerStyle = ref<Record<string, string>>({ position: 'fixed', left: '0px', top: '0px', width: '220px', zIndex: '9999' })
        let prevBodyOverflow: string | null = null
        let prevBodyPaddingRight: string | null = null
        useClickOutside(knowageStyleIcon, () => {
            colorPickerVisible.value = false
            contextMenuVisible.value = false
        })

        function updatePickerPosition() {
            const el: any = knowageStyleIcon.value
            if (!el) return
            const rect = el.getBoundingClientRect()
            // Prefer positioning above the control. If not enough space above, fall back to below.
            const pickerWidth = 220
            const pickerHeight = 260 // fallback height for the color picker

            // calculate preferred top above
            let topPos = rect.top + window.scrollY - pickerHeight - 8

            // if not enough space above (picker would go off-screen), try to place below
            if (topPos < 8) {
                const spaceBelow = window.innerHeight - rect.bottom
                if (spaceBelow >= pickerHeight + 8) {
                    topPos = rect.bottom + window.scrollY + 8
                } else {
                    // neither space above nor below is enough; clamp to viewport and prefer above
                    topPos = Math.max(8, rect.top + window.scrollY - pickerHeight - 8)
                }
            }

            // ensure left doesn't go off-screen
            let leftPos = rect.left + window.scrollX
            if (leftPos + pickerWidth > window.innerWidth) {
                leftPos = Math.max(8, window.innerWidth - pickerWidth - 8)
            }

            pickerStyle.value = {
                position: 'fixed',
                left: `${leftPos}px`,
                top: `${topPos}px`,
                width: `${pickerWidth}px`,
                zIndex: '9999'
            }
        }

        function onDocDown(e: MouseEvent) {
            const k = knowageStyleIcon.value as HTMLElement | null
            const p = pickerEl.value as HTMLElement | null
            if (k && k.contains(e.target as Node)) return
            if (p && p.contains(e.target as Node)) return
            colorPickerVisible.value = false
            contextMenuVisible.value = false
        }

        function togglePicker() {
            colorPickerVisible.value = !colorPickerVisible.value
            if (colorPickerVisible.value) updatePickerPosition()
        }

        // prevent body scroll when picker is open to avoid layout shift (scrollbar appearing)
        vueWatch(colorPickerVisible, (v) => {
            if (v) {
                // store previous values
                prevBodyOverflow = document.body.style.overflow
                prevBodyPaddingRight = document.body.style.paddingRight

                // compute scrollbar width
                const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
                if (scrollbarWidth > 0) {
                    const existing = parseFloat(prevBodyPaddingRight || '0') || 0
                    document.body.style.paddingRight = `${existing + scrollbarWidth}px`
                }

                document.body.style.overflow = 'hidden'
            } else {
                // restore
                if (prevBodyOverflow !== null) document.body.style.overflow = prevBodyOverflow
                if (prevBodyPaddingRight !== null) document.body.style.paddingRight = prevBodyPaddingRight
                prevBodyOverflow = null
                prevBodyPaddingRight = null
            }
        })

        onMounted(() => {
            window.addEventListener('resize', updatePickerPosition)
            window.addEventListener('scroll', updatePickerPosition, true)
            document.addEventListener('mousedown', onDocDown)
        })

        onBeforeUnmount(() => {
            window.removeEventListener('resize', updatePickerPosition)
            window.removeEventListener('scroll', updatePickerPosition, true)
            document.removeEventListener('mousedown', onDocDown)
            // ensure we restore body overflow
            if (prevBodyOverflow !== null) document.body.style.overflow = prevBodyOverflow
            if (prevBodyPaddingRight !== null) document.body.style.paddingRight = prevBodyPaddingRight
        })

        return { colorPickerVisible, contextMenuVisible, knowageStyleIcon, pickerEl, pickerStyle, togglePicker }
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
    position: relative; /* make popup position relative to this container */
    display: flex;
    height: 37.75px;
    flex-direction: column;
    .color-picker-button {
        width: 92%;
        font-size: 0.875rem;
        padding: 0.65625rem 0.65625rem;
        background-color: rgb(212, 212, 212);
        margin-top: 12px;
        box-sizing: border-box;
        outline: none;
        border: none;
        &:focus { outline: none; box-shadow: none; }
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
    left: 0;
    top: calc(100% + 8px);
    width: 220px !important;
    z-index: 9999; /* ensure it's above the dialog */
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
</style>
