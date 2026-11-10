export interface LoginBranding {
    backgroundUrl: string
    logoUrl: string
    faviconUrl: string
}

export const loginImageUploadLimit = 5 * 1024 * 1024
export const loginImageUploadAccept = '.png,.jpg,.jpeg,.gif,.svg,.ico'

export function isLoginImageFile(file: File): boolean {
    return file.size > 0 && file.size <= loginImageUploadLimit && /\.(png|jpe?g|gif|svg|ico)$/i.test(file.name)
}

const publicPath = (import.meta.env.VITE_PUBLIC_PATH || '/').replace(/\/$/, '')

export const defaultLoginBranding: LoginBranding = {
    backgroundUrl: `${publicPath}/images/home/home-background.jpg`,
    logoUrl: `${publicPath}/images/commons/knowage-black.svg`,
    faviconUrl: `${publicPath}/favicon.ico`
}

export function isLoginImageUrl(value: string): boolean {
    if (!value) return true
    if (/[\s\\<>"']/.test(value) || Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return false
    if (/%(?![0-9a-f]{2})/i.test(value)) return false
    if (value.startsWith('/') && !value.startsWith('//')) return true
    if (!/^https?:\/\//i.test(value)) return false
    try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password
    } catch {
        return false
    }
}

export function normalizeLoginBranding(value: Partial<LoginBranding> = {}): LoginBranding {
    return {
        backgroundUrl: (value.backgroundUrl || '').trim(),
        logoUrl: (value.logoUrl || '').trim(),
        faviconUrl: (value.faviconUrl || '').trim()
    }
}

export function applyLoginFavicon(url?: string) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
    }
    if (link.dataset.loginDefaultHref === undefined) {
        link.dataset.loginDefaultHref = link.getAttribute('href') || defaultLoginBranding.faviconUrl
    }
    link.href = url || link.dataset.loginDefaultHref
}
