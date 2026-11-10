import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import LoginPageManagement from './LoginPageManagement.vue'
import routes from './LoginPageManagement.routes.js'

const { get, put, post, setInfo, user } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), setInfo: vi.fn(), user: { isSuperadmin: true } }))
vi.mock('@/axios.js', () => ({ default: { get, put, post } }))
vi.mock('@/App.store', () => ({ default: () => ({ setInfo, user }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const QInput = defineComponent({ name: 'q-input', props: ['modelValue', 'disable'], emits: ['update:modelValue'], template: '<div><input :value="modelValue" :disabled="disable" /><slot name="after" /></div>' })
const QBtn = defineComponent({ name: 'q-btn', props: ['disable', 'icon', 'loading'], template: '<button :disabled="disable || loading"><slot /></button>' })
const QFile = defineComponent({ name: 'q-file', props: ['modelValue', 'disable'], emits: ['update:modelValue', 'rejected'], setup: () => ({ pickFiles: vi.fn() }), template: '<input type="file" :disabled="disable" />' })

describe('login page management', () => {
    let wrapper: ReturnType<typeof shallowMount>
    const savedConfig = { backgroundUrl: '/bg.jpg', logoUrl: '/logo.svg', faviconUrl: '' }

    beforeEach(() => {
        vi.clearAllMocks()
        user.isSuperadmin = true
        get.mockResolvedValue({ data: { items: [{ ...savedConfig }] } })
        put.mockImplementation(async (_url, data) => ({ data }))
        post.mockResolvedValue({ data: { url: '/knowage/restful-services/loginconfig/images/uploaded.png' } })
    })
    afterEach(() => wrapper?.unmount())

    async function mountPage() {
        wrapper = shallowMount(LoginPageManagement, {
            global: {
                renderStubDefaultSlot: true,
                mocks: { $t: (key: string) => key },
                stubs: { QInput, QBtn, QFile, QTooltip: true, QBtnToggle: true, QSpace: true, QToolbar: true, QToolbarTitle: true, QLinearProgress: true, QBanner: true, QCard: true, QCardSection: true, QIcon: true, QChip: true, QSeparator: true, LoginLayout: true }
            }
        })
        await flushPromises()
    }

    it('loads saved branding, updates the shared preview, and persists trimmed URLs', async () => {
        await mountPage()
        const inputs = wrapper.findAllComponents(QInput)
        expect(inputs[0].props('modelValue')).toBe('/bg.jpg')
        inputs[1].vm.$emit('update:modelValue', ' /new-logo.svg ')
        await nextTick()
        expect(wrapper.getComponent({ name: 'LoginLayout' }).props('logoUrl')).toBe('/new-logo.svg')
        await wrapper.findAllComponents(QBtn)[1].trigger('click')
        await flushPromises()
        expect(put).toHaveBeenCalledWith(expect.stringContaining('/loginconfig/branding'), { ...savedConfig, logoUrl: '/new-logo.svg' })
        expect(setInfo).toHaveBeenCalledOnce()
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(true)
    })

    it('stages restoring defaults until the user saves', async () => {
        await mountPage()
        await wrapper.findAllComponents(QBtn)[0].trigger('click')
        expect(put).not.toHaveBeenCalled()
        await wrapper.findAllComponents(QBtn)[1].trigger('click')
        await flushPromises()
        expect(put).toHaveBeenCalledWith(expect.any(String), { backgroundUrl: '', logoUrl: '', faviconUrl: '' })
    })

    it.each(['javascript:alert(1)', `https://example.com/${'x'.repeat(1000)}`])('prevents saving invalid or oversized configuration', async (value) => {
        await mountPage()
        wrapper.findAllComponents(QInput)[0].vm.$emit('update:modelValue', value)
        await nextTick()
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(true)
        await wrapper.findAllComponents(QBtn)[1].trigger('click')
        expect(put).not.toHaveBeenCalled()
    })

    it('does not allow overwriting configuration after a failed load', async () => {
        get.mockRejectedValueOnce(new Error('offline'))
        await mountPage()
        expect(wrapper.text()).toContain('managers.loginPageManagement.loadError')
        expect(wrapper.findAllComponents(QBtn)[0].props('disable')).toBe(true)
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(true)
    })

    it('preserves unsaved changes when saving fails', async () => {
        put.mockRejectedValueOnce(new Error('offline'))
        await mountPage()
        wrapper.findAllComponents(QInput)[1].vm.$emit('update:modelValue', '/new.svg')
        await nextTick()
        await wrapper.findAllComponents(QBtn)[1].trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('managers.loginPageManagement.saveError')
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(false)
        expect(setInfo).not.toHaveBeenCalled()
    })

    it('allows only the superadmin to enter the management route', () => {
        expect(routes[0].beforeEnter()).toBe(true)
        user.isSuperadmin = false
        expect(routes[0].beforeEnter()).toEqual({ name: '404', replace: true })
    })

    it.each([
        [0, 'backgroundUrl'],
        [1, 'logoUrl'],
        [2, 'faviconUrl']
    ])('opens only the matching picker with compact upload button %s', async (index, field) => {
        await mountPage()
        const buttons = wrapper.findAllComponents(QBtn).filter((button) => button.props('icon') === 'file_upload')
        expect(buttons).toHaveLength(3)
        expect(buttons[Number(index)].attributes('aria-label')).toContain(`managers.loginPageManagement.${field}`)
        await buttons[Number(index)].trigger('click')
        wrapper.findAllComponents(QFile).forEach((picker, pickerIndex) => {
            expect(picker.vm.pickFiles).toHaveBeenCalledTimes(pickerIndex === Number(index) ? 1 : 0)
        })
    })

    it.each([
        [0, 'backgroundUrl'],
        [1, 'logoUrl'],
        [2, 'faviconUrl']
    ])('uploads image %s and stages its URL until save', async (index, field) => {
        await mountPage()
        const file = new File(['image'], 'logo.png', { type: 'image/png' })
        wrapper.findAllComponents(QFile)[Number(index)].vm.$emit('update:modelValue', file)
        await flushPromises()
        expect(post).toHaveBeenCalledOnce()
        const [url, body] = post.mock.calls[0]
        expect(url).toContain('/loginconfig/images')
        expect(body.get('file')).toBe(file)
        expect(wrapper.findAllComponents(QInput)[Number(index)].props('modelValue')).toBe('/knowage/restful-services/loginconfig/images/uploaded.png')
        expect(put).not.toHaveBeenCalled()
        await wrapper.findAllComponents(QBtn)[1].trigger('click')
        await flushPromises()
        expect(put).toHaveBeenCalledWith(expect.any(String), { ...savedConfig, [field]: '/knowage/restful-services/loginconfig/images/uploaded.png' })
    })

    it('keeps the previous URL if an upload fails', async () => {
        post.mockRejectedValueOnce(new Error('invalid image'))
        await mountPage()
        wrapper.findAllComponents(QFile)[1].vm.$emit('update:modelValue', new File(['image'], 'logo.png'))
        await flushPromises()
        expect(wrapper.findAllComponents(QInput)[1].props('modelValue')).toBe('/logo.svg')
        expect(wrapper.text()).toContain('managers.loginPageManagement.uploadError')
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(true)
    })

    it('rejects invalid file types before uploading', async () => {
        await mountPage()
        wrapper.findAllComponents(QFile)[0].vm.$emit('update:modelValue', new File(['html'], 'page.html'))
        await flushPromises()
        expect(post).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('managers.loginPageManagement.invalidImage')
    })

    it('prevents saves and additional uploads until the current upload finishes', async () => {
        let finishUpload!: (value: any) => void
        post.mockReturnValueOnce(new Promise((resolve) => (finishUpload = resolve)))
        await mountPage()
        const file = new File(['image'], 'logo.png')
        wrapper.findAllComponents(QFile)[0].vm.$emit('update:modelValue', file)
        await nextTick()
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(true)
        expect(wrapper.findAllComponents(QFile)[1].props('disable')).toBe(true)
        const buttons = wrapper.findAllComponents(QBtn).filter((button) => button.props('icon') === 'file_upload')
        expect(buttons.every((button) => button.props('disable'))).toBe(true)
        expect(buttons[0].props('loading')).toBe(true)
        await buttons[1].trigger('click')
        expect(wrapper.findAllComponents(QFile)[1].vm.pickFiles).not.toHaveBeenCalled()
        wrapper.findAllComponents(QFile)[1].vm.$emit('update:modelValue', file)
        await flushPromises()
        expect(post).toHaveBeenCalledOnce()
        finishUpload({ data: { url: '/uploaded.png' } })
        await flushPromises()
        expect(wrapper.findAllComponents(QBtn)[1].props('disable')).toBe(false)
    })

    it('offers a mobile preview without exceeding the available width', async () => {
        await mountPage()
        wrapper.getComponent({ name: 'QBtnToggle' }).vm.$emit('update:modelValue', 'mobile')
        await nextTick()
        expect(wrapper.get('.lpm-preview-viewport').attributes('style')).toContain('max-width: 375px')
    })
})
