import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import type { Component } from 'vue'
import Button from 'primevue/button'
import PrimeVue from 'primevue/config'
import ImportDocumentsDialog from '../ImportDocumentsDialog.vue'
import ManagerImportDocumentsDialog from '@/modules/managers/importExportDocuments/importDialog/ImportDocumentsDialog.vue'

const { store, next } = vi.hoisted(() => ({
    store: { setLoading: vi.fn(), setError: vi.fn() },
    next: vi.fn()
}))

vi.mock('@/App.store', () => ({ default: () => store }))

const renderDatasourceStep = async (component: Component, exportedDatasources: { dsId: number }[], associatedDatasources: Record<number, unknown>) => {
    const http = { post: vi.fn().mockResolvedValue({ data: { STATUS: 'OK' } }) }
    const wrapper = shallowMount(component, {
        global: {
            plugins: [PrimeVue],
            components: { Button },
            mocks: { $http: http, $t: (key: string) => key },
            stubs: {
                Button: false,
                Dialog: { template: '<div><slot /></div>' },
                'q-step': true,
                'q-expansion-item': true,
                'q-card': true,
                'q-card-section': true,
                'q-stepper': { template: '<div><slot name="navigation" /></div>', methods: { next } },
                'q-stepper-navigation': { template: '<div><slot /></div>' }
            }
        }
    })
    await wrapper.setData({
        step: 4,
        importData: { datasources: { exportedDatasources, associatedDatasources, currentDatasources: [] } }
    })
    const nextButton = wrapper.findAllComponents(Button).find((button) => button.props('label') === 'common.next')!
    return { wrapper, http, nextButton }
}

const dialogs: { route: string; component: Component }[] = [
    { route: '/import-export/documents', component: ImportDocumentsDialog },
    { route: '/import-export-documents', component: ManagerImportDocumentsDialog }
]

describe.each(dialogs)('Import Documents datasource step ($route)', ({ component }) => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('allows Next without exported datasources and submits an empty association list', async () => {
        const { wrapper, http, nextButton } = await renderDatasourceStep(component, [], {})
        try {
            expect(nextButton.attributes()).not.toHaveProperty('disabled')

            await nextButton.trigger('click')
            await flushPromises()

            expect(http.post).toHaveBeenCalledWith(expect.stringContaining('/document/associateDatasources'), [])
            expect(next).toHaveBeenCalledOnce()
            expect(store.setError).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it.each([{}, { 1: null }, { 1: '' }])('keeps Next disabled when an exported datasource has no association: %j', async (associatedDatasources) => {
        const { wrapper, http, nextButton } = await renderDatasourceStep(component, [{ dsId: 1 }], associatedDatasources)
        try {
            expect(nextButton.attributes()).toHaveProperty('disabled')
            expect(http.post).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('preserves submission of complete datasource associations', async () => {
        const { wrapper, http, nextButton } = await renderDatasourceStep(component, [{ dsId: 1 }, { dsId: 2 }], { 1: { id: 11 }, 2: { dsId: 22 } })
        try {
            expect(nextButton.attributes()).not.toHaveProperty('disabled')

            await nextButton.trigger('click')
            await flushPromises()

            expect(http.post).toHaveBeenCalledWith(expect.stringContaining('/document/associateDatasources'), [
                { datasourceAssociateId: 11, expDatasourceId: '1' },
                { datasourceAssociateId: 22, expDatasourceId: '2' }
            ])
            expect(next).toHaveBeenCalledOnce()
        } finally {
            wrapper.unmount()
        }
    })
})
