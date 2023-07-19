import { createI18n } from 'vue-i18n'
import store from './App.store'

const currentLocale = localStorage.getItem('locale') ? localStorage.getItem('locale') : store.locale

const i18n = createI18n({
    locale: currentLocale,
    fallbackLocale: 'en_US'
})

import('@/i18n/en_US/messages.json').then((messages) => {
    import('@/i18n/en_US/helper-messages.json').then((m) => {
        i18n.global.setLocaleMessage('en_US', messages.default)
        i18n.global.mergeLocaleMessage('en_US', m.default)
    })
})

const loadedLanguages = []

export default i18n

function setI18nLanguage(lang) {
    i18n.locale = lang
}

export function loadLanguageAsync(lang) {
    // If the same language
    if (i18n.locale === lang) {
        return Promise.resolve(setI18nLanguage(lang))
    }

    // If the language was already loaded
    if (loadedLanguages.includes(lang)) {
        return Promise.resolve(setI18nLanguage(lang))
    }

    // If the language hasn't been loaded yet
    return import(`./i18n/${lang}/messages.json`).then((messages) => {
        import(`./i18n/${lang}/helper-messages.json`).then((m) => {
            // eslint-disable-next-line
            // @ts-ignore
            i18n.global.setLocaleMessage(lang, messages.default)
            i18n.global.mergeLocaleMessage(lang, m.default)
            loadedLanguages.push(lang)
            return setI18nLanguage(lang)
        })
    })
}
