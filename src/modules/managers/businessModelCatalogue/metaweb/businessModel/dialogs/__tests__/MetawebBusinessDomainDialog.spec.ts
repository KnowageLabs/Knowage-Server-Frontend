import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { observe } from 'fast-json-patch'
import { markRaw } from 'vue'
import MetawebBusinessDomainDialog from '../MetawebBusinessDomainDialog.vue'

const store = vi.hoisted(() => ({ setInfo: vi.fn(), setError: vi.fn() }))
vi.mock('@/App.store', () => ({ default: () => store }))

const renderDialog = (editing = false) => {
    const domain = { id: 'domain-id', name: 'Sales', uniqueName: 'Sales', description: 'Sales area', tables: ['orders'] }
    const meta = {
        businessModels: [{ name: 'Orders', uniqueName: 'orders' }],
        businessViews: [{ name: 'Summary', uniqueName: 'summary' }],
        businessDomains: editing ? [domain] : []
    }
    const post = vi.fn()
    const wrapper = mount(MetawebBusinessDomainDialog, {
        props: { showBusinessDomainDialog: true, meta, observer: markRaw(observe(meta)), selectedBusinessDomain: editing ? domain : null },
        global: {
            mocks: { $t: (key: string) => key, $http: { post } },
            stubs: {
                Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
                Button: { template: '<button />' },
                Toolbar: true,
                InputText: true,
                MultiSelect: { inheritAttrs: false, template: '<div />' },
                KnValidationMessages: true
            }
        }
    })
    return { wrapper, meta, post, domain }
}

describe('Metaweb business domains', () => {
    beforeEach(() => vi.clearAllMocks())

    it('offers both business classes and views and prevents invalid saves', async () => {
        const { wrapper, post } = renderDialog()
        await flushPromises()
        expect(wrapper.vm.businessElementOptions.map((option) => option.value)).toEqual(['orders', 'summary'])
        expect(wrapper.vm.buttonDisabled).toBe(true)
        await wrapper.vm.saveBusinessDomain()
        expect(post).not.toHaveBeenCalled()
        wrapper.unmount()
    })

    it('applies the backend patch to the observed model before notifying the parent', async () => {
        const { wrapper, meta, post, domain } = renderDialog()
        wrapper.vm.v$.tmpBusinessDomain.name.$model = domain.name
        wrapper.vm.tmpBusinessDomain.tables = ['orders', 'summary']
        await flushPromises()
        expect(wrapper.vm.v$.tmpBusinessDomain.name.$invalid).toBe(false)
        expect(wrapper.vm.buttonDisabled).toBe(false)
        post.mockResolvedValue({ data: [{ op: 'add', path: '/businessDomains/0', value: domain }] })

        await wrapper.vm.saveBusinessDomain()

        expect(post.mock.calls[0][0]).toContain('/metaWeb/saveBusinessDomain')
        expect(post.mock.calls[0][1].data).toMatchObject({ name: 'Sales', uniqueName: null, tables: ['orders', 'summary'] })
        expect(meta.businessDomains).toEqual([domain])
        expect(wrapper.emitted('saved')).toHaveLength(1)
        expect(wrapper.emitted('closeDialog')).toHaveLength(1)
        expect(store.setInfo).toHaveBeenCalled()
        expect(wrapper.vm.saving).toBe(false)
        wrapper.unmount()
    })

    it('keeps the original identity when renaming a domain without mutating the selection', async () => {
        const { wrapper, post, domain } = renderDialog(true)
        wrapper.vm.tmpBusinessDomain.name = 'Commercial'
        wrapper.vm.tmpBusinessDomain.tables.push('summary')
        await flushPromises()
        post.mockResolvedValue({ data: [] })
        await wrapper.vm.saveBusinessDomain()
        expect(post.mock.calls[0][1].data).toMatchObject({ id: 'domain-id', uniqueName: 'Sales', originalName: 'Sales', name: 'Commercial' })
        expect(domain.name).toBe('Sales')
        expect(domain.tables).toEqual(['orders'])
        wrapper.unmount()
    })

    it('keeps the dialog open and reports a failed save', async () => {
        const { wrapper, post } = renderDialog(true)
        post.mockRejectedValue(new Error('Save failed'))
        await wrapper.vm.saveBusinessDomain()
        expect(store.setError).toHaveBeenCalledWith({ title: 'common.toast.errorTitle', msg: 'Save failed' })
        expect(wrapper.emitted('saved')).toBeUndefined()
        expect(wrapper.emitted('closeDialog')).toBeUndefined()
        expect(wrapper.vm.saving).toBe(false)
        wrapper.unmount()
    })

    it('rejects whitespace-only names even when entities are selected', async () => {
        const { wrapper, post } = renderDialog(true)
        wrapper.vm.v$.tmpBusinessDomain.name.$model = '   '
        await flushPromises()
        expect(wrapper.vm.v$.tmpBusinessDomain.name.$model).toBe('   ')
        expect(wrapper.vm.buttonDisabled).toBe(true)
        await wrapper.vm.saveBusinessDomain()
        expect(post).not.toHaveBeenCalled()
        wrapper.unmount()
    })
})
