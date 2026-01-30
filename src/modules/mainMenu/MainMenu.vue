<template>
    <div id="kn-main-menu" ref="mainMenu" class="layout-menu-container">
        <InfoDialog v-model:visibility="display"></InfoDialog>
        <LanguageDialog v-model:visibility="languageDisplay" @language-changed="reloadLanguage"></LanguageDialog>
        <RoleDialog v-model:visibility="roleDisplay" :mandatory="mandatoryRole()"></RoleDialog>
        <DownloadsDialog v-model:visibility="downloadsDisplay"></DownloadsDialog>
        <NewsDialog v-model:visibility="newsDisplay"></NewsDialog>
        <LicenseDialog v-if="user && user.functionalities?.includes(UserFunctionalitiesConstants.LICENSE_MANAGEMENT)" v-model:visibility="licenseDisplay"></LicenseDialog>
        <AccountDialog :visible="accountDisplay" @closed="accountManagement"></AccountDialog>
        <MainMenuAdmin v-if="technicalUserFunctionalities && technicalUserFunctionalities.length > 0" :opened-panel-event="adminMenuOpened" :model="technicalUserFunctionalities" @click="itemClick"></MainMenuAdmin>
        <q-menu ref="menu" :target="menuTargetElem" :anchor="anchorPosition" self="top left" data-test="menu">
            <MainMenuTieredMenu :items="selectedCustomMenu" @link="itemClick"></MainMenuTieredMenu>
        </q-menu>
        <div ref="menuProfile" class="profile" data-tour-id="menu-profile">
            <button v-tooltip="user && user.fullName" class="p-link" @click="toggleProfile">
                <img alt="Profile" class="profile-image" :src="getProfileImage(user)" />
                <span v-if="user" class="profile-name">{{ user.fullName }}</span>
                <i class="pi pi-fw pi-chevron-down"></i>
                <span class="profile-role">Marketing</span>
            </button>
        </div>
        <div ref="menuScroll" class="menu-scroll-content">
            <transition :name="transitionType">
                <ul v-show="showProfileMenu" ref="menuProfileSlide" class="layout-menu profile-menu">
                    <template v-for="(item, i) of commonUserFunctionalities" :key="i">
                        <template v-if="item">
                            <AdvancedMenuItem :item="item" :badge="getBadgeValue(item)" @click="itemClick" @mouseover="setMenu(item)"></AdvancedMenuItem>
                        </template>
                    </template>
                </ul>
            </transition>
            <ul class="layout-menu" data-tour-id="menu-items">
                <li v-if="technicalUserFunctionalities && technicalUserFunctionalities.length > 0" role="menu" @click="toggleAdminMenu">
                    <span :class="['p-menuitem-icon', 'fas fa-cog']"></span>
                </li>
                <template v-for="(item, i) of allowedUserFunctionalities" :key="i">
                    <AdvancedMenuItem :item="item" :badge="getBadgeValue(item)" @click="itemClick" @mouseover="setMenu(item)"></AdvancedMenuItem>
                </template>
                <template v-for="(item, i) of dynamicUserFunctionalities" :key="i">
                    <AdvancedMenuItem :item="item" :badge="getBadgeValue(item)" @click="itemClick" @mouseover="setMenu(item)"></AdvancedMenuItem>
                    <!--MainMenuItem :item="item" :internationalize="true" @click="itemClick" @mouseover="toggleMenu($event, item)"></MainMenuItem-->
                </template>
            </ul>
        </div>

        <!-- Menu footer actions (same place as AI button) -->
        <div>
            <AdvancedMenuItem
                :item="{ label: $t('menu.guidedTour'), iconCls: 'fas fa-route', command: 'guidedTour', visible: true }"
                :badge="0"
                @click="itemClick"
            />
            <KnChatbot v-if="isEnterpriseValid && configurations['KNOWAGE.AI.URL'] && user?.functionalities.includes('EngGPTIntegration')" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import InfoDialog from '@/modules/mainMenu/dialogs/InfoDialog.vue'
