import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ThemeManagement from './ThemeManagement.vue'

vi.mock('@/axios.js', () => ({ default: {} }))
vi.mock('@/helpers/themeHelper/themeHelper', () => ({
    default: class {
        descriptor = {}
        getDefaultKnowageTheme() {
            return {}
        }
        setTheme() {}
    }
}))

describe('BIRT section in theme management', () => {
    let wrapper: ReturnType<typeof shallowMount>
    afterEach(() => wrapper?.unmount())

    async function mountPage(isSuperadmin: boolean) {
        wrapper = shallowMount(ThemeManagement, {
            global: {
                plugins: [createTestingPinia({ createSpy: vi.fn, initialState: { store: { user: { isSuperadmin } } } })],
                mocks: { $t: (key: string) => key, $http: { get: vi.fn().mockResolvedValue({ data: [] }) } },
                stubs: { Toolbar: true, ProgressBar: true, Button: true, BirtFontManagement: true, ThemeManagementExamples: true, KnListBox: true, KnInputFile: true, KnHint: true, KnIconPicker: true }
            }
        })
        await flushPromises()
    }

    it('keeps normal theme management available without exposing BIRT to tenant admins', async () => {
        await mountPage(false)
        expect(wrapper.findComponent({ name: 'QTabs' }).exists()).toBe(false)
        expect(wrapper.findComponent({ name: 'birt-font-management' }).exists()).toBe(false)
        expect(wrapper.findComponent({ name: 'KnListBox' }).exists()).toBe(true)
    })

    it('lets the superadmin open BIRT independently of the selected theme', async () => {
        await mountPage(true)
        wrapper.getComponent({ name: 'QTabs' }).vm.$emit('update:modelValue', 'birt')
        await flushPromises()
        expect(wrapper.findComponent({ name: 'birt-font-management' }).exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'KnListBox' }).exists()).toBe(false)
    })

    it('preserves unsaved theme settings when switching to BIRT and back', async () => {
        await mountPage(true)
        const theme = { themeName: 'Unsaved theme', config: { color: '#123456' } }
        await wrapper.setData({ selectedTheme: theme, themeToSend: theme })
        const tabs = wrapper.getComponent({ name: 'QTabs' })
        tabs.vm.$emit('update:modelValue', 'birt')
        await flushPromises()
        tabs.vm.$emit('update:modelValue', 'themes')
        await flushPromises()
        expect(wrapper.vm.selectedTheme).toEqual(theme)
        expect(wrapper.vm.themeToSend).toEqual(theme)
        expect(wrapper.findComponent({ name: 'ThemeManagementExamples' }).exists()).toBe(true)
    })
})
