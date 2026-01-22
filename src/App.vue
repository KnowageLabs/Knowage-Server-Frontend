<template>
    <Toast></Toast>
    <ConfirmDialog></ConfirmDialog>
    <KnOverlaySpinnerPanel />
    <div class="layout-wrapper-content" :class="{ 'layout-wrapper-content-embed': documentExecution.embed, isMobileDevice: isMobileDevice }">
        <MainMenu v-if="showMenu && mainMenuVisibility" :closeMenu="closedMenu" @openMenu="openMenu" data-tour-id="main-menu"></MainMenu>

        <div class="layout-main" data-tour-id="content-area" :class="{ hiddenMenu: !mainMenuVisibility }" @click="closeMenu" @blur="closeMenu">
            <router-view :selected-menu-item="selectedMenuItem" @click="closeMenu" />
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
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default defineComponent({
    components: { ConfirmDialog, KnOverlaySpinnerPanel, KnRotate, MainMenu, Toast },

    data() {
        return {
            themeHelper: new themeHelper(),
            selectedMenuItem: null,
            isMobileDevice: false,
            showMenu: false,
            closedMenu: false,
            pollingInterval: null as any,
            stopExecution: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            configurations: 'configurations',
            error: 'error',
            info: 'info',
            warning: 'warning',
            user: 'user',
            loading: 'loading',
            locale: 'locale',
            isEnterprise: 'isEnterprise',
            isEnterpriseValid: 'isEnterpriseValid',
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
                let storedLocale = responseLocale.replace('_', '-')
                if (localStorage.getItem('locale')) {
                    storedLocale = localStorage.getItem('locale')
                }
                localStorage.setItem('locale', storedLocale)
                localStorage.setItem('token', response.data.userUniqueIdentifier)

                this.setLocale(storedLocale)
                this.$i18n.locale = storedLocale

                await loadLanguageAsync(storedLocale)

                this.$primevue.config.locale.dateFormat = primeVueDate(getLocale(true))

                this.showMenu = true
            })
            .catch((error) => {
                if (error.response.status === 400) {
                    this.$router.replace({ name: 'unauthorized', params: { message: 'unauthorized.invalidRequest' } })
                    this.stopExecution = true
                } else auth.logout()
            })
            .finally(() => this.setLoading(false))
        if (this.stopExecution) return

        await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/user-configs').then(async (response: any) => {
            this.checkTopLevelIframe(response.data)
            this.setConfigurations(response.data)
            this.checkOIDCSession(response.data)
            if (this.isEnterprise) {
                if (Object.keys(this.defaultTheme.length === 0)) this.setDefaultTheme(this.themeHelper.getDefaultKnowageTheme())

                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/license').then((response) => {
                    this.setLicenses(response.data)
                    if (!this.isEnterpriseValid) {
                        this.$q.notify({
                            position: 'top',
                            type: 'warning',
                            timeout: 0,
                            closeBtn: this.$t('common.dismiss'),
                            message: this.$t('common.error.licenseInvalid')
                        })
                    }
                })
                if (Object.keys(this.theme).length === 0) {
                    this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/thememanagement/current`).then((themes: any) => {
                        this.setTheme(themes.data.config)
                        this.themeHelper.setTheme(themes.data.config)
                    })
                } else {
                    this.themeHelper.setTheme(this.theme)
                }
            }

            this.onLoad()
        })
    },

    mounted() {
        if (/Android|iPhone/i.test(navigator.userAgent)) {
            this.isMobileDevice = false
        }
        ;(window as any).startKnowageTour = () => this.startTour()
    },

    beforeUnmounted() {
        clearInterval(this.pollingInterval)
    },

    methods: {
        ...mapActions(mainStore, ['setTheme', 'setDefaultTheme', 'setLicenses', 'setConfigurations', 'setLoading', 'setLocale', 'initializeUser', 'setNews', 'setDownloads', 'setInternationalization', 'setCSRFToken']),
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
                    url = url.replace(parametersRegex, (match, parameter) => encodeURIComponent(window.sessionStorage.getItem(parameter) || ''))
                    await this.$http
                        .get(url, {
                            withCredentials: configs['oidc.session.polling.errorMessage'] ? false : true,
                            headers: {
                                'x-session-polling': 'true'
                            }
                        })
                        .then((response) => {
                            if (response.status === 200) {
                                const responseURL = new URL(response.request.responseURL)
                                if (responseURL.searchParams.get('error')) auth.logout()
                                if (configs['oidc.session.polling.errorMessage'] && response.data === configs['oidc.session.polling.errorMessage']) auth.logout()
                            }
                        })
                        .catch((error) => {
                            if (error.response?.request?.responseURL) {
                                const responseURL = new URL(error.response.request.responseURL)
                                if (responseURL.searchParams.get('error')) auth.logout()
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

                if (!this.configurations['KNOWAGE.WEBSOCKET.DISABLE'] || this.configurations['KNOWAGE.WEBSOCKET.DISABLE'] === 'false') this.newsDownloadHandler()
            })
            if (this.isEnterprise) {
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/news')
                    .then(async (newsResponse) => {
                        await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/newsRead').then((newsReadResponse) => {
                            const json = { news: { count: { total: 0, unread: 0 } } }
                            json.news.count.total = newsResponse.data.length
                            json.news.count.unread = newsResponse.data.length - newsReadResponse.data.length
                            this.setNews(json.news)
                        })
                    })
                    .catch((error) => {})
                    .finally(() => {
                        this.loadInternationalization()
                        this.setLoading(false)
                        this.maybeStartTour()
                    })
            } else {
                this.loadInternationalization()
                this.setLoading(false)
                this.maybeStartTour()
            }
        },
        maybeStartTour() {
            if (this.isMobileDevice) return
            if (localStorage.getItem('knowageTourDone')) return
            // Ensure layout is rendered before starting
            setTimeout(() => this.startTour(), 400)
        },
        async startTour() {
            if (this.isMobileDevice) return

            const byTourId = (id: string) => document.querySelector(`[data-tour-id='${id}']`) as Element | null

            const waitForElement = async (getEl: () => Element | null, opts?: { timeoutMs?: number; intervalMs?: number }) => {
                const timeoutMs = opts?.timeoutMs ?? 4000
                const intervalMs = opts?.intervalMs ?? 100

                const start = Date.now()
                while (Date.now() - start < timeoutMs) {
                    const el = getEl()
                    if (el) return el
                    await new Promise((r) => setTimeout(r, intervalMs))
                }
                return null
            }

            // Language (flag) is mandatory: wait for it to appear.
            const languageEl = await waitForElement(() => byTourId('menu-action-languageSelection'))
            if (!languageEl) return

            // Optional: wait briefly for main menu container as an intro step.
            const mainMenuEl = await waitForElement(() => byTourId('main-menu'), { timeoutMs: 1000, intervalMs: 100 })

            const steps: any[] = []

            if (mainMenuEl) {
                steps.push({
                    element: mainMenuEl,
                    popover: {
                        title: this.$t('tour.mainMenuTitle') || 'Menu',
                        description: this.$t('tour.mainMenuDescription') || 'Usa il menu per navigare tra le funzionalità.',
                        side: 'right',
                        onNextClick: async (_el, _step, opts) => {
                            // Try to open the profile/menu section so the language flag becomes visible.
                            const profileBtn = document.querySelector("[data-tour-id='menu-profile'] button") as HTMLElement | null
                            if (profileBtn) profileBtn.click()

                            // Wait a bit for the language button to appear after expanding.
                            await waitForElement(() => byTourId('menu-action-languageSelection'), { timeoutMs: 1500, intervalMs: 100 })

                            // Move to the language step.
                            opts.driver.moveNext()
                        }
                    }
                })
            }

            steps.push({
                element: languageEl,
                popover: {
                    title: this.$t('tour.languageTitle') || 'Lingua',
                    description: this.$t('tour.languageDescription') || 'Clicca qui (bandiera) per cambiare lingua.',
                    side: 'right'
                }
            })

            const tour = driver({
                allowClose: true,
                overlayOpacity: 0.6,
                animate: true,
                smoothScroll: true,
                stagePadding: 8,
                stageRadius: 10,
                showProgress: true,
                nextBtnText: this.$t('common.next') || 'Avanti',
                prevBtnText: this.$t('common.previous') || 'Indietro',
                doneBtnText: this.$t('common.close') || 'Chiudi',
                popoverClass: 'kn-tour-popover'
            })

            tour.setSteps(steps)
            tour.drive()
            localStorage.setItem('knowageTourDone', 'true')
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
    height: 100%;
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
        margin-top: 0;
        max-width: 100%;
    }
    flex: 1;
    max-width: calc(100% - var(--kn-mainmenu-width));
}
@media screen and (max-width: 1025px) {
    .layout-main {
        margin-top: var(--kn-mainmenu-width);
        margin-left: 0;
        min-width: 100%;
    }
}

/* Guided tour (driver.js) look & feel */
.kn-tour-popover {
    max-width: 360px;
}

.kn-tour-popover .driver-popover-title {
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.2px;
}

.kn-tour-popover .driver-popover-description {
    font-size: 13px;
    line-height: 1.35;
}

.kn-tour-popover .driver-popover-footer {
    gap: 8px;
}

.kn-tour-popover .driver-popover-progress-text {
    font-size: 12px;
    opacity: 0.75;
}

.kn-tour-popover .driver-popover-btn {
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 12px;
}
</style>
