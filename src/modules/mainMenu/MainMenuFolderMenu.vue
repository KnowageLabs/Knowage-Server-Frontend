<template>
    <div class="kn-folder-menu">
        <!-- The header is the folder itself. When the folder points to a document, the header opens it. -->
        <div class="kn-folder-menu__header">
            <MainMenuPopupRow
                v-if="hasOwnTarget(folder)"
                class="kn-folder-menu__header-link"
                :label="translate(folder.label)"
                :icon="normalizeMenuIcon(folder.iconCls, 'insert_drive_file')"
                :image-src="folder.custIcon"
                :link="getOwnLink(folder)"
                :active="isRouteActive($route.path, folder.to)"
                trailing-icon="sym_o_arrow_outward"
                @activate="$emit('activate', folder)"
            />
            <div v-else class="kn-folder-menu__title-row">
                <span class="kn-folder-menu__icon">
                    <q-icon :name="normalizeMenuIcon(folder.iconCls, 'folder')" size="18px" />
                </span>
                <span class="kn-folder-menu__title">{{ translate(folder.label) }}</span>
            </div>
        </div>

        <q-separator class="kn-folder-menu__separator" />

        <!-- The children form a tree. The caret expands a node. The label opens the document of the node, or expands it when it has no document. -->
        <!-- The header stays in place. Only the tree scrolls when it is taller than the popup. -->
        <div class="kn-folder-menu__tree">
            <div v-for="row in rows" :key="row.key" class="kn-folder-row" :style="{ paddingLeft: row.depth * 16 + 'px' }">
                <button
                    v-if="row.hasChildren"
                    type="button"
                    class="kn-folder-row__toggle"
                    :aria-expanded="row.expanded"
                    :aria-label="(row.expanded ? $t('common.collapse') : $t('common.expand')) + ' ' + translate(row.item.label)"
                    @click="toggle(row.key)"
                >
                    <q-icon name="chevron_right" size="18px" class="kn-folder-row__caret" :class="{ 'kn-folder-row__caret--open': row.expanded }" />
                </button>
                <span v-else class="kn-folder-row__spacer"></span>
                <MainMenuPopupRow
                    :label="translate(row.item.label)"
                    :icon="getRowIcon(row)"
                    :image-src="row.item.custIcon"
                    :link="row.hasTarget ? getOwnLink(row.item) : { kind: 'action' }"
                    :active="isRouteActive($route.path, row.item.to)"
                    :disabled="!row.hasTarget && !row.hasChildren"
                    @activate="onRowActivate(row)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { containsRoute, getOwnLink, hasOwnTarget, isRouteActive, normalizeMenuIcon } from '@/modules/mainMenu/MainMenuHelpers'
import type { IMenuItem } from '@/modules/mainMenu/MainMenu'

interface ITreeRow {
    key: string
    item: IMenuItem
    depth: number
    hasChildren: boolean
    hasTarget: boolean
    expanded: boolean
}

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
            // Custom items carry no id, so a node is keyed by its index path ("0.2.1").
            expandedKeys: [] as string[]
        }
    },
    computed: {
        rows(): ITreeRow[] {
            const rows: ITreeRow[] = []
            const walk = (items: IMenuItem[] | undefined, depth: number, parentKey: string) => {
                ;(items ?? []).forEach((item, index) => {
                    const key = parentKey ? parentKey + '.' + index : String(index)
                    const hasChildren = !!item.items?.length
                    const expanded = hasChildren && this.expandedKeys.includes(key)
                    rows.push({ key, item, depth, hasChildren, hasTarget: hasOwnTarget(item), expanded })
                    if (expanded) walk(item.items, depth + 1, key)
                })
            }
            walk(this.folder.items, 0, '')
            return rows
        }
    },
    created() {
        this.expandedKeys = this.getActiveBranchKeys(this.folder.items, '')
    },
    methods: {
        normalizeMenuIcon,
        getOwnLink,
        hasOwnTarget,
        isRouteActive,
        // The popup opens with the branch of the current page expanded.
        getActiveBranchKeys(items: IMenuItem[] | undefined, parentKey: string): string[] {
            const keys: string[] = []
            ;(items ?? []).forEach((item, index) => {
                const key = parentKey ? parentKey + '.' + index : String(index)
                if (item.items?.length && containsRoute(item.items, this.$route.path)) keys.push(key, ...this.getActiveBranchKeys(item.items, key))
            })
            return keys
        },
        getRowIcon(row: ITreeRow): string {
            if (row.hasTarget || !row.hasChildren) return normalizeMenuIcon(row.item.iconCls, 'insert_drive_file')
            return normalizeMenuIcon(row.item.iconCls, row.expanded ? 'folder_open' : 'folder')
        },
        toggle(key: string) {
            const index = this.expandedKeys.indexOf(key)
            if (index >= 0) this.expandedKeys.splice(index, 1)
            else this.expandedKeys.push(key)
        },
        onRowActivate(row: ITreeRow) {
            if (row.hasTarget) this.$emit('activate', row.item)
            else if (row.hasChildren) this.toggle(row.key)
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-folder-menu {
    display: flex;
    flex-direction: column;
    min-width: 240px;
    max-width: 360px;
    /* The q-menu sets the limit: 520px, or less when the space next to the row is smaller. Only the tree scrolls. */
    max-height: inherit;
    padding: 4px;
}
.kn-folder-menu__header,
.kn-folder-menu__separator {
    flex: 0 0 auto;
}
.kn-folder-menu__tree {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    /* Same bar as the rail, in dark on the light popup. See the comment in MainMenu.vue. */
    &::-webkit-scrollbar {
        width: 5px;
    }
    &::-webkit-scrollbar-button {
        display: none;
    }
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    &::-webkit-scrollbar-thumb {
        border-radius: 5px;
        background: rgba(0, 0, 0, 0.2);
        &:hover {
            background: rgba(0, 0, 0, 0.35);
        }
    }
    @supports not selector(::-webkit-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    }
}
.kn-folder-menu__header :deep(.kn-popup-row__label),
.kn-folder-menu__title {
    font-weight: 500;
}
.kn-folder-menu__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 36px;
    padding: 0 8px;
}
.kn-folder-menu__icon {
    flex: 0 0 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.kn-folder-menu__title {
    min-width: 0;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-folder-menu__separator {
    margin: 4px 0;
}
.kn-folder-row {
    display: flex;
    align-items: center;
    :deep(.kn-popup-row) {
        flex: 1 1 auto;
        min-width: 0;
    }
}
.kn-folder-row__toggle,
.kn-folder-row__spacer {
    flex: 0 0 24px;
    width: 24px;
    height: 36px;
}
.kn-folder-row__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
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
.kn-folder-row__caret {
    transition: transform 150ms;
    &--open {
        transform: rotate(90deg);
    }
}
@media (prefers-reduced-motion: reduce) {
    .kn-folder-row__caret {
        transition: none;
    }
}
</style>