import KnChatbot from '@/components/UI/KnChatbot/KnChatbot.vue'
import MainMenuAdmin from '@/modules/mainMenu/MainMenuAdmin.vue'
import AccountDialog from '@/modules/mainMenu/dialogs/AccountDialog.vue'
import LanguageDialog from '@/modules/mainMenu/dialogs/LanguageDialog/LanguageDialog.vue'
import LicenseDialog from '@/modules/mainMenu/dialogs/LicenseDialog/LicenseDialog.vue'
import NewsDialog from '@/modules/mainMenu/dialogs/NewsDialog/NewsDialog.vue'
import RoleDialog from '@/modules/mainMenu/dialogs/RoleDialog.vue'
import { mapState, mapActions } from 'pinia'
import auth from '@/helpers/commons/authHelper'
import { AxiosResponse } from 'axios'
import DownloadsDialog from '@/modules/mainMenu/dialogs/DownloadsDialog/DownloadsDialog.vue'
import { IMenuItem } from '@/modules/mainMenu/MainMenu'
import MainMenuTieredMenu from '@/modules/mainMenu/MainMenuTieredMenu.vue'
import ScrollPanel from 'primevue/scrollpanel'
import mainStore from '../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import AdvancedMenuItem from '@/modules/mainMenu/AdvancedMenuItem.vue'

