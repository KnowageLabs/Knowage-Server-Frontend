<template>
    <nav
        id="kn-main-menu"
        class="kn-main-menu layout-menu-container"
        :class="{ 'kn-main-menu--expanded': expanded }"
        :aria-label="$t('menu.mainMenu')"
        @mouseenter="onPointerEnter"
        @mouseleave="onPointerLeave"
        @focusin="onFocusIn"
        @focusout="onFocusOut"
    >
        <div class="kn-main-menu__rail">
            <div class="kn-main-menu__header">
                <div class="kn-main-menu__logo-cell">
                    <img class="kn-main-menu__logo" :src="logoSrc" alt="" />
                </div>
                <span v-if="expanded" class="kn-main-menu__brand">{{ hasTenantLogo ? '' : 'Knowage' }}</span>
            </div>

            <div class="kn-main-menu__zone kn-main-menu__zone--top">
                <MainMenuRailItem v-if="modules.length" :label="$t('menu.modules')" icon="fas fa-cog" :expanded="expanded" :active="modulesOpen || isModulesRouteActive" has-popup :popup-open="modulesOpen" tour-id="menu-modules">
                    <q-menu v-model="modulesOpen" class="kn-main-menu-popup" anchor="top right" self="top left" :offset="[8, 0]" max-height="calc(100vh - 16px)">
                        <MainMenuModulesPanel :groups="modules" :user-id="user.userId" :translate="translate" @activate="onModuleActivate" @close="modulesOpen = false" />
                    </q-menu>
                </MainMenuRailItem>

                <MainMenuRailItem v-if="homeItem" :label="translate(homeItem.label)" :icon="normalizeMenuIcon(homeItem.iconCls)" :link="getMenuLink(homeItem)" :expanded="expanded" :active="isRouteActive($route.path, '/')" @activate="onActivate(homeItem)" />
            </div>

            <div class="kn-main-menu__zone kn-main-menu__zone--middle" data-tour-id="menu-items">
                <MainMenuRailItem
                    v-for="item in railAllowedItems"
                    :key="item.to || item.command || item.label"
                    :label="translate(item.label)"
                    :icon="normalizeMenuIcon(item.iconCls)"
                    :image-src="item.custIcon"
                    :link="getMenuLink(item)"
                    :expanded="expanded"
                    :active="isRouteActive($route.path, item.to)"
                    :badge="getBadge(item)"
                    :tour-id="getTourId(item)"
                    @activate="onActivate(item)"
                />

                <div v-if="customItems.length" class="kn-main-menu__separator" role="separator">
                    <span class="kn-main-menu__separator-label">{{ $t('menu.customMenu') }}</span>
                </div>

                <!-- Custom items carry no id, and two of them can share a label, so rows are keyed by index and the open folder is tracked by reference. -->
                <template v-for="(item, index) in customItems" :key="'custom-' + index">
                    <MainMenuRailItem
                        v-if="item.items && item.items.length"
                        :label="translate(item.label)"
                        :icon="normalizeMenuIcon(item.iconCls, 'folder')"
                        :image-src="item.custIcon"
                        :expanded="expanded"
                        show-chevron
                        has-popup
                        :popup-open="openFolder === item"
                        :active="openFolder === item || containsRoute(item.items, $route.path)"
                    >
                        <q-menu :model-value="openFolder === item" class="kn-main-menu-popup" anchor="top right" self="top left" :offset="[8, 0]" @update:model-value="(open) => (openFolder = open ? item : null)">
                            <MainMenuFolderMenu :folder="item" :translate="translate" @activate="onFolderActivate" @close="openFolder = null" />
                        </q-menu>
                    </MainMenuRailItem>

                    <MainMenuRailItem
                        v-else
                        :label="translate(item.label)"
                        :icon="normalizeMenuIcon(item.iconCls)"
                        :image-src="item.custIcon"
                        :link="getMenuLink(item)"
                        :expanded="expanded"
                        :active="isRouteActive($route.path, item.to)"
                        :disabled="!isItemClickable(item)"
                        @activate="onActivate(item)"
                    />
                </template>
            </div>

            <div class="kn-main-menu__zone kn-main-menu__zone--bottom">
                <MainMenuRailItem :label="$t('menu.guidedTour')" icon="fas fa-question-circle" :expanded="expanded" tour-id="menu-action-guidedTour" @activate="runCommand('guidedTour')" />

                <template v-if="showChatbot">
                    <MainMenuRailItem :label="$t('ai.title')" icon="smart_toy" :expanded="expanded" tour-id="menu-action-aiAssistant" @activate="($refs.chatbot as any)?.toggleChatbot()" />
                </template>

                <div class="kn-main-menu__account" data-tour-id="menu-profile">
                    <button type="button" class="kn-main-menu__account-btn" :class="{ 'kn-main-menu__account-btn--active': accountOpen }" :aria-label="$t('menu.account')" aria-haspopup="menu" :aria-expanded="accountOpen">
                        <span class="kn-main-menu__avatar-cell"><span class="kn-main-menu__avatar">{{ initials }}</span></span>
                        <span class="kn-main-menu__account-text">
                            <span class="kn-main-menu__account-name">{{ user.fullName || user.userId }}</span>
                            <span class="kn-main-menu__account-sub">{{ user.userId }} · {{ user.sessionRole || $t('role.defaultRolePlaceholder') }}</span>
                        </span>
                        <q-menu v-model="accountOpen" class="kn-main-menu-popup" anchor="bottom right" self="bottom left" :offset="[8, 0]" @hide="accountView = 'main'">
                            <MainMenuAccountMenu
                                v-model:view="accountView"
                                :common-items="accountCommonItems"
                                :my-account-item="myAccountItem"
                                :role-mandatory="isRoleMandatory"
                                :translate="translate"
                                @activate="onAccountActivate"
                                @language-changed="reloadLanguage"
                                @close="accountOpen = false"
                            />
                        </q-menu>
                    </button>
                </div>
            </div>
        </div>

        <div class="kn-main-menu__scrim" aria-hidden="true"></div>

        <KnChatbot v-if="showChatbot" ref="chatbot" hide-trigger />

        <InfoDialog v-model:visibility="infoVisible"></InfoDialog>
        <RoleDialog v-model:visibility="roleDialogVisible" :mandatory="isRoleMandatory"></RoleDialog>
        <DownloadsDialog v-model:visibility="downloadsVisible"></DownloadsDialog>
        <NewsDialog v-model:visibility="newsVisible"></NewsDialog>
        <LicenseDialog v-if="hasLicenseManagement" v-model:visibility="licenseVisible"></LicenseDialog>
        <AccountDialog :visible="accountDialogVisible" @closed="accountDialogVisible = !accountDialogVisible"></AccountDialog>
    </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import mainStore from '@/App.store'
