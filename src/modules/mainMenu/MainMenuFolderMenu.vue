<template>
    <div class="kn-folder-menu" @keydown.esc="onEsc">
        <div class="kn-folder-menu__header">
            <button v-if="stack.length" type="button" class="kn-folder-menu__back" :aria-label="$t('common.back')" @click="stack.pop()">
                <q-icon name="arrow_back" size="18px" />
            </button>
            <span v-else class="kn-folder-menu__icon">
                <q-icon :name="normalizeMenuIcon(current.iconCls, 'folder')" size="18px" />
            </span>
            <span class="kn-folder-menu__title">{{ translate(current.label) }}</span>
        </div>

        <MainMenuPopupRow
            v-for="(child, index) in current.items"
            :key="'child-' + index"
            :label="translate(child.label)"
            :icon="normalizeMenuIcon(child.iconCls, child.items && child.items.length ? 'folder' : 'insert_drive_file')"
            :image-src="child.custIcon"
            :link="getMenuLink(child)"
            :show-chevron="!!(child.items && child.items.length)"
            :disabled="!(child.items && child.items.length) && !isItemClickable(child)"
            @activate="onChildActivate(child)"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { getMenuLink, isItemClickable, normalizeMenuIcon } from '@/modules/mainMenu/MainMenuHelpers'
import type { IMenuItem } from '@/modules/mainMenu/MainMenu'

export default defineComponent({
    name: 'main-menu-folder-menu',
    components: { MainMenuPopupRow },
    props: {
        folder: { type: Object as PropType<IMenuItem>, required: true },
        translate: { type: Function as PropType<(label: string | undefined) => string>, required: true }
    },
    emits: ['activate', 'close'],
    data() {
        return {
            stack: [] as IMenuItem[]
        }
    },
    computed: {
        current(): IMenuItem {
            return this.stack[this.stack.length - 1] ?? this.folder
        }
    },
    methods: {
        normalizeMenuIcon,
        getMenuLink,
        isItemClickable,
        onEsc(event: KeyboardEvent) {
            if (!this.stack.length) return
            event.stopPropagation()
            this.stack.pop()
        },
        onChildActivate(child: IMenuItem) {
            if (child.items && child.items.length) {
                this.stack.push(child)
                return
            }
            this.$emit('activate', child)
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-folder-menu {
    width: 260px;
    padding: 4px;
}
.kn-folder-menu__header {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 4px;
    margin-bottom: 4px;
}
.kn-folder-menu__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    &:hover {
        background: var(--kn-adminmenu-hover-background-color);
    }
    &:focus-visible {
        outline: 2px solid var(--kn-mainmenu-highlight-color);
        outline-offset: -2px;
    }
}
.kn-folder-menu__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
}
.kn-folder-menu__title {
    min-width: 0;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
