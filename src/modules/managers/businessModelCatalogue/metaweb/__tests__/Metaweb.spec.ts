import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { generate, observe } from 'fast-json-patch'
import Metaweb from '../Metaweb.vue'

vi.mock('../businessModel/MetawebBusinessModel.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../physicalModel/MetawebPhysicalModel.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../invalidRelationshipsDialog/MetawebInvalidRelationshipsDialog.vue', () => ({ default: { template: '<div />' } }))

describe('Metaweb domain persistence flow', () => {
    beforeEach(() => setActivePinia(createPinia()))

    it('applies the relationship-check patch to the model, not to the JSON patch observer', async () => {
        const meta = { businessDomains: [{ name: 'Sales', tables: ['orders'] }] }
        const post = vi.fn().mockResolvedValue({
            data: { incorrectRelationships: [], patch: JSON.stringify([{ op: 'replace', path: '/businessDomains/0/name', value: 'Commercial' }]) }
        })
        const wrapper = mount(Metaweb, {
            props: { visible: true, propMeta: meta, businessModel: { name: 'Model', id: 1 } },
            global: {
                mocks: { $t: (key: string) => key, $http: { post } },
                directives: { tooltip: {} },
                stubs: { Dialog: true, TabView: true, TabPanel: true, Toolbar: true, Button: true, ProgressBar: true }
            }
        })
        const observer = wrapper.vm.observer

        await wrapper.vm.checkRelationships(false)

        expect(meta.businessDomains[0].name).toBe('Commercial')
        expect(wrapper.vm.observer).toBe(observer)
        expect(generate(observer)).toEqual([])
        expect(wrapper.vm.loading).toBe(false)
        expect(wrapper.vm.metaUpdated).toBe(true)
        wrapper.unmount()
    })

    it('does not proxy the observer identity when it is stored in component data', () => {
        const meta = { businessDomains: [] }
        const wrapper = mount(Metaweb, {
            props: { visible: false, propMeta: meta, businessModel: { name: 'Model', id: 1 } },
            global: { mocks: { $t: (key: string) => key }, directives: { tooltip: {} }, stubs: { Dialog: true, Button: true, Toolbar: true, ProgressBar: true } }
        })
        expect(wrapper.vm.observer).toBe(observe(wrapper.vm.meta))
        expect(() => generate(wrapper.vm.observer)).not.toThrow()
        wrapper.unmount()
    })

    it('persists the model after a successful relationship check', async () => {
        const post = vi.fn().mockResolvedValueOnce({ data: { incorrectRelationships: [], patch: '[]' } }).mockResolvedValueOnce({ data: {} })
        const wrapper = mount(Metaweb, {
            props: { visible: false, propMeta: { businessDomains: [] }, businessModel: { name: 'Model', id: 1 } },
            global: {
                mocks: { $t: (key: string) => key, $http: { post } },
                directives: { tooltip: {} },
                stubs: { Dialog: true, Button: true, Toolbar: true, ProgressBar: true }
            }
        })
        await wrapper.vm.metadataSave()
        expect(post.mock.calls.map((call) => call[0])).toEqual([
            expect.stringContaining('/metaWeb/checkRelationships'),
            expect.stringContaining('/metaWeb/generateModel')
        ])
        expect(post.mock.calls[1][1]).toMatchObject({ data: { name: 'Model', id: 1 }, diff: [] })
        expect(wrapper.emitted('modelGenerated')).toHaveLength(1)
        wrapper.unmount()
    })

    it('reports a malformed check response without saving the model', async () => {
        const post = vi.fn().mockResolvedValue({ data: { incorrectRelationships: [], patch: 'invalid' } })
        const wrapper = mount(Metaweb, {
            props: { visible: false, propMeta: { businessDomains: [] }, businessModel: { name: 'Model', id: 1 } },
            global: {
                mocks: { $t: (key: string) => key, $http: { post } },
                directives: { tooltip: {} },
                stubs: { Dialog: true, Button: true, Toolbar: true, ProgressBar: true }
            }
        })
        const reportError = vi.spyOn(wrapper.vm, 'reportError')
        await wrapper.vm.metadataSave()
        expect(reportError).toHaveBeenCalledWith(expect.any(SyntaxError))
        expect(post).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('modelGenerated')).toBeUndefined()
        expect(wrapper.vm.loading).toBe(false)
        wrapper.unmount()
    })
})
