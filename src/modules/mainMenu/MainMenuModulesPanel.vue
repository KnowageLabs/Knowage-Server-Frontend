<template>
    <div class="kn-modules-panel" @keydown.esc="onEsc">
        <div class="kn-modules-panel__search">
            <!-- Enter runs on keyup: on keydown the menu closes first, and the keyup then reaches the refocused rail button and reopens it. -->
            <q-input v-model="search" dense borderless autofocus class="kn-modules-panel__input" :placeholder="$t('menu.searchModules')" :aria-label="$t('menu.searchModules')" @keyup.enter.prevent="openFirstMatch">
                <template #prepend><q-icon name="sym_o_search" size="20px" /></template>
            </q-input>
        </div>

        <div class="kn-modules-panel__panes">
            <div class="kn-modules-panel__groups" role="listbox" :aria-label="$t('menu.modules')">
                <button v-if="recentMatches.length" type="button" class="kn-modules-panel__group" :class="{ 'kn-modules-panel__group--selected': !search && effectiveSelection === 'recent' }" role="option" :aria-selected="!search && effectiveSelection === 'recent'" @click="selected = 'recent'">
                    <q-icon name="sym_o_history" size="18px" class="kn-modules-panel__group-icon" />
                    <span class="kn-modules-panel__group-label">{{ $t('menu.recentModules') }}</span>
                    <span class="kn-modules-panel__group-count">{{ recentMatches.length }}</span>
                </button>

                <button
                    v-for="(group, index) in groups"
                    :key="'group-' + index"
                    type="button"
                    class="kn-modules-panel__group"
                    :class="{ 'kn-modules-panel__group--selected': !search && effectiveSelection === index }"
                    role="option"
                    :aria-selected="!search && effectiveSelection === index"
                    @click="selected = index"
                >
                    <q-icon v-if="!isPrimeIcon(groupIcon(group))" :name="groupIcon(group)" size="18px" class="kn-modules-panel__group-icon" />
                    <i v-else :class="groupIcon(group)" class="kn-modules-panel__group-icon kn-modules-panel__group-glyph"></i>
                    <span class="kn-modules-panel__group-label">{{ translate(group.label) }}</span>
                    <span class="kn-modules-panel__group-count">{{ (group.items || []).length }}</span>
                </button>
            </div>

            <div class="kn-modules-panel__items">
                <template v-if="search">
                    <div class="kn-modules-panel__title">{{ searchMatches.length ? $t('menu.modules') : $t('menu.noModulesFound', { search }) }}</div>
                    <MainMenuPopupRow
                        v-for="(match, index) in searchMatches"
                        :key="'match-' + index"
                        :label="translate(match.item.label)"
                        :icon="getModuleIcon(match.item)"
                        :meta="translate(match.group.label)"
                        :highlight="search"
                        :link="getMenuLink(match.item)"
                        @activate="open(match.item)"
                    />
                </template>
                <template v-else>
                    <div class="kn-modules-panel__title">{{ selectedTitle }}</div>
                    <MainMenuPopupRow v-for="(item, index) in selectedItems" :key="'item-' + index" :label="translate(item.label)" :icon="getModuleIcon(item)" :link="getMenuLink(item)" @activate="open(item)" />
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { getMenuLink, getModuleGroupIcon, getModuleIcon, isPrimeIcon, pushRecentModule, readRecentModules, resolveRecentModules, searchModules } from '@/modules/mainMenu/MainMenuHelpers'
import type { IMenuGroup, IMenuItem, IModuleMatch, IRecentModule } from '@/modules/mainMenu/MainMenu'

export default defineComponent({
    name: 'main-menu-modules-panel',
    components: { MainMenuPopupRow },
    props: {
        groups: { type: Array as PropType<IMenuGroup[]>, default: () => [] },
        userId: { type: String, default: '' },
        translate: { type: Function as PropType<(label: string | undefined) => string>, required: true }
    },
    emits: ['activate', 'close'],
    data() {
        return {
            search: '',
            selected: null as number | 'recent' | null,
            recent: readRecentModules(this.userId) as IRecentModule[]
        }
    },
    computed: {
        recentMatches(): IModuleMatch[] {
            return resolveRecentModules(this.recent, this.groups)
        },
        searchMatches(): IModuleMatch[] {
            return searchModules(this.groups, this.search, (label: string) => this.translate(label))
        },
        effectiveSelection(): number | 'recent' {
            return this.selected ?? (this.recentMatches.length ? 'recent' : 0)
        },
        selectedItems(): IMenuItem[] {
            if (this.effectiveSelection === 'recent') return this.recentMatches.map((match) => match.item)
            return this.groups[this.effectiveSelection as number]?.items ?? []
        },
        selectedTitle(): string {
            if (this.effectiveSelection === 'recent') return this.$t('menu.recentModules') as string
            return this.translate(this.groups[this.effectiveSelection as number]?.label)
        }
    },
    methods: {
        getModuleIcon,
        getMenuLink,
        isPrimeIcon,
        groupIcon(group: IMenuGroup): string {
            return getModuleGroupIcon(group)
        },
        onEsc(event: KeyboardEvent) {
            if (!this.search) return
            event.stopPropagation()
            this.search = ''
        },
        open(item: IMenuItem) {
            this.recent = pushRecentModule(this.userId, item)
            this.$emit('activate', item)
        },
        openFirstMatch() {
            const match = this.searchMatches[0]
            if (!match) return
            const link = getMenuLink(match.item)
            if (link.kind === 'route') this.$router.push(link.to as any)
            else if (link.kind === 'external') window.open(link.href, link.target, 'noopener')
            this.open(match.item)
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-modules-panel {
    width: 700px;
    /* 56px header + 516px body. The body holds 14 group rows of 36px plus 12px of padding, so the group list needs no scrollbar. */
    height: 572px;
    max-height: calc(100vh - 16px);
    display: grid;
    grid-template-rows: 56px minmax(0, 1fr);
}
.kn-modules-panel__search {
    padding: 0 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
}
.kn-modules-panel__input {
    width: 100%;
}
.kn-modules-panel__panes {
    display: grid;
    grid-template-columns: 228px minmax(0, 1fr);
    min-height: 0;
}
.kn-modules-panel__groups {
    overflow-y: auto;
    padding: 6px;
    border-right: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(0, 0, 0, 0.02);
}
.kn-modules-panel__items {
    overflow-y: auto;
    padding: 8px;
}
.kn-modules-panel__group {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 36px;
    margin: 0;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    &:hover {
        background: var(--kn-adminmenu-hover-background-color);
    }
    &:focus-visible {
        outline: 2px solid var(--kn-mainmenu-highlight-color);
        outline-offset: -2px;
    }
    &--selected {
        background: #fff;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
        font-weight: 500;
        .kn-modules-panel__group-icon {
            color: var(--kn-mainmenu-highlight-color);
        }
    }
}
.kn-modules-panel__group-glyph {
    font-size: 18px;
}
.kn-modules-panel__group-label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-modules-panel__group-count {
    flex: 0 0 auto;
    margin-left: auto;
    font-size: 11.5px;
    opacity: 0.6;
}
.kn-modules-panel__title {
    margin: 4px 8px 8px;
    font-size: 11px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    opacity: 0.6;
}
</style>
