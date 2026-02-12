import { createI18n } from 'vue-i18n'

const currentLocale = localStorage.getItem('locale') || 'en-US'

const i18n = createI18n({
    locale: currentLocale,
    fallbackLocale: 'en-US',
    messages: {}
})

import('@/i18n/en-US/messages.json').then((messages) => {
    import('@/i18n/en-US/helper-messages.json').then((m) => {
        i18n.global.setLocaleMessage('en-US', messages.default)
        i18n.global.mergeLocaleMessage('en-US', m.default)
    })
})

const loadedLanguages = []

const messageFiles = import.meta.glob('@/i18n/*/messages.json')
const helperMessageFiles = import.meta.glob('@/i18n/*/helper-messages.json')

function getLoader(filesMap, lang, fileName) {
    const filePath = `/src/i18n/${lang}/${fileName}`
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
