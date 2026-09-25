<template>
    <router-link v-if="link.kind === 'route'" :to="(link as any).to" custom v-slot="{ href, navigate }">
        <a :href="href" class="kn-popup-row" :class="rowClasses" :data-tour-id="tourId" @click="onRouteClick($event, navigate)">
            <span class="kn-popup-row__icon">
                <img v-if="imageSrc" class="kn-popup-row__image" :src="imageSrc" alt="" />
                <i v-else-if="icon && isPrimeIcon(icon)" :class="icon" class="kn-popup-row__glyph"></i>
                <q-icon v-else-if="icon" :name="icon" size="18px" />
            </span>
            <span class="kn-popup-row__label"><template v-for="(part, index) in labelParts" :key="index"><mark v-if="part.match" class="kn-popup-row__match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
            <span v-if="meta" class="kn-popup-row__meta">{{ meta }}</span>
            <q-icon v-if="checked" name="check" class="kn-popup-row__check" size="18px" />
            <q-icon v-if="showChevron" name="chevron_right" class="kn-popup-row__chevron" size="18px" />
        </a>
    </router-link>

    <a v-else-if="link.kind === 'external'" :href="(link as any).href" :target="(link as any).target" rel="noopener" class="kn-popup-row" :class="rowClasses" :data-tour-id="tourId" @click="onPlainClick">
        <span class="kn-popup-row__icon">
            <img v-if="imageSrc" class="kn-popup-row__image" :src="imageSrc" alt="" />
            <i v-else-if="icon && isPrimeIcon(icon)" :class="icon" class="kn-popup-row__glyph"></i>
            <q-icon v-else-if="icon" :name="icon" size="18px" />
        </span>
        <span class="kn-popup-row__label"><template v-for="(part, index) in labelParts" :key="index"><mark v-if="part.match" class="kn-popup-row__match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
        <span v-if="meta" class="kn-popup-row__meta">{{ meta }}</span>
        <q-icon v-if="checked" name="check" class="kn-popup-row__check" size="18px" />
        <q-icon v-if="showChevron" name="chevron_right" class="kn-popup-row__chevron" size="18px" />
    </a>

    <button v-else type="button" class="kn-popup-row" :class="rowClasses" :disabled="disabled" :data-tour-id="tourId" @click="onPlainClick">
        <span class="kn-popup-row__icon">
            <img v-if="imageSrc" class="kn-popup-row__image" :src="imageSrc" alt="" />
            <i v-else-if="icon && isPrimeIcon(icon)" :class="icon" class="kn-popup-row__glyph"></i>
            <q-icon v-else-if="icon" :name="icon" size="18px" />
        </span>
        <span class="kn-popup-row__label"><template v-for="(part, index) in labelParts" :key="index"><mark v-if="part.match" class="kn-popup-row__match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
        <span v-if="meta" class="kn-popup-row__meta">{{ meta }}</span>
        <q-icon v-if="checked" name="check" class="kn-popup-row__check" size="18px" />
        <q-icon v-if="showChevron" name="chevron_right" class="kn-popup-row__chevron" size="18px" />
    </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { isPrimeIcon } from './MainMenuHelpers'
import type { MenuLink } from './MainMenu'

interface ILabelPart {
    text: string
    match: boolean
}

export default defineComponent({
    name: 'main-menu-popup-row',
    props: {
        label: { type: String, required: true },
        icon: { type: String, default: '' },
        imageSrc: { type: String, default: '' },
        meta: { type: String, default: '' },
        link: { type: Object as PropType<MenuLink>, default: () => ({ kind: 'action' }) },
        showChevron: { type: Boolean, default: false },
        checked: { type: Boolean, default: false },
        danger: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        highlight: { type: String, default: '' },
        tourId: { type: String, default: undefined }
    },
    emits: ['activate'],
    computed: {
        rowClasses(): Record<string, boolean> {
            return {
                'kn-popup-row--danger': this.danger,
                'kn-popup-row--disabled': this.disabled
            }
        },
        labelParts(): ILabelPart[] {
            const search = this.highlight.trim()
            if (!search) return [{ text: this.label, match: false }]
            const start = this.label.toLowerCase().indexOf(search.toLowerCase())
            if (start < 0) return [{ text: this.label, match: false }]
            const end = start + search.length
            const parts: ILabelPart[] = []
            if (start > 0) parts.push({ text: this.label.substring(0, start), match: false })
            parts.push({ text: this.label.substring(start, end), match: true })
            if (end < this.label.length) parts.push({ text: this.label.substring(end), match: false })
            return parts
        }
    },
    methods: {
        isPrimeIcon,
        onPlainClick(event: MouseEvent) {
            if (this.disabled) {
                event.preventDefault()
                return
            }
            this.$emit('activate')
        },
        onRouteClick(event: MouseEvent, navigate: (event: MouseEvent) => void) {
            if (this.disabled) {
                event.preventDefault()
                return
            }
            navigate(event)
            this.$emit('activate')
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-popup-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 36px;
    margin: 0;
    padding: 0 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    &:hover {
        background: var(--kn-adminmenu-hover-background-color);
    }
    &:focus-visible {
        background: var(--kn-adminmenu-hover-background-color);
        outline: 2px solid var(--kn-mainmenu-highlight-color);
        outline-offset: -2px;
    }
    &--danger {
        color: var(--q-negative);
    }
    &--disabled {
        opacity: 0.5;
        cursor: default;
    }
}
.kn-popup-row__icon {
    flex: 0 0 24px;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.kn-popup-row__glyph {
    font-size: 18px;
}
.kn-popup-row__image {
    width: 18px;
    height: 18px;
    object-fit: contain;
}
.kn-popup-row__label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-popup-row__match {
    background: #ffe38a;
    color: inherit;
    border-radius: 2px;
}
.kn-popup-row__meta {
    flex: 0 0 auto;
    max-width: 45%;
    font-size: 12.5px;
    opacity: 0.65;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-popup-row__check {
    flex: 0 0 auto;
    color: var(--kn-mainmenu-highlight-color);
}
.kn-popup-row__chevron {
    flex: 0 0 auto;
}
</style>
