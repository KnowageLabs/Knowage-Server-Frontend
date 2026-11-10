import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Hoisted mock variables ────────────────────────────────────────────────────

const { mockAxiosGet, mockSetLocale, mockLoadLanguageAsync } = vi.hoisted(() => ({
    mockAxiosGet: vi.fn(),
    mockSetLocale: vi.fn(),
    mockLoadLanguageAsync: vi.fn(async () => {})
}))

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('axios', () => ({
    default: { get: mockAxiosGet }
}))

vi.mock('vue-i18n', () => ({
    useI18n: vi.fn(() => ({ locale: { value: 'en-US' } }))
}))

vi.mock('@/App.store', () => ({
    default: vi.fn(() => ({ setLocale: mockSetLocale }))
}))

vi.mock('@/App.i18n.js', () => ({
    loadLanguageAsync: mockLoadLanguageAsync
}))

// ─── Import after mocks ────────────────────────────────────────────────────────

import { useLoginConfig } from '../useLoginConfig'
import { defaultLoginBranding } from '@/helpers/commons/loginBranding'

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useLoginConfig — initial state', () => {
    it('starts with loginConfig = null', () => {
        const { loginConfig } = useLoginConfig()
        expect(loginConfig.value).toBeNull()
    })

    it('starts with backgroundLoaded = true', () => {
        const { backgroundLoaded } = useLoginConfig()
        expect(backgroundLoaded.value).toBe(true)
    })

    it('starts with a non-empty backgroundUrl (default image path)', () => {
        const { backgroundUrl } = useLoginConfig()
        expect(backgroundUrl.value).toBeTruthy()
        expect(typeof backgroundUrl.value).toBe('string')
    })
})

describe('useLoginConfig — loadLoginConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    it.each([
        [true, true],
        ['true', true],
        [false, false],
        ['false', false],
        [undefined, false]
    ])('normalizes the SAML enable flag %s to %s', async (flag, enabled) => {
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{ samlActive: flag }] } })
        const { loadLoginConfig, samlActive } = useLoginConfig()
        await loadLoginConfig()
        expect(samlActive.value).toBe(enabled)
    })

    it('calls the correct endpoint', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [] } })

        const { loadLoginConfig } = useLoginConfig()
        await loadLoginConfig()

        expect(mockAxiosGet).toHaveBeenCalledOnce()
        const [url] = mockAxiosGet.mock.calls[0]
        expect(url).toContain('/restful-services/loginconfig')
    })

    it('stores the config response in loginConfig', async () => {
        const config = { items: [{ title: 'Test' }] }
        mockAxiosGet.mockResolvedValueOnce({ data: config })

        const { loadLoginConfig, loginConfig } = useLoginConfig()
        await loadLoginConfig()

        expect(loginConfig.value).toEqual(config)
    })

    it('leaves backgroundUrl as default when config has no backgroundUrl', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{}] } })

        const { loadLoginConfig, backgroundUrl } = useLoginConfig()
        const defaultBg = backgroundUrl.value
        await loadLoginConfig()

        expect(backgroundUrl.value).toBe(defaultBg)
    })

    it('does not set locale when config has no defaultLanguage', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{}] } })

        const { loadLoginConfig } = useLoginConfig()
        await loadLoginConfig()

        expect(mockSetLocale).not.toHaveBeenCalled()
        expect(mockLoadLanguageAsync).not.toHaveBeenCalled()
    })

    it('sets the locale when config provides defaultLanguage', async () => {
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ defaultLanguage: 'it_IT' }] }
        })

        const { loadLoginConfig } = useLoginConfig()
        await loadLoginConfig()

        expect(mockSetLocale).toHaveBeenCalledWith('it-IT')
        expect(mockLoadLanguageAsync).toHaveBeenCalledWith('it-IT')
    })

    it('converts underscore locale to dash format (e.g. pt_BR → pt-BR)', async () => {
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ defaultLanguage: 'pt_BR' }] }
        })

        const { loadLoginConfig } = useLoginConfig()
        await loadLoginConfig()

        const [localeArg] = mockSetLocale.mock.calls[0]
        expect(localeArg).toBe('pt-BR')
    })

    it('saves locale to localStorage when defaultLanguage is present', async () => {
        localStorage.clear()
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ defaultLanguage: 'fr_FR' }] }
        })

        const { loadLoginConfig } = useLoginConfig()
        await loadLoginConfig()

        expect(localStorage.getItem('locale')).toBe('fr-FR')
    })
})

