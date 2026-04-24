import { describe, expect, it, vi } from 'vitest'
import KnPivotTable from '../KnPivotTable.vue'

describe('KnPivotTable pagination', () => {
    const methods = (KnPivotTable as any).methods

    it('enables the paginator from the normalized registry pagination state', () => {
        const context = {
            pagination: { enabled: true, start: 40, limit: 20, size: 120 },
            lazyParams: {},
            paginatorEnabled: false,
            first: 0
        }

        methods.loadPagination.call(context)

        expect(context.lazyParams).toEqual({ enabled: true, start: 40, limit: 20, size: 120 })
        expect(context.paginatorEnabled).toBe(true)
    })

    it('emits the next page request preserving page size and enabled state', () => {
        const emit = vi.fn()
        const context = {
            lazyParams: { enabled: true, size: 120, start: 0 },
            rowsPerPage: 20,
            $emit: emit
        }

        methods.onPageChange.call(context, 2)

        expect(emit).toHaveBeenCalledWith('pageChanged', {
            paginationStart: 20,
            paginationLimit: 20,
            paginationEnd: 40,
            size: 120,
            enabled: true
        })
    })
})
