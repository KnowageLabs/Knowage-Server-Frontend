import { afterEach, describe, expect, it } from 'vitest'
import { applyLoginFavicon, isLoginImageFile, isLoginImageUrl, loginImageUploadLimit, normalizeLoginBranding } from '../loginBranding'

describe('login branding', () => {
    afterEach(() => document.querySelectorAll('link[rel="icon"]').forEach((link) => link.remove()))

    it.each(['', '/images/logo.svg', 'https://example.com/logo.png?v=2', 'http://example.com/background.jpg'])('accepts supported image URL %s', (url) => {
        expect(isLoginImageUrl(url)).toBe(true)
    })

    it.each(['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/logo.png', '/\\example.com/logo', 'images/logo.svg', 'https:example.com/logo', "https://example.com/a'b", 'https://example.com/%zz'])('rejects unsupported image URL %s', (url) => {
        expect(isLoginImageUrl(url)).toBe(false)
    })

    it('normalizes cleared inputs and trims URLs', () => {
        expect(normalizeLoginBranding({ backgroundUrl: ' /images/bg.jpg ', logoUrl: null as any })).toEqual({ backgroundUrl: '/images/bg.jpg', logoUrl: '', faviconUrl: '' })
    })

    it('restores the original favicon when branding is cleared', () => {
        const icon = document.createElement('link')
        icon.rel = 'icon'
        icon.href = '/original.ico'
        document.head.appendChild(icon)
        applyLoginFavicon('/custom.ico')
        expect(icon.getAttribute('href')).toBe('/custom.ico')
        applyLoginFavicon()
        expect(icon.getAttribute('href')).toBe('/original.ico')
        expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(1)
    })

    it('accepts supported uploads and rejects empty, oversized and unsupported files', () => {
        expect(isLoginImageFile(new File(['image'], 'logo.SVG'))).toBe(true)
        expect(isLoginImageFile(new File(['icon'], 'favicon.ico'))).toBe(true)
        expect(isLoginImageFile(new File([], 'empty.png'))).toBe(false)
        expect(isLoginImageFile(new File(['html'], 'logo.html'))).toBe(false)
        expect(isLoginImageFile(new File([new Uint8Array(loginImageUploadLimit + 1)], 'big.png'))).toBe(false)
    })
})
