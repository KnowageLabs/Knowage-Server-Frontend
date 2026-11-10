export interface iDomain {
    valueId: number | null
    valueCd: string
    valueName: string
    domainCode: string
    domainName: string
    valueDescription: string
    // read only, translated in the user's language by the GET
    translatedValueName?: string
    translatedValueDescription?: string
}

// The toolbar state, kept in the URL query (spec D6).
export interface iDomainsQuery {
    domain: string
    name: string[]
    q: string
}

export type DomainNameKind = 'key' | 'plain' | 'missing'

// A grey band in front of each domain when every domain is shown (spec D12).
export interface iDomainBand {
    band: true
    key: string
    code: string
    label: string
    count: number
}