export default defineComponent({
    name: 'knmenu',
    components: {
        AccountDialog,
        AdvancedMenuItem,
        InfoDialog,
        MainMenuAdmin,
        LanguageDialog,
        LicenseDialog,
        KnChatbot,
        NewsDialog,
        RoleDialog,
        DownloadsDialog,
        MainMenuTieredMenu,
        ScrollPanel
    },
    emits: ['update:visibility', 'openMenu'],
    props: ['closeMenu'],
    data() {
        return {
            adminMenuOpened: false,
            showProfileMenu: false,
            dynamicUserFunctionalities: new Array<IMenuItem>(),
            allowedUserFunctionalities: new Array<IMenuItem>(),
            commonUserFunctionalities: new Array<IMenuItem>(),
            technicalUserFunctionalities: new Array<IMenuItem>(),
            UserFunctionalitiesConstants,
            tieredMenuClass: 'largeScreen',
            display: false,
            languageDisplay: false,
            roleDisplay: false,
            downloadsDisplay: false,
            newsDisplay: false,
            licenseDisplay: false,
            selectedCustomMenu: {},
            menuTargetElem: '' as any,
            accountDisplay: false,
            publicPath: import.meta.env.VITE_PUBLIC_PATH,
            windowWidth: 0,
            anchorPosition: 'bottom right'
        }
    },
    computed: {
        ...mapState(mainStore, {
            configurations: 'configurations',
            user: 'user',
            downloads: 'downloads',
            locale: 'locale',
            news: 'news',
            stateHomePage: 'homePage',
            isEnterprise: 'isEnterprise',
            isEnterpriseValid: 'isEnterpriseValid',
            licenses: 'licenses',
            menuOpened: 'menuOpened'
        }),
        isPortrait(): boolean | undefined {
            return this.windowWidth <= 1025
        },
        transitionType(): string | undefined {
            if (this.isPortrait) return 'slide-right'
            else return 'slide-down'
        }
    },
    watch: {
        news() {
            const orig = JSON.parse(JSON.stringify(this.allowedUserFunctionalities))
            this.setConditionedVisibility(orig)
        },
        closeMenu(newProp) {
            // @ts-ignore
            if (newProp) this.$refs.menu.hide()
        },
        isPortrait() {
            if (this.isPortrait) this.anchorPosition = 'bottom left'
            else this.anchorPosition = 'top right'
        },
        menuOpened(newProp) {
            if (newProp === false) {
                this.$refs.menu.hide()
            }
        }
    },
    async mounted() {
        await this.loadMenu()
        this.windowWidth = window.innerWidth
        this.$nextTick(() => {
            window.addEventListener('resize', this.updateWindowWidth)
        })
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.updateWindowWidth)
    },
    methods: {
        ...mapActions(mainStore, ['setHomePage', 'setLoading', 'getConfigurations', 'toggleMenuOpened']),
        accountManagement() {
            this.accountDisplay = !this.accountDisplay
        },
        mandatoryRole() {
            if (this.getConfigurations('KNOWAGE.MANDATORY-ROLE') && this.getConfigurations('KNOWAGE.MANDATORY-ROLE').toLowerCase() === 'true' && this.user.roles.length > 1 && !this.user.defaultRole) {
                this.roleDisplay = true
                return true
            }
            return false
        },
        info() {
            this.display = !this.display
        },
        logout() {
            auth.logout()
        },
        roleSelection() {
            this.roleDisplay = !this.roleDisplay
        },
        downloadsSelection() {
            this.downloadsDisplay = !this.downloadsDisplay
        },
        isItemToDisplay(item) {
            if (item.conditionedView) {
                if ((item.conditionedView === 'downloads' && this.configurations['KNOWAGE.DOWNLOAD.MANUAL_REFRESH']) || (item.conditionedView === 'downloads' && this.downloads && this.downloads.count.total > 0)) return true
                if (item.conditionedView === 'news' && this.news && this.news.count.total > 0) return true
                if (item.conditionedView === 'roleSelection' && this.user && this.user.roles && this.user.roles.length > 1) return true
                return false
            } else {
                return true
            }
        },
        languageSelection() {
            this.languageDisplay = !this.languageDisplay
        },
        newsSelection() {
            this.newsDisplay = !this.newsDisplay
        },
        licenseSelection() {
            this.licenseDisplay = !this.licenseDisplay
        },
        itemClick(event) {
            const item = event.item ? event.item : event
            if (item.label === 'Home' && this.user?.configuration && this.user.configuration['home.button.url']) {
                location.replace(this.user?.configuration['home.button.url'])
            }
            if (item.command) {
                this[item.command]()
            } else if (item.to) {
                if (event.navigate) event.navigate(event.originalEvent)
            } else if (item.url && (!item.target || item.target === 'insideKnowage')) this.$router.push({ name: 'externalUrl', params: { url: item.url } })
            if (this.adminMenuOpened) this.adminMenuOpened = false
            this.hideItemMenu()
        },
        getHref(item) {
            let to = item.to
            if (to) {
                to = to.replace(/\\\//g, '/')
                if (to.startsWith('/')) to = to.substring(1)
                return import.meta.env.VITE_PUBLIC_PATH + to
            } else return to
        },
        toggleProfile() {
            this.showProfileMenu = !this.showProfileMenu
        },
        toggleAdminMenu(event) {
            this.adminMenuOpened = this.adminMenuOpened === false ? event : false
        },
        getProfileImage(user) {
            if (user && user.organizationImageb64) return user.organizationImageb64
            return this.publicPath + '/images/commons/logo_knowage.svg'
        },
        updateNewsAndDownload() {
            for (const idx in this.allowedUserFunctionalities) {
                const menu = this.allowedUserFunctionalities[idx] as any
                menu.visible = this.isItemToDisplay(menu)
                menu.badge = this.getBadgeValue(menu)
            }
        },
        getBadgeValue(item) {
            if (item.conditionedView === 'downloads') {
                if (Object.keys(this.downloads).length !== 0) return this.downloads.count.total - this.downloads.count.alreadyDownloaded
            } else if (item.conditionedView === 'news') {
                if (Object.keys(this.news).length !== 0) return this.news.count.unread
            }
            return 0
        },
        findHomePage(dynMenu) {
            for (const item of dynMenu) {
                const hasUrl = 'to' in item || 'url' in item

                if (hasUrl) return item

                if (item.items?.length) {
                    const found = this.findHomePage(item.items)
                    if (found) return found
                }
            }
            return null
        },
        toggleMenu(event, item) {
            this.hideItemMenu()

            if (item.items) {
                this.$emit('openMenu')
                this.menuTargetElem = document.querySelector(`li[role="menu"][label="${item.label}"]`)
                this.selectedCustomMenu = item.items
                // @ts-ignore
                this.$refs.menu.show()
                this.toggleMenuOpened(true)
            }
        },
        hideItemMenu() {
            // @ts-ignore
            this.$refs.menu.hide()
        },
        cleanTo(item): any {
            return item.to.replace(/\\\//g, '/')
        },
        async loadMenu(recursive = false) {
            this.setLoading(true)
            let localObject = { locale: this.$i18n.fallbackLocale.toString() }
            if (Object.keys(this.locale).length !== 0) localObject = { locale: this.locale }
            if (localStorage.getItem('locale')) {
                localObject = { locale: localStorage.getItem('locale') || this.$i18n.fallbackLocale.toString() }
            }
            localObject.locale = localObject.locale.replaceAll('_', '-')
            // script handling
            const splittedLocale = localObject.locale.split('-')
            if (splittedLocale.length > 2) {
                localObject.locale = splittedLocale[0] + '-' + splittedLocale[2].replaceAll('#', '') + '-' + splittedLocale[1]
            }
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/3.0/menu/enduser?locale=' + encodeURIComponent(localObject.locale))
                .then((response: AxiosResponse<any>) => {
                    this.technicalUserFunctionalities = response.data.technicalUserFunctionalities
                    this.setConditionedVisibility(response.data.allowedUserFunctionalities)
                    this.dynamicUserFunctionalities = response.data.dynamicUserFunctionalities.sort((el1, el2) => {
                        return el1.prog - el2.prog
                    })
                    if (this.dynamicUserFunctionalities.length > 0) {
                        const homePage = this.findHomePage(this.dynamicUserFunctionalities) || {}
                        if (homePage && Object.keys(homePage).length !== 0) {
                            if (!this.stateHomePage.label) {
                                this.setHomePage(homePage)
                            }
                        } else this.setHomePage({ loading: false })
                    } else this.setHomePage({ loading: false })
                    this.commonUserFunctionalities = []
                    const responseCommonUserFunctionalities = response.data.commonUserFunctionalities
                    for (const index in responseCommonUserFunctionalities) {
                        const item = responseCommonUserFunctionalities[index]
                        item.visible = this.isItemToDisplay(item)
                        if (parseInt(index) == 0 && this.stateHomePage?.to) item.to = this.stateHomePage.to.replaceAll('\\/', '/')
                        this.commonUserFunctionalities.push(item)
                    }

                    // NOTE: guided tour entry comes from backend "static menu" (commonUserFunctionalities).
                    // We don't inject extra client-side buttons here.

                    this.updateNewsAndDownload()
                })
                .catch(() => {
                    if (recursive) this.logout()
                    else this.loadMenu(true)
                })
                .finally(() => {
                    this.setLoading(false)
                })
        },
        setConditionedVisibility(responseAllowedUserFunctionalities) {
            this.allowedUserFunctionalities = []
            for (const idx in responseAllowedUserFunctionalities) {
                const item = responseAllowedUserFunctionalities[idx]
                item.visible = this.isItemToDisplay(item)
                this.allowedUserFunctionalities.push(item)
            }
        },
        updateWindowWidth() {
            this.windowWidth = window.innerWidth
        },
        setMenu(item) {
            this.dynamicUserFunctionalities = this.dynamicUserFunctionalities.map((el) => {
                if (el.label === item.label) {
                    el.visible = true
                } else {
                    el.visible = false
                }
                return el
            })
        },
        async reloadLanguage() {
            await this.loadMenu(true)
        },
        reloadGuidedTour() {
            // no-op placeholder if needed
        },
        guidedTour() {
            // Backend sends command="guidedTour". We map it to the existing tour starter.
            this.startGuidedTour()
        },
        startGuidedTour() {
            // Close profile dropdown first to avoid overlay issues
            this.showProfileMenu = false

            const w = window as any
            if (w.__knowageTourRunning) return

            if (typeof w.startKnowageTour === 'function') {
                w.startKnowageTour()
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.slide-down-enter-active,
.slide-down-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
    transition: transform 0.3s ease-in-out;
}
.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-100%);
}
.slide-right-enter-from,
.slide-right-leave-to {
    transform: translateX(-100%);
}

.p-scrollpanel:deep(.p-scrollpanel-content) {
    padding: 0 0 18px 0;
}
.itemSection {
    cursor: pointer;
}
.layout-menu-container {
    z-index: 9000;
    width: var(--kn-mainmenu-width);
    height: 100%;
    background-color: var(--kn-mainmenu-background-color);
    position: fixed;
    display: flex;
    flex-direction: column;
    .menu-scroll-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        ::-webkit-scrollbar {
            width: 3px;
        }
        ::-webkit-scrollbar-thumb {
            border-radius: 10rem;
            border: 1px solid var(--kn-mainmenu-hover-background-color);
            background: var(--kn-mainmenu-hover-background-color);
        }
    }
    .profile {
        height: 60px;
        padding: 8px;
        box-shadow: var(--kn-mainmenu-profile-box-shadow);
        & > button {
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            font-family: var(--kn-font-family);
            .profile-image {
                width: 45px;
                height: 45px;
                float: right;
                margin-left: 4px;
                border-radius: var(--kn-mainmenu-avatar-border-radius);
                border: 2px solid var(--kn-mainmenu-avatar-border-color);
                background-color: var(--kn-mainmenu-avatar-background-color);
            }
            .profile-name,
            .profile-role,
            i {
                display: none;
            }
        }
    }
    .profile-menu {
        border-bottom: 1px solid var(--kn-mainmenu-hover-background-color);
        overflow: unset !important;
    }
    .layout-menu {
        margin: 0;
        padding: 0;
        list-style: none;
        overflow-y: scroll;
        li,
        button {
            &:first-child {
                padding-top: 10px;
            }
        }
        & > li,
        & > button {
            position: relative;
            & > a {
                text-align: center;
                padding: 15px;
                color: var(--kn-mainmenu-icon-color);
                display: block;
                width: 100%;
                transition: background-color 0.3s, border-left-color 0.3s;
                overflow: hidden;
                border-left: 4px solid transparent;
                outline: none;
                cursor: pointer;
                user-select: none;
                span {
                    display: none;
                }
                &:hover {
                    background-color: var(--kn-mainmenu-hover-background-color);
                }
            }
            & > span {
                text-decoration: none;
                text-align: center;
                padding: 15px;
                padding-left: 12px;
                color: var(--kn-mainmenu-icon-color);
                display: block;
                width: 100%;
                transition: background-color 0.3s, border-left-color 0.3s;
                overflow: hidden;
                border-left: 4px solid transparent;
                outline: none;
                cursor: pointer;
                user-select: none;
                &:hover {
                    background-color: var(--kn-mainmenu-hover-background-color);
                }
                &.router-link-active {
                    border-left: 3px solid var(--kn-mainmenu-highlight-color);
                }
            }
        }
        &.scrollable {
            overflow-y: auto;
            overflow-x: hidden;
        }
    }
}

@media screen and (max-width: 1025px) {
    .layout-menu-container {
        width: 100%;
        height: var(--kn-mainmenu-width);
        flex-direction: row;

        .profile {
            width: 60px;
            box-shadow: none;
        }
        .menu-scroll-content {
            width: 100%;
            flex-direction: row;
            align-items: center;
            ::-webkit-scrollbar {
                height: 2px;
                width: 0px;
            }
        }
        .layout-menu {
            padding: 0;
            display: grid;
            grid-auto-flow: column;
            align-items: center;
            overflow-x: scroll;
            li {
                &:first-child {
                    padding-top: 3px;
                }
            }
        }
        .profile-menu {
            border-bottom: none;
            border-right: 1px solid var(--kn-mainmenu-hover-background-color);
        }
    }
}

@supports (-moz-appearance: none) {
    .layout-menu-container {
        .layout-menu {
            & > li {
                & > span {
                    width: var(--kn-mainmenu-width);
                    padding-left: 0px;
                    padding-right: 0px;
                }
            }
            &:deep(a[role='menuitem']) {
                width: var(--kn-mainmenu-width);
                padding-left: 0px;
                padding-right: 0px;
            }
        }
    }
}
</style>
