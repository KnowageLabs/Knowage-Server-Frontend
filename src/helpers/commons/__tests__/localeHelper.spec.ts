import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import mainStore from '@/App.store'
import { formatNumberWithLocale, getLocale } from '../localeHelper'

describe('reactive locale formatting', () => {
    let storedLocale: string | null

    beforeEach(() => {
        storedLocale = localStorage.getItem('locale')
        localStorage.removeItem('locale')
        setActivePinia(createPinia())
    })

    afterEach(() => {
        if (storedLocale === null) localStorage.removeItem('locale')
        else localStorage.setItem('locale', storedLocale)
        setActivePinia(undefined)
    })

    it('reformats computed numeric values when the application language changes', () => {
        const store = mainStore()
        store.setLocale('en_US')
        const formatted = computed(() => formatNumberWithLocale(1234.5, 2))
        expect(formatted.value).toBe('1,234.50')

        store.setLocale('it-IT')
        expect(formatted.value).toBe('1.234,50')

        store.setLocale('en-US')
        expect(formatted.value).toBe('1,234.50')
    })

    it('tracks locale changes even when the language is persisted in localStorage', () => {
        const store = mainStore()
        localStorage.setItem('locale', 'en-US')
        const formatted = computed(() => formatNumberWithLocale(1234.5, 2))
        expect(formatted.value).toBe('1,234.50')

        localStorage.setItem('locale', 'it-IT')
        store.setLocale('it-IT')
        expect(formatted.value).toBe('1.234,50')
    })

    it('supports persisted locale formatting without an active Pinia instance', () => {
        setActivePinia(undefined)
        localStorage.setItem('locale', 'it_IT')
        expect(getLocale(true)).toBe('it-IT')
        expect(formatNumberWithLocale(1234.5, 2)).toBe('1.234,50')
    })
})
