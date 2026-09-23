<template>
    <div class="kn-account-menu" @keydown.esc="onEsc">
        <template v-if="view === 'main'">
            <div class="kn-account-menu__header">
                <span class="kn-account-menu__avatar">{{ initials }}</span>
                <span class="kn-account-menu__identity">
                    <span class="kn-account-menu__name">{{ user.fullName || user.userId }}</span>
                    <span class="kn-account-menu__user">{{ user.userId }}</span>
                    <span class="kn-account-menu__chip">{{ user.sessionRole || $t('role.defaultRolePlaceholder') }}</span>
                </span>
            </div>

            <MainMenuPopupRow v-if="languageItem" icon="sym_o_translate" :label="$t('menu.language')" :meta="currentLanguageName" show-chevron tour-id="menu-action-languageSelection" @activate="$emit('update:view', 'language')" />
            <MainMenuPopupRow v-if="roleItem" icon="sym_o_manage_accounts" :label="$t('menu.role')" :meta="user.sessionRole || $t('role.defaultRolePlaceholder')" show-chevron tour-id="menu-action-roleSelection" @activate="$emit('update:view', 'role')" />
            <MainMenuPopupRow v-if="myAccountItem" :icon="normalizeMenuIcon(myAccountItem.iconCls, 'sym_o_account_circle')" :label="translate(myAccountItem.label)" :link="getMenuLink(myAccountItem)" @activate="$emit('activate', myAccountItem)" />

            <div class="kn-account-menu__separator"></div>

            <MainMenuPopupRow v-for="item in otherItems" :key="item.command || item.to || item.label" :icon="normalizeMenuIcon(item.iconCls)" :label="translate(item.label)" :link="getMenuLink(item)" :tour-id="item.command ? 'menu-action-' + item.command : undefined" @activate="$emit('activate', item)" />

            <template v-if="logoutItem">
                <div class="kn-account-menu__separator"></div>
                <MainMenuPopupRow :icon="normalizeMenuIcon(logoutItem.iconCls)" :label="translate(logoutItem.label)" danger tour-id="menu-action-logout" @activate="$emit('activate', logoutItem)" />
            </template>
        </template>

        <template v-else-if="view === 'role'">
            <div class="kn-account-menu__drill-header">
                <button type="button" class="kn-account-menu__back" :aria-label="$t('common.back')" @click="$emit('update:view', 'main')">
                    <q-icon name="arrow_back" size="18px" />
                </button>
                <span class="kn-account-menu__drill-title">{{ $t('menu.role') }}</span>
            </div>
            <MainMenuPopupRow v-for="(role, index) in roleOptions" :key="'role-' + index" :label="role || $t('role.defaultRolePlaceholder')" :checked="role === currentRole" @activate="selectRole(role)" />
        </template>

        <template v-else>
            <div class="kn-account-menu__drill-header">
                <button type="button" class="kn-account-menu__back" :aria-label="$t('common.back')" @click="$emit('update:view', 'main')">
                    <q-icon name="arrow_back" size="18px" />
                </button>
                <span class="kn-account-menu__drill-title">{{ $t('menu.language') }}</span>
            </div>
            <MainMenuPopupRow v-for="locale in languages" :key="locale" :image-src="flagSrc(locale)" :label="$t('language.' + locale)" :checked="locale.replace('_', '-') === $i18n.locale" @activate="selectLanguage(locale)" />
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapState, mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { getInitials, getMenuLink, normalizeMenuIcon } from '@/modules/mainMenu/MainMenuHelpers'
import type { IMenuItem } from '@/modules/mainMenu/MainMenu'

