import { getCurrentInstance } from 'vue'

export function useInternationalization() {
    const instance = getCurrentInstance()
    if (!instance) {
        throw new Error('useInternationalization must be called within a setup function')
    }

    const i18n = instance.appContext.config.globalProperties.$internationalization
    if (!i18n) {
        throw new Error('Internationalization plugin is not installed')
    }

    return { i18n }
}
