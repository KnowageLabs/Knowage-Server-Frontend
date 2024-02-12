<template>
    <Toast></Toast>
    <ConfirmDialog></ConfirmDialog>
    <KnOverlaySpinnerPanel />
    <div class="layout-wrapper-content" :class="{ 'layout-wrapper-content-embed': documentExecution.embed, isMobileDevice: isMobileDevice }">
        <MainMenu v-if="showMenu && mainMenuVisibility" @menuItemSelected="setSelectedMenuItem" :closeMenu="closedMenu" @openMenu="openMenu"></MainMenu>

        <div class="layout-main" :class="{ hiddenMenu: !mainMenuVisibility }" @click="closeMenu" @blur="closeMenu">
            <router-view :selected-menu-item="selectedMenuItem" :menu-item-clicked-trigger="menuItemClickedTrigger" @click="closeMenu" />
        </div>
    </div>
    <KnRotate v-show="isMobileDevice"></KnRotate>
</template>

<script lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import KnOverlaySpinnerPanel from '@/components/UI/KnOverlaySpinnerPanel.vue'
import KnRotate from '@/components/UI/KnRotate.vue'
import MainMenu from '@/modules/mainMenu/MainMenu'
import Toast from 'primevue/toast'
import { defineComponent } from 'vue'
import mainStore from '@/App.store'
import { mapState, mapActions } from 'pinia'
import WEB_SOCKET from '@/services/webSocket.js'
import themeHelper from '@/helpers/themeHelper/themeHelper'
import { primeVueDate, getLocale } from '@/helpers/commons/localeHelper'
import { loadLanguageAsync } from '@/App.i18n.js'
import auth from '@/helpers/commons/authHelper'

