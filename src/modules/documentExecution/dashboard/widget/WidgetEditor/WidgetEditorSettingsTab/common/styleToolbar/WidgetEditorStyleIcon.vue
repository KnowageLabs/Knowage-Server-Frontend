<template>
    <div v-show="model" class="widget-editor-style-icon row items-center no-wrap">
        <!-- 1. Plain toggle: font-weight, font-style -->
        <q-btn
            v-if="isToggleType"
            flat
            dense
            round
            size="md"
            :icon="getIconClass()"
            :disable="disabled"
            :color="active ? 'primary' : undefined"
            :class="{ 'style-icon-active': active }"
            :aria-label="tooltipLabel"
            @click="onToggleClicked"
        >
            <q-tooltip anchor="bottom middle" self="top middle" :delay="400">{{ tooltipLabel }}</q-tooltip>
        </q-btn>

        <!-- 2. Icon picker: icon -->
        <q-btn
            v-else-if="option.type === 'icon'"
            flat
            dense
            round
            size="md"
            :icon="getIconClass()"
            :disable="disabled"
            :color="iconActive ? 'primary' : undefined"
            :class="{ 'style-icon-active': iconActive }"
            :aria-label="tooltipLabel"
            @click="onIconPickerClicked"
        >
            <q-tooltip anchor="bottom middle" self="top middle" :delay="400">{{ tooltipLabel }}</q-tooltip>
        </q-btn>

        <!-- 3. Color: border-color, color, background-color -->
        <q-btn v-else-if="isColorType" flat dense round size="md" :icon="getIconClass()" :disable="disabled" :aria-label="tooltipLabel" class="style-icon-with-swatch">
            <span v-if="newColor" class="style-icon-swatch" :style="{ backgroundColor: newColor }" />
            <q-tooltip anchor="bottom middle" self="top middle" :delay="400">{{ tooltipLabel }}</q-tooltip>
            <q-popup-proxy v-if="!disabled" cover transition-show="scale" transition-hide="scale">
                <q-color :model-value="newColor || null" format-model="rgba" @update:model-value="changeColor" />
            </q-popup-proxy>
        </q-btn>

        <!-- 4. Menu: font-size, justify-content, text-align, vertical-align, font-family -->
        <q-btn v-else-if="isMenuType" flat dense round size="md" :icon="getIconClass()" :disable="disabled" :aria-label="tooltipLabel" class="style-icon-with-arrow">
            <q-icon name="fas fa-arrow-down" class="style-icon-arrow" />
            <span v-if="option.type === 'font-size' && displayValue" class="style-icon-value">{{ displayValue }}</span>
            <q-tooltip anchor="bottom middle" self="top middle" :delay="400">{{ tooltipLabel }}</q-tooltip>
            <q-menu v-if="!disabled" anchor="bottom start" self="top start" :offset="[0, 4]" max-height="320px">
                <WidgetEditorToolbarContextMenu :option="option" :initial-value="contextMenuInitialValue" @selected="onContextItemSelected" @inputChanged="onContextInputChanged" />
            </q-menu>
        </q-btn>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import WidgetEditorToolbarContextMenu from './WidgetEditorToolbarContextMenu.vue'
import descriptor from './WidgetEditorStyleToolbarDescriptor.json'

const TOGGLE_TYPES = ['font-weight', 'font-style']
const COLOR_TYPES = ['border-color', 'color', 'background-color']
const MENU_TYPES = ['font-size', 'justify-content', 'text-align', 'vertical-align', 'font-family']

// Alignment icons that reflect the currently selected value on the button itself.
const ALIGN_TYPES = ['text-align', 'justify-content', 'vertical-align']
const ALIGN_ICONS: Record<string, Record<string, string>> = {
    'text-align': {
        left: 'fas fa-align-left',
        center: 'fas fa-align-center',
        right: 'fas fa-align-right',
        justify: 'fas fa-align-justify'
    },
    'justify-content': {
        'flex-start': 'fas fa-align-left',
        center: 'fas fa-align-center',
        'flex-end': 'fas fa-align-right'
    },
    'vertical-align': {
        top: 'fas fa-arrow-up',
        middle: 'fas fa-arrows-alt-v',
        bottom: 'fas fa-arrow-down'
    }
}

