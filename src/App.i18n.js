import { createI18n } from 'vue-i18n'
import store from './App.store'

const currentLocale = localStorage.getItem('locale') ? localStorage.getItem('locale') : store.locale

const i18n = createI18n({
    locale: currentLocale,
    fallbackLocale: 'en_US',
    messages: {}
})

import('@/i18n/en_US/messages.json').then((messages) => {
    import('@/i18n/en_US/helper-messages.json').then((m) => {
        i18n.global.setLocaleMessage('en_US', messages.default)
        i18n.global.mergeLocaleMessage('en_US', m.default)
    })
})

const loadedLanguages = []

const messageFiles = import.meta.glob('./i18n/*/messages.json')
const helperMessageFiles = import.meta.glob('./i18n/*/helper-messages.json')

function setI18nLanguage(lang) {
    i18n.locale = lang
}

export function loadLanguageAsync(lang) {
    return new Promise((resolve) => {
        // If the same language
        if (i18n.locale === lang) {
            resolve(setI18nLanguage(lang))
        }

        // If the language was already loaded
        if (loadedLanguages.includes(lang)) {
            resolve(setI18nLanguage(lang))
        }

        const messagePath = `./i18n/${lang}/messages.json`
        const helperMessagePath = `./i18n/${lang}/helper-messages.json`

        const loader = messageFiles[messagePath]
        const helperLoader = helperMessageFiles[helperMessagePath]

        if (!loader || !helperLoader) {
            console.warn(`Language files for ${lang} not found.`)
            return resolve()
        }

        const [messages, helperMessages] = Promise.all([loader(), helperLoader()])

        i18n.global.setLocaleMessage(lang, messages.default)
        i18n.global.mergeLocaleMessage(lang, helperMessages.default)

        loadedLanguages.push(lang)
        resolve(setI18nLanguage(lang))
    })
}

export default i18n