export default defineComponent({
    name: 'main-menu-account-menu',
    components: { MainMenuPopupRow },
    props: {
        commonItems: { type: Array as PropType<IMenuItem[]>, default: () => [] },
        myAccountItem: { type: Object as PropType<IMenuItem | null>, default: null },
        roleMandatory: { type: Boolean, default: false },
        view: { type: String, default: 'main' },
        translate: { type: Function as PropType<(label: string | undefined) => string>, required: true }
    },
    emits: ['update:view', 'activate', 'language-changed', 'close'],
    data() {
        return {
            languages: [] as string[],
            publicPath: import.meta.env.VITE_PUBLIC_PATH
        }
    },
    computed: {
        ...mapState(mainStore, ['user']),
        initials(): string {
            return getInitials(this.user?.fullName || this.user?.userId)
        },
        roleItem(): IMenuItem | null {
            return this.commonItems.find((item) => item.command === 'roleSelection') ?? null
        },
        languageItem(): IMenuItem | null {
            return this.commonItems.find((item) => item.command === 'languageSelection') ?? null
        },
        logoutItem(): IMenuItem | null {
            return this.commonItems.find((item) => item.command === 'logout') ?? null
        },
        otherItems(): IMenuItem[] {
            return this.commonItems.filter((item) => item.command !== 'roleSelection' && item.command !== 'languageSelection' && item.command !== 'logout')
        },
        currentRole(): string {
            return this.user?.sessionRole || ''
        },
        roleOptions(): string[] {
            const roles = [...(this.user?.roles ?? [])]
            return this.roleMandatory ? roles : ['', ...roles]
        },
        currentLanguageName(): string {
            const key = 'language.' + this.$i18n.locale.replace('-', '_')
            return this.$te(key) ? (this.$t(key) as string) : this.$i18n.locale
        }
    },
    watch: {
        // The parent can open the menu straight on the language view (the languageSelection command), so load on the view, not on the row click.
        view: {
            immediate: true,
            handler(view: string) {
                if (view === 'language') this.loadLanguages()
            }
        }
    },
    methods: {
        ...mapActions(mainStore, ['setUser', 'setLocale']),
        normalizeMenuIcon,
        getMenuLink,
        flagSrc(locale: string): string {
            return `${this.publicPath}/images/flags/${locale.toLowerCase().substring(3, 5)}.svg`
        },
        onEsc(event: KeyboardEvent) {
            if (this.view === 'main') return
            event.stopPropagation()
            this.$emit('update:view', 'main')
        },
        async loadLanguages() {
            if (this.languages.length) return
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/languages').then(
                (response: AxiosResponse<any>) => {
                    this.languages = [...response.data].sort()
                },
                (error) => console.error(error)
            )
        },
        async selectRole(role: string) {
            await this.$http.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/setsessionrole?SELECTED_ROLE=${encodeURIComponent(role)}`)
            const user = { ...this.user, sessionRole: role }
            this.setUser(user)
            localStorage.setItem('sessionRole', role)
            this.$router.go(0)
        },
        async selectLanguage(locale: string) {
            const normalized = locale.replace('_', '-')
            this.setLocale(normalized)
            localStorage.setItem('locale', normalized)
            await loadLanguageAsync(normalized)
            this.$i18n.locale = normalized
            this.$emit('language-changed', normalized)
            this.$emit('update:view', 'main')
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-account-menu {
    width: 290px;
    padding: 4px;
}
.kn-account-menu__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
}
.kn-account-menu__avatar {
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--kn-mainmenu-highlight-color);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
}
.kn-account-menu__identity {
    display: flex;
    flex-direction: column;
    min-width: 0;
}
.kn-account-menu__name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-account-menu__user {
    font-size: 12px;
    opacity: 0.7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-account-menu__chip {
    align-self: flex-start;
    margin-top: 4px;
    padding: 1px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.06);
    background: color-mix(in srgb, var(--kn-mainmenu-highlight-color) 15%, transparent);
    color: var(--kn-mainmenu-highlight-color);
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
.kn-account-menu__separator {
    height: 1px;
    margin: 6px 4px;
    background: rgba(0, 0, 0, 0.08);
}
.kn-account-menu__drill-header {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 4px;
    margin-bottom: 4px;
}
.kn-account-menu__back {
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
.kn-account-menu__drill-title {
    font-size: 13px;
    font-weight: 500;
}
</style>
