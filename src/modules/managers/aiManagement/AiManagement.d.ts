export interface IGoldQuery {
    NL: string
    SQL: string
    tables: string[]
    columns: string[]
}

export interface IBmAiConfig {
    businessModelId: number
    enabled: boolean
    goldQueries: IGoldQuery[]
}
