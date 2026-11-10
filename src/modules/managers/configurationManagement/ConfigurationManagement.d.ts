export interface iConfiguration {
    id: number | null
    label: string
    name: string
    description: string
    valueCheck: string | null
    active: boolean | null
    category: string
    valueTypeId?: number | null
}

// The toolbar state, kept in the URL query (spec D6).
export interface iConfigurationQuery {
    category: string
    status: string[]
    value: string[]
    q: string
}

export type ConfigurationValueKind = 'password' | 'boolean' | 'long' | 'text'
