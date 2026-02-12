import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'

export const useLoginConfig = () => {
    const { locale } = useI18n()
    const store = mainStore()

    const loginConfig = ref<any>(null)
    const backgroundUrl = ref(`${import.meta.env.VITE_PUBLIC_PATH}images/home/home-background.jpg`)
    const backgroundLoaded = ref(true)

    const preloadImage = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => reject()
            img.src = url
        })
    }

    const loadLoginConfig = async () => {
        const response = await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/loginconfig`)
        loginConfig.value = response.data

        // Imposta il background personalizzato se presente
        if (loginConfig.value?.items?.[0]?.backgroundUrl) {
            const customBg = loginConfig.value.items[0].backgroundUrl
            backgroundLoaded.value = false

            try {
                // Precarica l'immagine in background
                await preloadImage(customBg)
                backgroundUrl.value = customBg
            } catch (err) {
                console.warn('Failed to load custom background, using default', err)
                // Se fallisce, rimane con il default
            } finally {
                backgroundLoaded.value = true
            }
        }

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
        backgroundUrl,
        backgroundLoaded,
        loadLoginConfig,
        preloadImage
    }
}
