import { describe, expect, it, vi } from 'vitest'
import RegistryDatatable from './RegistryDatatable.vue'

describe('RegistryDatatable pagination', () => {
    const computed = RegistryDatatable.computed
    const methods = RegistryDatatable.methods

    it('shows the bottom paginator only when the registry pagination config enables it', () => {
        expect(computed.paginatorEnabled.call({ lazyParams: { enabled: true } })).toBe(true)
        expect(computed.paginatorEnabled.call({ lazyParams: { enabled: false } })).toBe(false)
    })

    it('emits explicit page navigation requests from the paginator', () => {
        const emit = vi.fn()
        const context = {
            lazyParams: { enabled: true, size: 60 },
            rowsPerPage: 20,
            $emit: emit
        }

        methods.onPageChangeByPage.call(context, 2)

        expect(emit).toHaveBeenCalledWith('pageChanged', {
            enabled: true,
            size: 60,
            start: 20,
            limit: 20,
            paginationStart: 20,
            paginationLimit: 20,
            paginationEnd: 40
        })
    })
})
