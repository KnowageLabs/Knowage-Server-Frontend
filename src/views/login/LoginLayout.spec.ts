import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LoginLayout from './LoginLayout.vue'
import { defaultLoginBranding } from '@/helpers/commons/loginBranding'

describe('shared login layout', () => {
    it('previews custom images and falls back when either image is unavailable', async () => {
        const wrapper = shallowMount(LoginLayout, {
            props: { preview: true, backgroundUrl: '/missing.jpg', logoUrl: '/missing.svg' },
            global: { renderStubDefaultSlot: true, stubs: ['q-scroll-area', 'q-card', 'q-card-section'] }
        })
        expect(wrapper.classes()).toContain('login-preview')
        expect(wrapper.get('.login-background').attributes('src')).toBe('/missing.jpg')
        expect(wrapper.get('.logo').attributes('src')).toBe('/missing.svg')
        await wrapper.get('.login-background').trigger('error')
        await wrapper.get('.logo').trigger('error')
        expect(wrapper.get('.login-background').attributes('src')).toBe(defaultLoginBranding.backgroundUrl)
        expect(wrapper.get('.logo').attributes('src')).toBe(defaultLoginBranding.logoUrl)

        await wrapper.setProps({ logoUrl: '/new-logo.svg' })
        expect(wrapper.get('.logo').attributes('src')).toBe('/new-logo.svg')
        wrapper.unmount()
    })
})
