import { defineStore } from 'pinia'
import { indexedDB } from '@/idb'

const store = defineStore('store', {
    state() {
        return {
            configurations: {},
            user: {},
            error: {},
            info: {},
            warning: {},
            downloads: { count: { total: 0, alreadyDownloaded: 0 } },
            locale: 'en_US',
            news: { count: { total: 0, unRead: 0 } },
            loading: 0,
            homePage: { loading: true },
            internationalization: [],
            isEnterprise: false,
            isEnterpriseValid: false,
            licenses: {
                hosts: [],
                licenses: {},
                cpuNumber: -1
            },
            mainMenuVisibility: false,
            documentExecution: {},
            theme: {},
            defaultTheme: {},
            menuOpened: false
        }
    },
    actions: {
        initializeUser(user) {
            this.setUser(user)
            this.setEnterprise(user.enterprise, user.enterpriseValid)
        },

        updateLicense(el) {
            const licenses = this.licenses

            const hostNameLicenses = licenses.licenses[el.hostName]

            const existingLicense = hostNameLicenses.filter((x) => x.product === el.license.product)

            if (existingLicense.length == 1) {
                hostNameLicenses.splice(existingLicense, 1)
            }

            hostNameLicenses.push(el.license)

            this.setLicenses(licenses)
        },
        getConfigurations(configName) {
            return this.configurations && this.configurations[configName]
        },
        setConfigurations(configs) {
            this.configurations = configs
        },
        getUser() {
            return this.user
        },
        setUser(user) {
            localStorage.setItem('organization', user.organization)
            if (user.userId === `public-${user.organization}`) localStorage.setItem('public', true)
            else localStorage.removeItem('public')
            this.user = user
        },
        setError(error) {
            this.error = error
        },
        setInfo(info) {
            this.info = info
        },
        setLoading(loading) {
            if (loading) this.loading++
            else this.loading--

            if (this.loading < 0) this.loading = 0
        },
        setWarning(warning) {
            this.warning = warning
        },
        setLocale(locale) {
            this.locale = locale
        },
        setDownloads(hasDownload) {
            this.downloads = hasDownload
        },
        updateAlreadyDownloadedFiles() {
            if (this.downloads.count.total > this.downloads.count.alreadyDownloaded) this.downloads.count.alreadyDownloaded++
        },
        setNews(hasNews) {
            this.news = hasNews
        },
        setHomePage(homePage) {
            this.homePage = homePage
        },
        setInternationalization(internationalization) {
            this.internationalization = internationalization
        },
        setLicenses(licenses) {
            this.licenses = licenses
        },
        setEnterprise(enterprise, enterpriseValid) {
            this.isEnterprise = enterprise
            this.isEnterpriseValid = enterpriseValid
        },
        setDocumentExecutionEmbed() {
            this.documentExecution.embed = true
        },
        setTheme(theme) {
            this.theme = theme
        },
        setDefaultTheme(defaultTheme) {
            this.defaultTheme = defaultTheme
        },
        hideMainMenu() {
            this.mainMenuVisibility = false
        },
        showMainMenu() {
            this.mainMenuVisibility = true
        },
        getLocale() {
            return this.locale
        },
        storeClearIndexedDBCache() {
            indexedDB.widgetData.clear()
        },
        toggleMenuOpened() {
            this.menuOpened = !this.menuOpened
        }
    }
})

export default store
