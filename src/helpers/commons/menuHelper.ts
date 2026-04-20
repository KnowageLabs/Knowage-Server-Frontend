export function normalizeMenuLocale(locale: string | null | undefined, fallbackLocale = 'en-US'): string {
    const initialLocale = typeof locale === 'string' && locale.trim() ? locale : fallbackLocale
    let normalizedLocale = initialLocale.replaceAll('_', '-')
    const splittedLocale = normalizedLocale.split('-')

    if (splittedLocale.length > 2) {
        normalizedLocale = `${splittedLocale[0]}-${splittedLocale[2].replaceAll('#', '')}-${splittedLocale[1]}`
    }

    return normalizedLocale
}

export function normalizeMenuRoute(to: string | null | undefined): string {
    return typeof to === 'string' ? to.replace(/\\\//g, '/') : ''
}
