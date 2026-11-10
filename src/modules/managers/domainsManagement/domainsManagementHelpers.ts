import { normalize } from '../managerListHelpers'
import { DomainNameKind, iDomain, iDomainBand, iDomainsQuery } from './DomainsManagement'

export const LIMITS = { valueCd: 100, valueName: 40, valueDescription: 160, domainCode: 20, domainName: 40 }

// The value of "+ New domain…" in the Domain select of the dialog.
export const NEW_DOMAIN = '__new'

export const isI18nKey = (text: string | null | undefined): boolean => /^sbidomains\./i.test((text ?? '').trim())

// A text that the GET translated (the translation differs from the stored text).
const translated = (stored: string | null | undefined, translation: string | null | undefined): boolean => !!translation && translation !== stored

export function nameKind(row: iDomain): DomainNameKind {
    if (translated(row.valueName, row.translatedValueName)) return 'key'
    if (isI18nKey(row.valueName)) return 'missing'
    return 'plain'
}

export const displayName = (row: iDomain): string => (nameKind(row) === 'key' ? (row.translatedValueName as string) : row.valueName)
export const displayDescription = (row: iDomain): string => (translated(row.valueDescription, row.translatedValueDescription) ? (row.translatedValueDescription as string) : row.valueDescription)

// The name of a domain: its rows store it one by one, and a few domains have more than one (spec 2.2).
export function domainLabels(rows: iDomain[]): Map<string, string> {
    const counts = new Map<string, Map<string, number>>()
    rows.forEach((row) => {
        const names = counts.get(row.domainCode) ?? new Map<string, number>()
        names.set(row.domainName, (names.get(row.domainName) ?? 0) + 1)
        counts.set(row.domainCode, names)
    })
    const labels = new Map<string, string>()
    counts.forEach((names, code) => labels.set(code, [...names.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || code))
    return labels
}

export const inDomain = (row: iDomain, domain: string): boolean => !domain || row.domainCode === domain

export function matchesSearch(row: iDomain, q: string): boolean {
    const term = normalize(q.trim())
    if (!term) return true
    return normalize(`${row.valueCd} ${row.valueName} ${row.translatedValueName ?? ''} ${row.valueDescription} ${row.translatedValueDescription ?? ''}`).includes(term)
}

export function filterValues(rows: iDomain[], query: iDomainsQuery): iDomain[] {
    return rows.filter((row) => inDomain(row, query.domain) && (!query.name.length || query.name.includes(nameKind(row))) && matchesSearch(row, query.q))
}

// "All domains": a band in front of each domain, domains by name, values in server order.
export function withBands(rows: iDomain[], labels: Map<string, string>): (iDomain | iDomainBand)[] {
    const byCode = new Map<string, iDomain[]>()
    rows.forEach((row) => byCode.set(row.domainCode, [...(byCode.get(row.domainCode) ?? []), row]))
    const codes = [...byCode.keys()].sort((a, b) => (labels.get(a) ?? a).localeCompare(labels.get(b) ?? b, undefined, { sensitivity: 'base' }))
    return codes.flatMap((code) => {
        const values = byCode.get(code) as iDomain[]
        return [{ band: true as const, key: 'band:' + code, code, label: labels.get(code) ?? code, count: values.length }, ...values]
    })
}

export const isBand = (item: iDomain | iDomainBand): item is iDomainBand => (item as iDomainBand).band === true