export default defineComponent({
    components: { ConfirmDialog, KnOverlaySpinnerPanel, KnRotate, MainMenu, Toast },

    data() {
        return {
            themeHelper: new themeHelper(),
            selectedMenuItem: null,
            isMobileDevice: false,
            menuItemClickedTrigger: false,
            showMenu: false,
            closedMenu: false,
            pollingInterval: null,
            stopExecution: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            error: 'error',
            info: 'info',
            warning: 'warning',
            user: 'user',
            loading: 'loading',
            localse: 'locale',
            isEnterprise: 'isEnterprise',
            documentExecution: 'documentExecution',
            theme: 'theme',
            defaultTheme: 'defaultTheme',
            mainMenuVisibility: 'mainMenuVisibility'
        })
    },
    watch: {
        error(newError) {
            this.$toast.add({
                severity: 'error',
                summary: newError.title ? this.$t(newError.title) : '',
                detail: newError.msg ? this.$t(newError.msg) : '',
                baseZIndex: typeof newError.baseZIndex == 'undefined' ? 0 : newError.baseZIndex,
                life: typeof newError.duration == 'undefined' ? import.meta.env.VITE_TOAST_DURATION : newError.duration
            })
        },
        info(newInfo) {
            this.$toast.add({
                severity: 'info',
                summary: newInfo.title ? this.$t(newInfo.title) : '',
                detail: newInfo.msg ? this.$t(newInfo.msg) : '',
                baseZIndex: typeof newInfo.baseZIndex == 'undefined' ? 0 : newInfo.baseZIndex,
                life: typeof newInfo.duration == 'undefined' ? import.meta.env.VITE_TOAST_DURATION : newInfo.duration
            })
        },
        warning(newWarning) {
            this.$toast.add({
                severity: 'warn',
                summary: newWarning.title ? this.$t(newWarning.title) : '',
                detail: newWarning.msg ? this.$t(newWarning.msg) : '',
                baseZIndex: typeof newWarning.baseZIndex == 'undefined' ? 0 : newWarning.baseZIndex,
                life: typeof newWarning.duration == 'undefined' ? import.meta.env.VUE_APP_TOAST_DURATION : newWarning.duration
            })
        },
        user() {
            /* if (!oldUser.userId && oldUser != newUser)  */
        }
    },
    async created() {
        const locationParams = new URL(location).searchParams
        let userEndpoint = !localStorage.getItem('token') && locationParams.get('public') ? `/restful-services/3.0/public-user` : '/restful-services/2.0/currentuser'
        if (locationParams.get('organization')) userEndpoint += `?organization=${locationParams.get('organization')}`
        await this.$http
            .get(import.meta.env.VITE_KNOWAGE_CONTEXT + userEndpoint)
            .then(async (response) => {
                const currentUser = response.data
                if (localStorage.getItem('sessionRole')) {
                    currentUser.sessionRole = localStorage.getItem('sessionRole')
                } else if (currentUser.defaultRole) currentUser.sessionRole = currentUser.defaultRole

                this.initializeUser(currentUser)

                const responseLocale = response.data.locale
                let storedLocale = responseLocale
                if (localStorage.getItem('locale')) {
                    storedLocale = localStorage.getItem('locale')
                }
                localStorage.setItem('locale', storedLocale)
                localStorage.setItem('token', response.data.userUniqueIdentifier)

                this.setLocale(storedLocale)
                this.$i18n.locale = storedLocale

                await loadLanguageAsync(localStorage.getItem('locale'))
                // @ts-ignore
                if (this.$i18n.messages[this.$i18n.locale.replaceAll('-', '_')]) {
                    // @ts-ignore
                    this.$primevue.config.locale = { ...this.$primevue.config.locale, ...this.$i18n.messages[this.$i18n.locale.replaceAll('-', '_')].locale }
                }

                this.$primevue.config.locale.dateFormat = primeVueDate(getLocale(true))

                const language = this.$i18n
                const splittedLanguage = language.locale.split('_')

                if (responseLocale !== storedLocale) {
                    let url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/servlet/AdapterHTTP?'
                    url += 'ACTION_NAME=CHANGE_LANGUAGE'
                    url += '&LANGUAGE_ID=' + splittedLanguage[0]
                    url += '&COUNTRY_ID=' + splittedLanguage[1].toUpperCase()
                    url += '&SCRIPT_ID=' + (splittedLanguage.length > 2 ? splittedLanguage[2].replaceAll('#', '') : '')
                    url += '&THEME_NAME=sbi_default'

                    this.setLoading(true)
                    this.$http.get(url).then(
                        () => {
                            this.setLocale(language.locale)
                            localStorage.setItem('locale', language.locale)
                            this.$i18n.locale = language.locale
                        },
                        (error) => console.error(error)
                    )
                } else {
                    this.showMenu = true
                }

                this.setLoading(false)
            })
            .catch((error) => {
                if (error.response.status === 400) {
                    this.$router.replace({ name: 'unauthorized', params: { message: 'unauthorized.invalidRequest' } })
                    this.stopExecution = true
                } else auth.logout()
            })
        if (this.stopExecution) return

        await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/user-configs').then((response: any) => {
            this.checkTopLevelIframe(response.data)
            this.setConfigurations(response.data)
            this.checkOIDCSession(response.data)
        })
        if (this.isEnterprise) {
            if (Object.keys(this.defaultTheme.length === 0)) this.setDefaultTheme(await this.themeHelper.getDefaultKnowageTheme())

            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/license').then((response) => {
                this.setLicenses(response.data)
            })
            if (Object.keys(this.theme).length === 0) {
                this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/thememanagement/current`).then((response) => {
                    this.setTheme(response.data.config)
                    this.themeHelper.setTheme(response.data.config)
                })
            } else {
                this.themeHelper.setTheme(this.theme)
            }
        }

        this.onLoad()
    },

    mounted() {
        if (/Android|iPhone/i.test(navigator.userAgent)) {
            this.isMobileDevice = true
        }
    },

    beforeUnmounted() {
        clearInterval(this.pollingInterval)
    },

    methods: {
        ...mapActions(mainStore, ['setTheme', 'setDefaultTheme', 'setLicenses', 'setConfigurations', 'setLoading', 'setLocale', 'initializeUser', 'setNews', 'setDownloads', 'setInternationalization']),
        closeDialog() {
            this.$emit('update:visibility', false)
        },
        openMenu() {
            this.closedMenu = false
        },
        closeMenu() {
            this.closedMenu = true
        },
        checkTopLevelIframe(configs) {
            if (configs?.['KNOWAGE.EMBEDDING_APPLICATION_VALUE']) {
                if (window.self !== window.top || window.parent.frameElement?.attributes['embedding-application'].value !== configs['KNOWAGE.EMBEDDING_APPLICATION_VALUE']) {
                    this.$router.push({ name: 'unauthorized', params: { message: 'unauthorized.outsideIframe' } })
                }
            }
        },
        checkOIDCSession(configs) {
            if (configs['oidc.session.polling.url']) {
                this.pollingInterval = setInterval(async () => {
                    let url = configs['oidc.session.polling.url']
                    const parametersRegex = /\${(nonce|client_id|redirect_uri|session_state)}/gm
                    url = url.replace(parametersRegex, (match, parameter) => encodeURIComponent(window.sessionStorage.getItem(parameter)))
                    await this.$http.get(url).then((response) => {
                        if (response.status === 302) {
                            const headerLocation = new URL(response.headers.location)
                            if (headerLocation.searchParams.get('error')) auth.logout()
                        }
                    })
                }, configs['oidc.session.polling.interval'] || 15000)
            }
        },
        async onLoad() {
            this.showMenu = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/export/dataset').then((response) => {
                const totalDownloads = response.data.length
                const alreadyDownloaded = response.data.filter((x) => x.alreadyDownloaded).length

                const json = { downloads: { count: { total: 0, alreadyDownloaded: 0 } } }
                json.downloads.count.total = totalDownloads
                json.downloads.count.alreadyDownloaded = alreadyDownloaded

                this.setDownloads(json.downloads)

                this.newsDownloadHandler()
                this.loadInternationalization()
            })
        },
        async loadInternationalization() {
            let currentLocale = localStorage.getItem('locale') ? localStorage.getItem('locale') : this.locale
            let currLanguage = ''
            if (currentLocale && Object.keys(currentLocale).length > 0) currentLocale = currentLocale.replaceAll('_', '-')
            else currentLocale = 'en-US'

            const splittedLanguage = currentLocale.split('-')
            currLanguage += splittedLanguage[0] + '-'
            if (splittedLanguage.length > 2) currLanguage += splittedLanguage[2].replaceAll('#', '') + '-'
            currLanguage += splittedLanguage[1].toUpperCase()

            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/i18nMessages/internationalization?currLanguage=' + currLanguage).then((response) => this.setInternationalization(response.data))
        },
        newsDownloadHandler() {
            console.log('Starting connection to WebSocket Server')

            WEB_SOCKET.update = (event) => {
                if (event.data) {
                    const json = JSON.parse(event.data)
                    if (json.news) {
                        this.setNews(json.news)
                    }
                    if (json.downloads) {
                        this.setDownloads(json.downloads)
                    }
                }
            }
            WEB_SOCKET.onopen = (event) => {
                if (event.data) {
                    const json = JSON.parse(event.data)
                    if (json.news) {
                        this.setNews(json.news)
                    }
                    if (json.downloads) {
                        this.setDownloads(json.downloads)
                    }
                }
            }
            WEB_SOCKET.onmessage = (event) => {
                if (event.data) {
                    const json = JSON.parse(event.data)
                    if (json.news) {
                        this.setNews(json.news)
                    }
                    if (json.downloads) {
                        this.setDownloads(json.downloads)
                    }
                }
            }
        },
        setSelectedMenuItem(menuItem) {
            this.selectedMenuItem = menuItem
            this.menuItemClickedTrigger = !this.menuItemClickedTrigger
        }
    }
})
</script>

<style lang="scss">
html {
    font-size: var(--kn-font-size);
}
body {
    padding: 0;
    margin: 0;
    font-family: var(--kn-font-family);
}
.layout-wrapper-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    min-height: 100%;
}
.layout-wrapper-content::after {
    content: '';
    display: table; /* NOTE: Display "block" does not seem to work with height: 0px. */
    height: 0px;
}
.layout-main {
    margin-left: var(--kn-mainmenu-width);
    &.hiddenMenu {
        margin-left: 0;
    }
    flex: 1;
    max-width: calc(100% - var(--kn-mainmenu-width));
}
</style>
