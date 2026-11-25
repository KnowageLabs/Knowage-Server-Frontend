import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { defineComponent } from 'vue'
import BirtFontManagement from './BirtFontManagement.vue'
import mainStore from '@/App.store'

const { get, post, remove } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), remove: vi.fn() }))
vi.mock('@/axios.js', () => ({ default: { get, post, delete: remove } }))

const QBtn = defineComponent({ name: 'q-btn', props: ['disable', 'icon'], template: '<button :disabled="disable"><slot /></button>' })
const QFile = defineComponent({ name: 'q-file', props: ['modelValue', 'disable'], emits: ['update:modelValue', 'rejected'], setup: () => ({ pickFiles: vi.fn() }), template: '<input type="file" :disabled="disable" />' })

describe('global BIRT font management', () => {
    let wrapper: ReturnType<typeof shallowMount>
    const requireConfirmation = vi.fn()
    const configuration = {
        items: [{ name: 'My Font.ttf', path: 'C:\\resources\\birt\\fonts\\My Font.ttf', size: 123 }],
        directory: 'C:\\resources\\birt\\fonts',
        configurationPath: 'C:\\resources\\birt\\fontsConfig.xml',
        restartRequired: true
    }

    beforeEach(() => {
        vi.clearAllMocks()
        get.mockResolvedValue({ data: configuration })
        post.mockResolvedValue({ data: { restartRequired: true } })
        remove.mockResolvedValue({ data: { restartRequired: true } })
    })
    afterEach(() => wrapper?.unmount())

    async function mountPage(isSuperadmin = true) {
        const pinia = createTestingPinia({ createSpy: vi.fn, initialState: { store: { user: { isSuperadmin } } } })
        wrapper = shallowMount(BirtFontManagement, {
            global: {
                plugins: [pinia],
                renderStubDefaultSlot: true,
                mocks: { $t: (key: string) => key, $confirm: { require: requireConfirmation } },
                stubs: { QBtn, QFile, QBanner: true, QLinearProgress: true, QTable: true, QTd: true, QToolbar: true, QToolbarTitle: true }
            }
        })
        await flushPromises()
    }

    it('loads global paths without tenant or theme parameters and explains the restart requirement', async () => {
        await mountPage()
        expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/restful-services\/birt\/fonts$/))
        expect(wrapper.text()).toContain(configuration.directory)
        expect(wrapper.text()).toContain(configuration.configurationPath)
        expect(wrapper.text()).toContain('managers.themeManagement.birt.restart')
        expect(wrapper.getComponent({ name: 'QTable' }).props('rows')).toEqual(configuration.items)
    })

    it('hides the panel and prevents all requests for a tenant administrator', async () => {
        await mountPage(false)
        expect(wrapper.text()).toBe('')
        await wrapper.vm.uploadFont(new File(['font'], 'font.ttf'))
        await wrapper.vm.deleteFont('font.ttf')
        wrapper.vm.confirmDelete('font.ttf')
        expect(get).not.toHaveBeenCalled()
        expect(post).not.toHaveBeenCalled()
        expect(remove).not.toHaveBeenCalled()
        expect(requireConfirmation).not.toHaveBeenCalled()
    })

    it('rechecks permissions before mutations', async () => {
        await mountPage()
        mainStore().user.isSuperadmin = false
        await wrapper.vm.uploadFont(new File(['font'], 'font.ttf'))
        await wrapper.vm.deleteFont('font.ttf')
        expect(post).not.toHaveBeenCalled()
        expect(remove).not.toHaveBeenCalled()
    })

    it('uploads one font and refreshes the server-generated file mapping', async () => {
        await mountPage()
        const file = new File(['font'], 'My Font.OTF')
        wrapper.getComponent(QFile).vm.$emit('update:modelValue', file)
        await flushPromises()
        const [url, body] = post.mock.calls[0]
        expect(url).toMatch(/\/birt\/fonts$/)
        expect(body.get('file')).toBe(file)
        expect(get).toHaveBeenCalledTimes(2)
        expect(wrapper.vm.busy).toBe(false)
    })

    it.each([
        new File(['font'], 'font.woff'),
        new File([], 'empty.ttf'),
        new File(['font'], '../font.ttf'),
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.ttf')
    ])('rejects invalid file names, formats and sizes before uploading', async (file) => {
        await mountPage()
        await wrapper.vm.uploadFont(file)
        expect(post).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('managers.themeManagement.birt.invalidFont')
    })

    it('requires confirmation and URL-encodes the exact stored filename when deleting', async () => {
        await mountPage()
        wrapper.vm.confirmDelete('My Font.ttf')
        expect(remove).not.toHaveBeenCalled()
        await requireConfirmation.mock.calls[0][0].accept()
        expect(remove).toHaveBeenCalledWith(expect.stringMatching(/\/birt\/fonts\/My%20Font\.ttf$/))
        expect(get).toHaveBeenCalledTimes(2)
    })

    it('blocks writes after a failed initial load', async () => {
        get.mockRejectedValueOnce(new Error('offline'))
        await mountPage()
        await wrapper.vm.uploadFont(new File(['font'], 'font.ttf'))
        expect(wrapper.text()).toContain('managers.themeManagement.birt.loadError')
        expect(post).not.toHaveBeenCalled()
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(true)
    })

    it('reports a duplicate without replacing the existing list', async () => {
        post.mockRejectedValueOnce({ response: { status: 409 } })
        await mountPage()
        await wrapper.vm.uploadFont(new File(['font'], 'My Font.ttf'))
        expect(wrapper.text()).toContain('managers.themeManagement.birt.duplicate')
        expect(wrapper.vm.fonts).toEqual(configuration.items)
        expect(wrapper.vm.busy).toBe(false)
    })

    it('distinguishes a saved mutation from a failed refresh and blocks further changes', async () => {
        get.mockResolvedValueOnce({ data: configuration }).mockRejectedValueOnce(new Error('offline'))
        await mountPage()
        await wrapper.vm.uploadFont(new File(['font'], 'font.ttf'))
        expect(post).toHaveBeenCalledOnce()
        expect(wrapper.text()).toContain('managers.themeManagement.birt.refreshError')
        expect(wrapper.vm.loaded).toBe(false)
        expect(wrapper.vm.busy).toBe(false)
        await wrapper.vm.uploadFont(new File(['font'], 'second.ttf'))
        expect(post).toHaveBeenCalledOnce()
    })

    it('keeps the list intact when deleting fails', async () => {
        remove.mockRejectedValueOnce(new Error('offline'))
        await mountPage()
        await wrapper.vm.deleteFont('My Font.ttf')
        expect(wrapper.text()).toContain('managers.themeManagement.birt.deleteError')
        expect(wrapper.vm.fonts).toEqual(configuration.items)
        expect(get).toHaveBeenCalledOnce()
        expect(wrapper.vm.busy).toBe(false)
    })
})