import auth from '@/helpers/commons/authHelper'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { normalizeExternalUrl, normalizeMenuLocale } from '@/helpers/commons/menuHelper'
import AccountDialog from '@/modules/mainMenu/dialogs/AccountDialog.vue'
import DownloadsDialog from '@/modules/mainMenu/dialogs/DownloadsDialog/DownloadsDialog.vue'
import InfoDialog from '@/modules/mainMenu/dialogs/InfoDialog.vue'
import KnChatbot from '@/components/UI/KnChatbot/KnChatbot.vue'
import LicenseDialog from '@/modules/mainMenu/dialogs/LicenseDialog/LicenseDialog.vue'
import MainMenuAccountMenu from '@/modules/mainMenu/MainMenuAccountMenu.vue'
import MainMenuFolderMenu from '@/modules/mainMenu/MainMenuFolderMenu.vue'
import MainMenuModulesPanel from '@/modules/mainMenu/MainMenuModulesPanel.vue'
import MainMenuRailItem from '@/modules/mainMenu/MainMenuRailItem.vue'
import NewsDialog from '@/modules/mainMenu/dialogs/NewsDialog/NewsDialog.vue'
import RoleDialog from '@/modules/mainMenu/dialogs/RoleDialog.vue'
import type { IMenuGroup, IMenuItem } from '@/modules/mainMenu/MainMenu'
import { containsRoute, getInitials, getMenuLink, isHomeItem, isItemClickable, isMyAccountItem, isRouteActive, normalizeMenuIcon, translateMenuLabel } from '@/modules/mainMenu/MainMenuHelpers'

