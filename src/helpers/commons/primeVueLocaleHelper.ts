import { primeVueDate } from '@/helpers/commons/localeHelper'

let primeVueConfig: any = null
let defaultLocale: any = null

export function registerPrimeVueConfig(config: any) {
    primeVueConfig = config
    defaultLocale = { ...config.locale }
}

export function applyPrimeVueLocale(lang: string, messages: any) {
    if (!primeVueConfig) return

    const { dateFormat: ignoredDateFormat, ...localeMessages } = messages?.locale ?? {}
    let dateFormat = defaultLocale.dateFormat
    try {
        dateFormat = primeVueDate(lang)
    } catch {
        // no date format defined for this language, keep the default one
    }

    primeVueConfig.locale = { ...defaultLocale, ...localeMessages, dateFormat }
}