describe('useLoginConfig — loadLoginConfig with custom background', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('sets backgroundLoaded = true after the custom image loads successfully', async () => {
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ backgroundUrl: 'http://example.com/bg.jpg' }] }
        })

        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onload?.(), 0)
            return mockImage as any
        })

        const { loadLoginConfig, backgroundLoaded } = useLoginConfig()
        await loadLoginConfig()

        expect(backgroundLoaded.value).toBe(true)
    })

    it('updates backgroundUrl when image preloads successfully', async () => {
        const customBg = 'http://example.com/custom-bg.jpg'
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ backgroundUrl: customBg }] }
        })

        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onload?.(), 0)
            return mockImage as any
        })

        const { loadLoginConfig, backgroundUrl } = useLoginConfig()
        await loadLoginConfig()

        expect(backgroundUrl.value).toBe(customBg)
    })

    it('keeps default backgroundUrl when image fails to load', async () => {
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ backgroundUrl: 'http://bad-url.com/notfound.jpg' }] }
        })

        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onerror?.(), 0)
            return mockImage as any
        })

        const { loadLoginConfig, backgroundUrl } = useLoginConfig()
        const defaultBg = backgroundUrl.value
        await loadLoginConfig()

        expect(backgroundUrl.value).toBe(defaultBg)
    })

    it('sets backgroundLoaded = true even when image fails', async () => {
        mockAxiosGet.mockResolvedValueOnce({
            data: { items: [{ backgroundUrl: 'http://bad-url.com/notfound.jpg' }] }
        })

        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onerror?.(), 0)
            return mockImage as any
        })

        const { loadLoginConfig, backgroundLoaded } = useLoginConfig()
        await loadLoginConfig()

        expect(backgroundLoaded.value).toBe(true)
    })
})

describe('useLoginConfig — preloadImage', () => {
    it('resolves when the image loads successfully', async () => {
        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onload?.(), 0)
            return mockImage as any
        })

        const { preloadImage } = useLoginConfig()
        await expect(preloadImage('http://example.com/img.jpg')).resolves.toBeUndefined()
    })

    it('rejects when the image fails to load', async () => {
        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onerror?.(), 0)
            return mockImage as any
        })

        const { preloadImage } = useLoginConfig()
        await expect(preloadImage('http://bad-url.com/img.jpg')).rejects.toBeUndefined()
    })

    it('sets the src on the Image object', async () => {
        const mockImage = { onload: null as any, onerror: null as any, src: '' }
        vi.spyOn(global, 'Image').mockImplementation(function () {
            setTimeout(() => mockImage.onload?.(), 0)
            return mockImage as any
        })

        const { preloadImage } = useLoginConfig()
        const url = 'http://example.com/test.jpg'
        await preloadImage(url)

        expect(mockImage.src).toBe(url)
    })
})

describe('useLoginConfig branding', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        document.querySelectorAll('link[rel="icon"]').forEach((link) => link.remove())
        const icon = document.createElement('link')
        icon.rel = 'icon'
        icon.href = '/original.ico'
        document.head.appendChild(icon)
        vi.stubGlobal('Image', class {
            onload: (() => void) | null = null
            onerror: (() => void) | null = null
            set src(url: string) {
                queueMicrotask(() => url.includes('missing') ? this.onerror?.() : this.onload?.())
            }
        })
    })

    it('loads all branding images and restores defaults when the configuration is cleared', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{ backgroundUrl: '/bg.jpg', logoUrl: '/logo.svg', faviconUrl: '/custom.ico' }] } })
        const { loadLoginConfig, backgroundUrl, logoUrl } = useLoginConfig()
        await loadLoginConfig()
        expect(backgroundUrl.value).toBe('/bg.jpg')
        expect(logoUrl.value).toBe('/logo.svg')
        expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/custom.ico')

        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{}] } })
        await loadLoginConfig()
        expect(backgroundUrl.value).toBe(defaultLoginBranding.backgroundUrl)
        expect(logoUrl.value).toBe(defaultLoginBranding.logoUrl)
        expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/original.ico')
    })

    it('keeps defaults for failed logo and favicon without discarding a valid background', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{ backgroundUrl: '/bg.jpg', logoUrl: '/missing.svg', faviconUrl: '/missing.ico' }] } })
        const { loadLoginConfig, backgroundUrl, logoUrl, backgroundLoaded } = useLoginConfig()
        await loadLoginConfig()
        expect(backgroundUrl.value).toBe('/bg.jpg')
        expect(logoUrl.value).toBe(defaultLoginBranding.logoUrl)
        expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/original.ico')
        expect(backgroundLoaded.value).toBe(true)
    })

    it('does not load unsupported image URLs', async () => {
        const image = vi.spyOn(global, 'Image')
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{ logoUrl: 'javascript:alert(1)', faviconUrl: '//example.com/favicon.ico' }] } })
        const { loadLoginConfig, logoUrl } = useLoginConfig()
        await loadLoginConfig()
        expect(image).not.toHaveBeenCalled()
        expect(logoUrl.value).toBe(defaultLoginBranding.logoUrl)
    })

    it('does not block login indefinitely if an image server never responds', async () => {
        vi.useFakeTimers()
        vi.stubGlobal('Image', class {})
        mockAxiosGet.mockResolvedValueOnce({ data: { items: [{ logoUrl: '/unresponsive.svg' }] } })
        const { loadLoginConfig, logoUrl } = useLoginConfig()
        const loading = loadLoginConfig()
        await vi.advanceTimersByTimeAsync(5000)
        await loading
        expect(logoUrl.value).toBe(defaultLoginBranding.logoUrl)
    })
})
