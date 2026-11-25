import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ThemeManagement from './ThemeManagement.vue'

vi.mock('@/axios.js', () => ({ default: {} }))
vi.mock('@/helpers/themeHelper/themeHelper', () => ({
    default: class {
        descriptor = { general: { label: 'General', properties: [{ key: 'color', label: 'Color', type: 'color' }] } }
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
                mocks: { $t: (key: string) => key === 'managers.themeManagement.birt.title' ? 'Birt' : key, $http: { get: vi.fn().mockResolvedValue({ data: [] }) } },
                stubs: { Toolbar: true, ProgressBar: true, Button: true, BirtFontManagement: true, ThemeManagementExamples: true, KnListBox: true, KnInputFile: true, KnHint: true, KnIconPicker: true }
            }
        })
        await flushPromises()
    }

    it('keeps normal theme management available without exposing BIRT to tenant admins', async () => {
        await mountPage(false)
        expect(wrapper.findComponent({ name: 'QTabs' }).exists()).toBe(false)
        expect(wrapper.find('[data-test="birt-accordion"]').exists()).toBe(false)
        expect(wrapper.findComponent({ name: 'birt-font-management' }).exists()).toBe(false)
        expect(wrapper.findComponent({ name: 'KnListBox' }).exists()).toBe(true)
    })

    it('opens Birt inside the settings accordion without tabs or a selected theme', async () => {
        await mountPage(true)
        expect(wrapper.findComponent({ name: 'QTabs' }).exists()).toBe(false)
        const accordion = wrapper.get('.theme-settings-content [data-test="birt-accordion"]')
        expect(accordion.get('button').text()).toBe('Birt')
        expect(accordion.get('button').attributes('aria-expanded')).toBe('false')
        expect(wrapper.findComponent({ name: 'birt-font-management' }).exists()).toBe(false)
        await accordion.get('button').trigger('click')
        expect(accordion.get('button').attributes('aria-expanded')).toBe('true')
        expect(accordion.getComponent({ name: 'birt-font-management' }).exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'KnListBox' }).exists()).toBe(true)
    })

    it('preserves unsaved theme settings and other accordion sections when opening and closing Birt', async () => {
        await mountPage(true)
        const theme = { themeName: 'Unsaved theme', config: { color: '#123456' } }
        await wrapper.setData({ selectedTheme: theme, themeToSend: theme })
        const headers = wrapper.findAll('.theme-settings-section-header')
        expect(headers).toHaveLength(2)
        await headers[0].trigger('click')
        await headers[1].trigger('click')
        expect(headers[0].attributes('aria-expanded')).toBe('true')
        expect(wrapper.findComponent({ name: 'birt-font-management' }).exists()).toBe(true)
        await headers[1].trigger('click')
        expect(wrapper.vm.selectedTheme).toEqual(theme)
        expect(wrapper.vm.themeToSend).toEqual(theme)
        expect(wrapper.findComponent({ name: 'ThemeManagementExamples' }).exists()).toBe(true)
    })

    it('includes Birt in the settings search and expands matching results', async () => {
        await mountPage(true)
        await wrapper.setData({ settingsSearch: 'bIrT' })
        expect(wrapper.get('[data-test="birt-accordion"]').get('button').attributes('aria-expanded')).toBe('true')
        expect(wrapper.findComponent({ name: 'birt-font-management' }).exists()).toBe(true)
        await wrapper.setData({ settingsSearch: 'unknown settings' })
        expect(wrapper.find('[data-test="birt-accordion"]').exists()).toBe(false)
        expect(wrapper.text()).toContain('common.info.noDataFound')
    })
})