// Hover intent: the menu opens only after the pointer rests on it and closes only after the pointer stays away, so a quick pass across the rail does not flicker it.
// The theme sets the delay through --kn-mainmenu-hover-delay (ms or s).
const DEFAULT_HOVER_DELAY = 300

function getHoverDelay(): number {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--kn-mainmenu-hover-delay').trim()
    const amount = parseFloat(value)
    if (!Number.isFinite(amount) || amount < 0) return DEFAULT_HOVER_DELAY
    return /^[\d.]+s$/.test(value) ? amount * 1000 : amount
}

export default defineComponent({
    name: 'kn-main-menu',
    components: {
        AccountDialog,
        DownloadsDialog,
        InfoDialog,
        KnChatbot,
        LicenseDialog,
        MainMenuAccountMenu,
        MainMenuFolderMenu,
        MainMenuModulesPanel,
        MainMenuRailItem,
        NewsDialog,
        RoleDialog
    },
    data() {
        return {
            technicalUserFunctionalities: [] as IMenuGroup[],
            commonUserFunctionalities: [] as IMenuItem[],
            allowedUserFunctionalities: [] as IMenuItem[],
            dynamicUserFunctionalities: [] as IMenuItem[],
            expanded: false,
            pointerInside: false,
            keyboardFocusInside: false,
            hoverTimer: null as ReturnType<typeof setTimeout> | null,
            modulesOpen: false,
            accountOpen: false,
            accountView: 'main' as 'main' | 'role' | 'language',
            openFolder: null as IMenuItem | null,
            infoVisible: false,
            roleDialogVisible: false,
            downloadsVisible: false,
            newsVisible: false,
            licenseVisible: false,
            accountDialogVisible: false,
            publicPath: import.meta.env.VITE_PUBLIC_PATH
        }
    },
    computed: {
        ...mapState(mainStore, ['configurations', 'user', 'downloads', 'news', 'locale', 'isEnterpriseValid', 'documentExecution']),
        anyPopupOpen(): boolean {
            return this.modulesOpen || this.accountOpen || !!this.openFolder
        },
        hasTenantLogo(): boolean {
            return !!this.user?.organizationImageb64
        },
        logoSrc(): string {
            return this.user?.organizationImageb64 || this.publicPath + '/images/commons/logo_knowage.svg'
        },
        modules(): IMenuGroup[] {
            return this.technicalUserFunctionalities ?? []
        },
        homeItem(): IMenuItem | null {
            return this.commonUserFunctionalities.find(isHomeItem) ?? null
        },
        railAllowedItems(): IMenuItem[] {
            return this.allowedUserFunctionalities.filter((item) => !isMyAccountItem(item) && this.isItemVisible(item))
        },
        myAccountItem(): IMenuItem | null {
            return this.allowedUserFunctionalities.find(isMyAccountItem) ?? null
        },
        customItems(): IMenuItem[] {
            return [...this.dynamicUserFunctionalities].sort((a, b) => (a.prog ?? 0) - (b.prog ?? 0))
        },
        accountCommonItems(): IMenuItem[] {
            return this.commonUserFunctionalities.filter((item) => !isHomeItem(item) && this.isItemVisible(item))
        },
        initials(): string {
            return getInitials(this.user?.fullName || this.user?.userId)
        },
        isRoleMandatory(): boolean {
            return String(this.getConfigurations('KNOWAGE.MANDATORY-ROLE') ?? '').toLowerCase() === 'true' && this.user?.roles?.length > 1 && !this.user?.defaultRole
        },
        hasLicenseManagement(): boolean {
            return !!this.user?.functionalities?.includes(UserFunctionalitiesConstants.LICENSE_MANAGEMENT)
        },
        showChatbot(): boolean {
            return !!(this.isEnterpriseValid && this.configurations?.['KNOWAGE.AI.URL'] && this.user?.functionalities?.includes('EngGPTIntegration'))
        },
        isModulesRouteActive(): boolean {
            return this.modules.some((group) => containsRoute(group.items, this.$route.path))
        },
        offsetValue(): string {
            if (this.documentExecution?.embed) return '0px'
            // The expanded menu overlays the page, so the page always keeps the rail width.
            return 'var(--kn-mainmenu-width)'
        }
    },
    watch: {
        offsetValue: {
            immediate: true,
            handler(value: string) {
                document.documentElement.style.setProperty('--kn-mainmenu-offset', value)
            }
        },
        anyPopupOpen(value: boolean) {
            // A popup keeps the menu open. When the last popup closes and the pointer is away, the menu closes too.
            if (!value) this.scheduleCollapse()
        },
        $route() {
            this.closePopups()
            this.collapse()
        },
        isRoleMandatory: {
            immediate: true,
            handler(value: boolean) {
                if (value) this.roleDialogVisible = true
            }
        }
    },
    async mounted() {
        document.addEventListener('keydown', this.onDocumentKeydown)
        await this.loadMenu()
        if (this.user?.requiresPasswordChange) this.accountDialogVisible = true
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.onDocumentKeydown)
        this.clearHoverTimer()
        document.documentElement.style.setProperty('--kn-mainmenu-offset', '0px')
    },
    methods: {
        ...mapActions(mainStore, ['setLoading', 'getConfigurations']),
        normalizeMenuIcon,
        getMenuLink,
        isRouteActive,
        containsRoute,
        isItemClickable,
        translate(label: string | undefined): string {
            return translateMenuLabel(
                label,
                (key) => this.$t(key) as string,
                (key) => this.$te(key),
                (key) => this.$internationalization(key)
            )
        },
        getTourId(item: IMenuItem): string | undefined {
            if (item.command) return 'menu-action-' + item.command
            if (item.conditionedView) return 'menu-conditioned-' + item.conditionedView
            return undefined
        },
        isItemVisible(item: IMenuItem): boolean {
            if (!item.conditionedView) return true
            if ((item.conditionedView === 'downloads' && this.configurations['KNOWAGE.DOWNLOAD.MANUAL_REFRESH']) || (item.conditionedView === 'downloads' && this.downloads && this.downloads.count.total > 0)) return true
            if (item.conditionedView === 'news' && this.news && this.news.count.total > 0) return true
            // The role row stays in the account menu for every user. A user with one role still picks between that role and the default.
            if (item.conditionedView === 'roleSelection') return true
            return false
        },
        getBadge(item: IMenuItem): number {
            if (item.conditionedView === 'downloads') {
                if (Object.keys(this.downloads).length !== 0) return this.downloads.count.total - this.downloads.count.alreadyDownloaded
            } else if (item.conditionedView === 'news') {
                if (Object.keys(this.news).length !== 0) return this.news.count.unread
            }
            return 0
        },
        closePopups() {
            this.modulesOpen = false
            this.accountOpen = false
            this.openFolder = null
        },
        onDocumentKeydown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return
            if (this.anyPopupOpen) return
            if (this.expanded) this.collapse()
        },
        clearHoverTimer() {
            if (this.hoverTimer) clearTimeout(this.hoverTimer)
            this.hoverTimer = null
        },
        onPointerEnter() {
            this.pointerInside = true
            this.clearHoverTimer()
            if (!this.expanded) this.hoverTimer = setTimeout(() => (this.expanded = true), getHoverDelay())
        },
        onPointerLeave() {
            this.pointerInside = false
            this.scheduleCollapse()
        },
        onFocusIn(event: FocusEvent) {
            // Keyboard focus opens the menu at once. A mouse click also focuses a row, but hover already handles the mouse.
            const target = event.target as HTMLElement | null
            if (!target?.matches?.(':focus-visible')) return
            this.keyboardFocusInside = true
            this.clearHoverTimer()
            this.expanded = true
        },
        onFocusOut(event: FocusEvent) {
            if (this.$el.contains(event.relatedTarget as Node | null)) return
            this.keyboardFocusInside = false
            this.scheduleCollapse()
        },
        scheduleCollapse() {
            this.clearHoverTimer()
            if (!this.expanded || this.pointerInside || this.keyboardFocusInside || this.anyPopupOpen) return
            this.hoverTimer = setTimeout(() => {
                if (!this.pointerInside && !this.keyboardFocusInside && !this.anyPopupOpen) this.expanded = false
            }, getHoverDelay())
        },
        collapse() {
            this.clearHoverTimer()
            this.keyboardFocusInside = false
            this.expanded = false
        },
        onActivate(item: IMenuItem) {
            if (item.command) {
                this.runCommand(item.command)
                return
            }
            const target = item.target ?? item.hrefTarget
            if (item.url && target === 'insideKnowage') this.$router.push({ name: 'externalUrl', query: { url: normalizeExternalUrl(item.url) } })
        },
        runCommand(command: string) {
            switch (command) {
                case 'info':
                    this.infoVisible = true
                    break
                case 'logout':
                    auth.logout()
                    break
                case 'newsSelection':
                    this.newsVisible = true
                    break
                case 'downloadsSelection':
                    this.downloadsVisible = true
                    break
                case 'licenseSelection':
                    this.licenseVisible = true
                    break
                case 'guidedTour':
                    this.closePopups()
                    ;(window as any).startKnowageTour?.()
                    break
                case 'languageSelection':
                    this.openAccount('language')
                    break
                case 'roleSelection':
                    this.openAccount('role')
                    break
                default:
                    break
            }
        },
        openAccount(view: 'main' | 'role' | 'language') {
            this.accountView = view
            this.accountOpen = true
        },
        onAccountActivate(item: IMenuItem) {
            this.accountOpen = false
            this.onActivate(item)
        },
        onModuleActivate(item: IMenuItem) {
            this.modulesOpen = false
            this.onActivate(item)
        },
        onFolderActivate(item: IMenuItem) {
            this.openFolder = null
            this.onActivate(item)
        },
        async reloadLanguage() {
            await this.loadMenu(true)
        },
        async loadMenu(recursive = false) {
            this.setLoading(true)
            const fallbackLocale = this.$i18n.fallbackLocale.toString()
            const currentLocale = localStorage.getItem('locale') || this.locale || fallbackLocale
            const normalizedLocale = normalizeMenuLocale(currentLocale, fallbackLocale)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/3.0/menu/enduser?locale=' + encodeURIComponent(normalizedLocale))
                .then((response: AxiosResponse<any>) => {
                    this.technicalUserFunctionalities = response.data.technicalUserFunctionalities ?? []
                    this.commonUserFunctionalities = response.data.commonUserFunctionalities ?? []
                    this.allowedUserFunctionalities = response.data.allowedUserFunctionalities ?? []
                    this.dynamicUserFunctionalities = response.data.dynamicUserFunctionalities ?? []
                })
                .catch(() => {
                    if (recursive) auth.logout()
                    else this.loadMenu(true)
                })
                .finally(() => {
                    this.setLoading(false)
                })
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-main-menu {
    position: relative;
    z-index: 9000;
    flex: 0 0 auto;
    width: var(--kn-mainmenu-width);
    height: 100%;
}
.kn-main-menu__rail {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--kn-mainmenu-width);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--kn-mainmenu-background-color);
    transition:
        width 200ms ease-out,
        box-shadow 200ms ease-out;
    .kn-main-menu--expanded & {
        width: var(--kn-mainmenu-expanded-width);
        box-shadow: 4px 0 16px rgba(0, 0, 0, 0.35);
    }
    /* A border on the page side, in the separator color. It sits above the rows and takes no layout space, so the icons do not move. */
    &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
        width: var(--kn-mainmenu-border-width);
        background: rgba(255, 255, 255, 0.12);
        pointer-events: none;
    }
}
.kn-main-menu__header {
    flex: 0 0 var(--kn-mainmenu-width);
    height: var(--kn-mainmenu-width);
    display: flex;
    align-items: center;
}
.kn-main-menu__logo-cell {
    position: relative;
    flex: 0 0 var(--kn-mainmenu-width);
    width: var(--kn-mainmenu-width);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.kn-main-menu__logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border: 2px solid var(--kn-mainmenu-avatar-border-color);
    border-radius: var(--kn-mainmenu-avatar-border-radius);
    background-color: var(--kn-mainmenu-avatar-background-color);
}
.kn-main-menu__brand {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--kn-mainmenu-icon-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-main-menu__zone {
    flex: 0 0 auto;
    padding: 4px 0;
}
/* The top zone and the middle zone hold one list. They keep no gap between them. */
.kn-main-menu__zone--top {
    padding-bottom: 0;
}
.kn-main-menu__zone--middle {
    flex: 1 1 auto;
    min-height: 0;
    padding-top: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--kn-mainmenu-hover-background-color) transparent;
    background:
        linear-gradient(var(--kn-mainmenu-background-color) 30%, transparent) center top / 100% 24px no-repeat local,
        linear-gradient(transparent, var(--kn-mainmenu-background-color) 70%) center bottom / 100% 24px no-repeat local,
        radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, 0.5), transparent) center top / 100% 10px no-repeat scroll,
        radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, 0.5), transparent) center bottom / 100% 10px no-repeat scroll;
    background-color: var(--kn-mainmenu-background-color);
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background: var(--kn-mainmenu-hover-background-color);
    }
}
.kn-main-menu__zone--bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.kn-main-menu__account-btn {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 52px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--kn-mainmenu-icon-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
    &:hover,
    &--active {
        background: var(--kn-mainmenu-hover-background-color);
    }
    &:focus-visible {
        outline: 2px solid var(--kn-mainmenu-highlight-color);
        outline-offset: -2px;
    }
}
.kn-main-menu__avatar-cell {
    flex: 0 0 var(--kn-mainmenu-width);
    width: var(--kn-mainmenu-width);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.kn-main-menu__avatar {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--kn-mainmenu-highlight-color);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
}
.kn-main-menu__account-text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding-right: 12px;
    opacity: 0;
    transition: opacity 150ms;
}
.kn-main-menu--expanded .kn-main-menu__account-text {
    opacity: 1;
}
.kn-main-menu__account-name {
    font-size: 13px;
    line-height: 16px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-main-menu__account-sub {
    font-size: 11px;
    line-height: 14px;
    opacity: 0.7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.kn-main-menu__separator {
    position: relative;
    height: 28px;
    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 12px;
        right: 12px;
        height: 1px;
        background: rgba(255, 255, 255, 0.12);
    }
}
.kn-main-menu--expanded .kn-main-menu__separator::before {
    display: none;
}
.kn-main-menu__separator-label {
    position: absolute;
    left: 20px;
    right: 12px;
    bottom: 6px;
    font-size: 11px;
    line-height: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--kn-mainmenu-icon-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    transition: opacity 150ms;
}
.kn-main-menu--expanded .kn-main-menu__separator-label {
    opacity: 0.6;
}
/* Modal expand: the page dims behind the expanded menu. The theme turns it on through the scrim color, which is transparent by default. */
.kn-main-menu__scrim {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: var(--kn-mainmenu-width);
    z-index: -1;
    background: var(--kn-mainmenu-scrim-color);
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease-out;
}
.kn-main-menu--expanded .kn-main-menu__scrim {
    opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
    .kn-main-menu__scrim,
    .kn-main-menu__rail,
    .kn-main-menu__separator-label,
    .kn-main-menu__account-text {
        transition: none;
    }
}
</style>

<style lang="scss">
.kn-main-menu-popup {
    border-radius: 8px;
    background: var(--kn-mainmenu-panel-color);
    color: var(--kn-mainmenu-panel-text-color);
}
</style>
