import { describe, expect, it } from 'vitest'
import { getRegistryRenderedRowLimit, normalizeRegistryPaginationState, shouldUseServerPagination } from '../RegistryPaginationHelper'

describe('RegistryPaginationHelper', () => {
    it('treats registryConfig.pagination object presence as enabled pagination', () => {
        const pagination = normalizeRegistryPaginationState({ limit: '25', total: '120' }, { start: 40, limit: 15, size: 0 })

        expect(pagination).toEqual({
            enabled: true,
            start: 40,
            limit: 25,
            size: 120
        })
    })

    it('keeps pagination disabled when the backend config explicitly disables it', () => {
        const pagination = normalizeRegistryPaginationState({ enabled: 'false' }, { start: 10, limit: 20, size: 0 }, 85)

        expect(pagination).toEqual({
            enabled: false,
            start: 10,
            limit: 20,
            size: 85
        })
    })

    it('uses server pagination whenever the config enables it or the result set exceeds the threshold', () => {
        expect(shouldUseServerPagination({ enabled: true, start: 0, limit: 20, size: 40 })).toBe(true)
        expect(shouldUseServerPagination({ enabled: false, start: 0, limit: 20, size: 40 })).toBe(false)
        expect(shouldUseServerPagination({ enabled: false, start: 0, limit: 20, size: 450 })).toBe(true)
    })

    it('limits rendered rows to the configured page size for paginated registries', () => {
        expect(getRegistryRenderedRowLimit({ enabled: true, start: 0, limit: 25, size: 80 }, 80)).toBe(25)
        expect(getRegistryRenderedRowLimit({ enabled: false, start: 0, limit: 25, size: 80 }, 80)).toBe(80)
    })
})
