<template>
    <router-link v-if="link.kind === 'route'" :to="(link as any).to" custom v-slot="{ href, navigate }">
        <a
            :href="href"
            class="kn-rail-item"
            :class="rowClasses"
            :aria-label="label"
            :aria-current="active ? 'page' : undefined"
            :aria-disabled="disabled ? 'true' : undefined"
            :data-tour-id="tourId"
            @mouseenter="onMouseEnter"
            @click="onRouteClick($event, navigate)"
        >
            <span class="kn-rail-item__icon">
                <img v-if="imageSrc" class="kn-rail-item__image" :src="imageSrc" alt="" />
                <i v-else-if="icon && isPrimeIcon(icon)" :class="icon" class="kn-rail-item__glyph"></i>
                <q-icon v-else :name="icon" size="var(--kn-mainmenu-icon-size)" />
            </span>
            <span ref="label" class="kn-rail-item__label">{{ label }}</span>
            <q-badge v-if="badge > 0" class="kn-rail-item__badge">{{ badge }}</q-badge>
            <q-icon v-if="showChevron" name="chevron_right" class="kn-rail-item__chevron" />
            <q-tooltip v-if="showTooltip" anchor="center right" self="center left" :offset="[10, 0]" :delay="300">{{ label }}</q-tooltip>
            <slot></slot>
        </a>
    </router-link>

    <a
        v-else-if="link.kind === 'external'"
        :href="(link as any).href"
        :target="(link as any).target"
        rel="noopener"
        class="kn-rail-item"
        :class="rowClasses"
        :aria-label="label"
        :aria-disabled="disabled ? 'true' : undefined"
        :data-tour-id="tourId"
        @mouseenter="onMouseEnter"
        @click="onPlainClick"
    >
        <span class="kn-rail-item__icon">
            <img v-if="imageSrc" class="kn-rail-item__image" :src="imageSrc" alt="" />
            <i v-else-if="icon && isPrimeIcon(icon)" :class="icon" class="kn-rail-item__glyph"></i>
            <q-icon v-else :name="icon" size="var(--kn-mainmenu-icon-size)" />
        </span>
        <span ref="label" class="kn-rail-item__label">{{ label }}</span>
        <q-badge v-if="badge > 0" class="kn-rail-item__badge">{{ badge }}</q-badge>
        <q-icon v-if="showChevron" name="chevron_right" class="kn-rail-item__chevron" />
        <q-tooltip v-if="showTooltip" anchor="center right" self="center left" :offset="[10, 0]" :delay="300">{{ label }}</q-tooltip>
        <slot></slot>
    </a>

    <button
        v-else
        type="button"
        class="kn-rail-item"
        :class="rowClasses"
        :aria-label="label"
        :aria-haspopup="hasPopup ? 'menu' : undefined"
        :aria-expanded="hasPopup ? popupOpen : undefined"
        :disabled="disabled"
        :data-tour-id="tourId"
        @mouseenter="onMouseEnter"
        @click="onPlainClick"
    >
        <span class="kn-rail-item__icon">
            <img v-if="imageSrc" class="kn-rail-item__image" :src="imageSrc" alt="" />
            <i v-else-if="icon && isPrimeIcon(icon)" :class="icon" class="kn-rail-item__glyph"></i>
            <q-icon v-else :name="icon" size="var(--kn-mainmenu-icon-size)" />
        </span>
        <span ref="label" class="kn-rail-item__label">{{ label }}</span>
        <q-badge v-if="badge > 0" class="kn-rail-item__badge">{{ badge }}</q-badge>
        <q-icon v-if="showChevron" name="chevron_right" class="kn-rail-item__chevron" />
        <q-tooltip v-if="showTooltip" anchor="center right" self="center left" :offset="[10, 0]" :delay="300">{{ label }}</q-tooltip>
        <slot></slot>
    </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { isPrimeIcon } from './MainMenuHelpers'
import type { MenuLink } from './MainMenu'

export default defineComponent({
    name: 'main-menu-rail-item',
    props: {
        label: { type: String, required: true },
        icon: { type: String, default: '' },
        imageSrc: { type: String, default: '' },
        link: { type: Object as PropType<MenuLink>, default: () => ({ kind: 'action' }) },
        expanded: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
        badge: { type: Number, default: 0 },
        disabled: { type: Boolean, default: false },
        showChevron: { type: Boolean, default: false },
        hasPopup: { type: Boolean, default: false },
        popupOpen: { type: Boolean, default: false },
        tourId: { type: String, default: undefined }
    },
    emits: ['activate'],
    data() {
        return {
            isTruncated: false
        }
    },
    computed: {
        rowClasses(): Record<string, boolean> {
            return {
                'kn-rail-item--expanded': this.expanded,
                'kn-rail-item--active': this.active,
                'kn-rail-item--disabled': this.disabled
            }
        },
        showTooltip(): boolean {
            // Hover expands the menu, so the tooltip only shows a label cut off in the expanded menu.
            return !this.popupOpen && this.expanded && this.isTruncated
        }
    },
    watch: {
        expanded(value: boolean) {
            if (!value) this.isTruncated = false
        }
    },
    methods: {
        isPrimeIcon,
        onMouseEnter() {
            const labelEl = this.$refs.label as HTMLElement | undefined
            this.isTruncated = this.expanded && !!labelEl && labelEl.scrollWidth > labelEl.clientWidth
        },
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
.kn-rail-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 44px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--kn-mainmenu-icon-color);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    &:hover {
        background: var(--kn-mainmenu-hover-background-color);
    }
    &:focus-visible {
        outline: 2px solid var(--kn-mainmenu-highlight-color);
        outline-offset: -2px;
    }
    &--active {
        background: var(--kn-mainmenu-hover-background-color);
        box-shadow: inset 3px 0 0 var(--kn-mainmenu-highlight-color);
    }
    &--disabled {
        opacity: 0.5;
        cursor: default;
    }
}
.kn-rail-item__icon {
    flex: 0 0 var(--kn-mainmenu-width);
    width: var(--kn-mainmenu-width);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.kn-rail-item__glyph {
    font-size: var(--kn-mainmenu-icon-size);
}
.kn-rail-item__image {
    width: calc(var(--kn-mainmenu-icon-size) + 2px);
    height: calc(var(--kn-mainmenu-icon-size) + 2px);
    object-fit: contain;
}
.kn-rail-item__label {
    flex: 1 1 auto;
    min-width: 0;
    padding-right: 12px;
    font-size: var(--kn-mainmenu-font-size);
    line-height: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    transition: opacity 150ms;
}
.kn-rail-item--expanded .kn-rail-item__label {
    opacity: 1;
}
.kn-rail-item__badge {
    position: absolute;
    top: 6px;
    left: 34px;
    background: var(--kn-mainmenu-badge-background-color) !important;
    color: var(--kn-mainmenu-badge-color);
}
.kn-rail-item--expanded .kn-rail-item__badge {
    position: static;
    margin-right: 12px;
}
.kn-rail-item__chevron {
    display: none;
    margin-right: 10px;
    font-size: 16px;
}
.kn-rail-item--expanded .kn-rail-item__chevron {
    display: inline-flex;
}
@media (prefers-reduced-motion: reduce) {
    .kn-rail-item__label {
        transition: none;
    }
}
</style>
