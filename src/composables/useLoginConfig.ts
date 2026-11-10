import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'
import { applyLoginFavicon, defaultLoginBranding, isLoginImageUrl } from '@/helpers/commons/loginBranding'

export const useLoginConfig = () => {
    const { locale } = useI18n()
    const store = mainStore()

    const loginConfig = ref<any>(null)
    const samlActive = computed(() => String(loginConfig.value?.items?.[0]?.samlActive).toLowerCase() === 'true')
    const backgroundUrl = ref(defaultLoginBranding.backgroundUrl)
    const logoUrl = ref(defaultLoginBranding.logoUrl)
    const backgroundLoaded = ref(true)

    const preloadImage = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const timeout = setTimeout(() => {
                img.onload = img.onerror = null
                reject()
            }, 5000)
            img.onload = () => {
                clearTimeout(timeout)
                resolve()
            }
            img.onerror = () => {
                clearTimeout(timeout)
                reject()
            }
            img.src = url
        })
    }

    const loadLoginConfig = async () => {
        const response = await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/loginconfig`)
        loginConfig.value = response.data

        if (loginConfig.value?.items?.[0]?.clientId) {
            sessionStorage.setItem('oidcClientId', loginConfig.value.items[0].clientId)
        }

        backgroundUrl.value = defaultLoginBranding.backgroundUrl
        logoUrl.value = defaultLoginBranding.logoUrl
        applyLoginFavicon()
        const branding = loginConfig.value?.items?.[0] || {}
        backgroundLoaded.value = !branding.backgroundUrl
        await Promise.all(
            ['backgroundUrl', 'logoUrl', 'faviconUrl'].map(async (field) => {
                const url = branding[field]
                if (typeof url !== 'string' || !url || !isLoginImageUrl(url)) return
                try {
                    await preloadImage(url)
                    if (field === 'backgroundUrl') backgroundUrl.value = url
                    else if (field === 'logoUrl') logoUrl.value = url
                    else applyLoginFavicon(url)
                } catch {
                    console.warn(`Failed to load custom ${field}, using default`)
                }
            })
        )
        backgroundLoaded.value = true

        // Imposta la lingua di default se presente
        if (loginConfig.value?.items?.[0]?.defaultLanguage) {
            const defaultLocale = loginConfig.value.items[0].defaultLanguage.replace('_', '-')
            localStorage.setItem('locale', defaultLocale)
            store.setLocale(defaultLocale)
            locale.value = defaultLocale
            await loadLanguageAsync(defaultLocale)
        }
    }

    return {
        loginConfig,
        samlActive,
        backgroundUrl,
        logoUrl,
        backgroundLoaded,
        loadLoginConfig,
        preloadImage
    }
}
