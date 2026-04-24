import registryDescriptor from './RegistryDescriptor.json'

export interface IRegistryPaginationState {
    enabled: boolean
    start: number
    limit: number
    size: number
}

function getNumberValue(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null

    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : null
}

function getFirstNumberValue(...values: unknown[]): number | null {
    for (const value of values) {
        const parsedValue = getNumberValue(value)
        if (parsedValue !== null) return parsedValue
    }

    return null
}

function getBooleanValue(value: unknown): boolean | null {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true
        if (value.toLowerCase() === 'false') return false
    }

    return null
}

export function normalizeRegistryPaginationState(rawPagination: unknown, currentPagination?: Partial<IRegistryPaginationState>, totalResults?: unknown): IRegistryPaginationState {
    const paginationConfig = typeof rawPagination === 'object' && rawPagination !== null ? (rawPagination as Record<string, unknown>) : {}
    const defaultLimit = registryDescriptor.paginationNumberOfItems

    const enabled =
        getBooleanValue(rawPagination) ??
        getBooleanValue(paginationConfig.enabled) ??
        getBooleanValue(paginationConfig.isEnabled) ??
        getBooleanValue(paginationConfig.active) ??
        (typeof rawPagination === 'object' && rawPagination !== null)

    const start = Math.max(0, getFirstNumberValue(paginationConfig.start, paginationConfig.offset, paginationConfig.first, currentPagination?.start, 0) ?? 0)
    const limit = Math.max(1, getFirstNumberValue(paginationConfig.limit, paginationConfig.itemsNumber, paginationConfig.pageSize, paginationConfig.rows, currentPagination?.limit, defaultLimit) ?? defaultLimit)
    const size = Math.max(0, getFirstNumberValue(paginationConfig.size, paginationConfig.total, paginationConfig.totalRows, paginationConfig.totalRecords, totalResults, currentPagination?.size, 0) ?? 0)

    return {
        enabled,
        start,
        limit,
        size
    }
}

export function shouldUseServerPagination(pagination: IRegistryPaginationState): boolean {
    return pagination.enabled || pagination.size > registryDescriptor.paginationLimit
}

export function getRegistryRenderedRowLimit(pagination: IRegistryPaginationState, availableRowsLength: number): number {
    if (pagination.enabled) return Math.min(availableRowsLength, pagination.limit)
    if (pagination.size <= registryDescriptor.paginationLimit) return availableRowsLength

    return Math.min(availableRowsLength, registryDescriptor.paginationNumberOfItems)
}
