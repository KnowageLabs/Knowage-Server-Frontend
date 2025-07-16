import { createI18n } from 'vue-i18n'
import store from './App.store'

const currentLocale = localStorage.getItem('locale') ? localStorage.getItem('locale') : store.locale

const i18n = createI18n({
    legacy: true,
    globalInjection: true,
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

function getLoader(filesMap, lang, fileName) {
    const filePath = `./i18n/${lang}/${fileName}`
    return filesMap[filePath] ? filesMap[filePath] : null
}

function setI18nLanguage(lang) {
    i18n.locale = lang
}

export async function loadLanguageAsync(lang) {
    const messageLoader = getLoader(messageFiles, lang, 'messages.json')
    const helperMessageLoader = getLoader(helperMessageFiles, lang, 'helper-messages.json')

    if (!messageLoader || !helperMessageLoader) {
        console.warn(`Language files for ${lang} not found.`)
        return
    }

    const [messages, helperMessages] = await Promise.all([messageLoader(), helperMessageLoader()])

    i18n.global.setLocaleMessage(lang, messages.default)
    i18n.global.mergeLocaleMessage(lang, helperMessages.default)

    loadedLanguages.push(lang)
    setI18nLanguage(lang)
}

export default i18n
