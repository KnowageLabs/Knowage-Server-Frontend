import { useI18n } from 'vue-i18n'
import { useInternationalization } from '@/composables/useInternationalization'

export function getInternationalizedValue(item): string {
    const { t } = useI18n()
    const { i18n } = useInternationalization()

    const value = item.descr ? item.descr : item.label
    return i18n(value) || t(value)
}

export function cleanUrl(item: any): string {
    if (item.to) {
        return item.to.replace(/\\\//g, '/')
    } else return item.url
}

export function normalizeExternalUrl(url: string | null | undefined): string {
    const normalizedUrl = typeof url === 'string' ? url.trim() : ''
    if (!normalizedUrl) return ''
    if (normalizedUrl.startsWith('//')) return `https:${normalizedUrl}`
    if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedUrl)) return normalizedUrl

    return `https://${normalizedUrl}`
}