export default defineComponent({
    name: 'widget-editor-style-icon',
    components: { WidgetEditorToolbarContextMenu },
    props: {
        option: { type: Object as PropType<any>, required: true },
        propModel: { type: Object as PropType<IWidgetStyleToolbarModel | null>, required: true },
        disabled: { type: Boolean }
    },
    emits: ['change', 'openIconPicker'],
    data() {
        return {
            descriptor,
            model: null as IWidgetStyleToolbarModel | null,
            active: false,
            displayValue: '',
            contextMenuInitialValue: '',
            newColor: '',
            colorPickTimer: null as any
        }
    },
    computed: {
        isToggleType(): boolean {
            return TOGGLE_TYPES.includes(this.option.type)
        },
        isColorType(): boolean {
            return COLOR_TYPES.includes(this.option.type)
        },
        isMenuType(): boolean {
            return MENU_TYPES.includes(this.option.type)
        },
        iconActive(): boolean {
            return this.option.type === 'icon' && !!this.model?.icon
        },
        tooltipLabel(): string {
            return this.option.tooltip ? this.$t(this.option.tooltip) : this.getDefaultTooltip()
        }
    },
    watch: {
        propModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
    },
    unmounted() {
        if (this.colorPickTimer) clearTimeout(this.colorPickTimer)
    },
    methods: {
        loadModel() {
            this.model = this.propModel
            if (!this.model) return
            switch (this.option.type) {
                case 'font-weight':
                    this.active = this.model['font-weight'] === 'bold'
                    break
                case 'font-style':
                    this.active = this.model['font-style'] === 'italic'
                    break
                case 'font-size':
                    this.displayValue = this.model['font-size'] ?? ''
                    this.contextMenuInitialValue = this.displayValue
                    break
                case 'justify-content':
                case 'text-align':
                case 'vertical-align':
                case 'font-family':
                    this.contextMenuInitialValue = this.model[this.option.type] ?? ''
                    break
                case 'border-color':
                case 'color':
                case 'background-color':
                    this.newColor = this.model[this.option.type] ?? ''
                    break
            }
        },
        getIconClass(): string {
            if (this.option.type === 'icon' && this.model?.icon) return this.model.icon
            if (ALIGN_TYPES.includes(this.option.type)) {
                const value = this.model?.[this.option.type] ?? ''
                const dynamic = ALIGN_ICONS[this.option.type]?.[value]
                if (dynamic) return dynamic
            }
            return this.descriptor.icons[this.option.type]
        },
        getDefaultTooltip(): string {
            const key = this.descriptor.tooltips[this.option.type]
            return key ? this.$t(key) : ''
        },
        onToggleClicked() {
            if (!this.model || this.disabled) return
            this.active = !this.active
            if (this.option.type === 'font-weight') this.model['font-weight'] = this.active ? 'bold' : 'normal'
            else if (this.option.type === 'font-style') this.model['font-style'] = this.active ? 'italic' : ''
            this.$emit('change')
        },
        onIconPickerClicked() {
            if (!this.model || this.disabled) return
            this.$emit('openIconPicker')
        },
        normalizeRgba(value: string | null): string {
            if (!value) return ''
            const parts = value
                .replace(/^rgba?\(/, '')
                .replace(/\)$/, '')
                .split(',')
                .map((part: string) => part.trim())
            if (parts.length < 3) return value
            const alpha = parts.length > 3 ? parts[3] : '1'
            return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
        },
        changeColor(value: string | null) {
            if (!this.model || this.disabled) return
            if (this.colorPickTimer) clearTimeout(this.colorPickTimer)
            this.colorPickTimer = setTimeout(() => {
                this.newColor = this.normalizeRgba(value)
                if (this.model) this.model[this.option.type] = this.newColor
                this.$emit('change')
            }, 200)
        },
        onContextItemSelected(item: string) {
            if (!this.model || this.disabled) return
            this.model[this.option.type] = item
            if (this.option.type === 'font-size') this.displayValue = item
            this.contextMenuInitialValue = item
            // Defer the change emit so the teleported QMenu finishes unmounting (v-close-popup)
            // before the parent rebuilds propModel and re-renders this subtree. Emitting synchronously
            // patches a half-unmounted teleport and crashes inside QExpansionItem/QSlideTransition panels.
            this.$nextTick(() => this.$emit('change'))
        },
        onContextInputChanged(item: string) {
            if (!this.model || this.disabled) return
            this.model['font-size'] = item
            this.displayValue = item
            this.$emit('change')
        }
    }
})
</script>

<style lang="scss" scoped>
// Active state for the Bold / Italic toggles and the icon picker: tinted round background + primary glyph.
.style-icon-active {
    background: rgba(25, 118, 210, 0.14);
}

.style-icon-swatch {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.35);
    box-shadow: 0 0 0 1px #fff;
    pointer-events: none;
}

.style-icon-arrow {
    font-size: 0.55rem;
    margin-left: 2px;
}

.style-icon-value {
    font-size: 0.65rem;
    margin-left: 2px;
}

.style-icon-with-swatch,
.style-icon-with-arrow {
    position: relative;
}
</style>
