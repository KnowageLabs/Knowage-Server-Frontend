import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import Login from './Login.vue'

const { config, route, completeLogin, clearCache, exchange, begin, loadConfig, preloadImage, exchangeAuthorizationCode } = vi.hoisted(() => ({
    config: { items: [{ samlActive: true, ssoActive: true, samlLoginUrl: '/saml/login', samlExchangeUrl: '/saml/exchange', authorizeUrl: 'https://oidc.example/login' }] },
    route: { query: {} },
    completeLogin: vi.fn(),
    clearCache: vi.fn(),
    exchange: vi.fn(),
    begin: vi.fn(),
    loadConfig: vi.fn(),
    preloadImage: vi.fn(),
    exchangeAuthorizationCode: vi.fn()
}))

vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/App.store', () => ({ default: () => ({ storeClearIndexedDBCache: clearCache }) }))
vi.mock('@/helpers/commons/samlAuth', () => ({ beginSamlLogin: begin, exchangeSamlCode: exchange }))
vi.mock('@/composables/useLoginConfig', () => ({
    useLoginConfig: () => {
        const loginConfig = ref<any>(null)
        return {
            loginConfig,
            samlActive: computed(() => String(loginConfig.value?.items?.[0]?.samlActive).toLowerCase() === 'true'),
            backgroundUrl: ref(''),
            backgroundLoaded: ref(true),
            preloadImage,
            loadLoginConfig: async () => {
                loginConfig.value = await loadConfig()
            }
        }
    }
}))
vi.mock('@/composables/useTokenVerification', () => ({ useTokenVerification: () => ({ resetToken: ref(''), exchangeAuthorizationCode }) }))
vi.mock('@/composables/useAuthFlows', () => ({
    useAuthFlows: () => ({
        ...Object.fromEntries(['username', 'password', 'error', 'success'].map((key) => [key, ref('')])),
        ...Object.fromEntries(['loading', 'showMfa', 'showForgotPassword', 'showResetPassword', 'showRegistration', 'isPwd'].map((key) => [key, ref(false)])),
        mfaData: ref({}),
        completeLogin
    })
}))
vi.mock('./MfaVerification.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./ForgotPassword.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./ResetPassword.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./Registration.vue', () => ({ default: { template: '<div />' } }))

describe('SAML in the existing login page', () => {
    let wrapper: ReturnType<typeof shallowMount>

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        sessionStorage.clear()
        config.items[0].samlActive = true
        config.items[0].ssoActive = true
        route.query = {}
        window.history.replaceState({}, '', '/knowage-vue/saml-login')
        completeLogin.mockResolvedValue(undefined)
        clearCache.mockResolvedValue(undefined)
        exchange.mockResolvedValue('new-token')
        loadConfig.mockResolvedValue(config)
        preloadImage.mockResolvedValue(undefined)
        exchangeAuthorizationCode.mockResolvedValue('oidc-token')
        begin.mockReturnValue(new Promise(() => {}))
    })

    afterEach(() => wrapper?.unmount())

    function mountLogin() {
        wrapper = shallowMount(Login, {
            global: {
                renderStubDefaultSlot: true,
                stubs: ['q-linear-progress', 'q-scroll-area', 'q-card', 'q-card-section', 'q-banner', 'q-icon', 'q-btn', 'q-form', 'q-input'],
                mocks: { $t: (key: string) => key }
            }
        })
        return flushPromises()
    }

    it('exchanges a callback, removes the stale token/role, clears cache and uses shared login completion', async () => {
        sessionStorage.setItem('token', 'old-token')
        localStorage.setItem('sessionRole', 'old-role')
        window.history.replaceState({}, '', '/knowage-vue/saml-login#samlCode=one-time-code')
        clearCache.mockImplementationOnce(async () => {
            expect(sessionStorage.getItem('token')).toBeNull()
            expect(localStorage.getItem('sessionRole')).toBeNull()
        })
        await mountLogin()
        expect(window.location.hash).toBe('')
        expect(exchange).toHaveBeenCalledWith('one-time-code', '/saml/exchange')
        expect(clearCache).toHaveBeenCalledOnce()
        expect(completeLogin).toHaveBeenCalledWith('new-token', false)
        expect(sessionStorage.getItem('knowage.saml')).toBe('true')
        expect(sessionStorage.getItem('oauth2_state')).toBeNull()
    })

    it.each(['samlError=authentication_failed', 'samlLoggedOut=true'])('does not restart automatically after a callback error or logout: %s', async (fragment) => {
        window.history.replaceState({}, '', `/knowage-vue/login#${fragment}`)
        await mountLogin()
        expect(exchange).not.toHaveBeenCalled()
        expect(completeLogin).not.toHaveBeenCalled()
        expect(begin).not.toHaveBeenCalled()
        expect(sessionStorage.getItem('oauth2_state')).toBeNull()
        expect(wrapper.find('q-btn-stub').exists()).toBe(false)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })

    it('starts SAML automatically only after the login configuration confirms it', async () => {
        let finishConfig!: (value: typeof config) => void
        loadConfig.mockReturnValueOnce(new Promise((resolve) => (finishConfig = resolve)))

        await mountLogin()
        expect(begin).not.toHaveBeenCalled()
        expect(wrapper.find('q-btn-stub').exists()).toBe(false)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)

        finishConfig(config)
        await flushPromises()

        expect(begin).toHaveBeenCalledExactlyOnceWith('/saml/login')
        expect(exchange).not.toHaveBeenCalled()
        expect(completeLogin).not.toHaveBeenCalled()
        expect(sessionStorage.getItem('oauth2_state')).toBeNull()
        expect(wrapper.find('q-btn-stub').exists()).toBe(false)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })

    it.each([{ error: 'authentication_failed' }, { logout: 'sessionExpired' }])('does not restart SAML when returning with an error or logout query: %j', async (query) => {
        route.query = query

        await mountLogin()

        expect(begin).not.toHaveBeenCalled()
        expect(exchange).not.toHaveBeenCalled()
        expect(wrapper.find('q-btn-stub').exists()).toBe(false)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })

    it('shows an error without retrying when automatic SAML startup fails', async () => {
        begin.mockRejectedValueOnce(new Error('startup failed'))

        await mountLogin()
        await flushPromises()

        expect(begin).toHaveBeenCalledExactlyOnceWith('/saml/login')
        expect(wrapper.text()).toContain('common.loginPage.ssoError')
        expect(wrapper.find('q-btn-stub').exists()).toBe(false)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })

    it('keeps failed exchanges on the login page without retaining a token or retrying automatically', async () => {
        window.history.replaceState({}, '', '/knowage-vue/login#samlCode=expired')
        exchange.mockRejectedValueOnce(new Error('expired'))
        await mountLogin()
        expect(completeLogin).not.toHaveBeenCalled()
        expect(sessionStorage.getItem('token')).toBeNull()
        expect(sessionStorage.getItem('knowage.saml')).toBeNull()
        expect(wrapper.text()).toContain('common.loginPage.ssoError')
        expect(begin).not.toHaveBeenCalled()
    })

    it('does not render the local form or consume a callback before SAML is confirmed', async () => {
        let finishConfig!: (value: typeof config) => void
        loadConfig.mockReturnValueOnce(new Promise((resolve) => (finishConfig = resolve)))
        sessionStorage.setItem('token', 'old-token')
        sessionStorage.setItem('knowage.saml', 'true')
        window.history.replaceState({}, '', '/knowage-vue/login#samlCode=one-time-code')

        const mounting = mountLogin()
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
        await mounting
        expect(window.location.hash).toBe('#samlCode=one-time-code')
        expect(sessionStorage.getItem('token')).toBe('old-token')
        expect(sessionStorage.getItem('knowage.saml')).toBe('true')
        expect(exchange).not.toHaveBeenCalled()

        finishConfig(config)
        await flushPromises()
        expect(exchange).toHaveBeenCalledWith('one-time-code', '/saml/exchange')
        expect(window.location.hash).toBe('')
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })

    it('leaves SAML-like fragments and session state untouched when SAML is disabled', async () => {
        config.items[0].samlActive = false
        config.items[0].ssoActive = false
        sessionStorage.setItem('token', 'existing-token')
        sessionStorage.setItem('knowage.saml', 'existing-marker')
        window.history.replaceState({}, '', '/knowage-vue/login#samlCode=not-a-saml-callback')

        await mountLogin()

        expect(window.location.hash).toBe('#samlCode=not-a-saml-callback')
        expect(sessionStorage.getItem('token')).toBe('existing-token')
        expect(sessionStorage.getItem('knowage.saml')).toBe('existing-marker')
        expect(exchange).not.toHaveBeenCalled()
        expect(begin).not.toHaveBeenCalled()
        expect(wrapper.find('q-form-stub').exists()).toBe(true)
    })

    it('shows the local form only after local authentication is confirmed', async () => {
        config.items[0].samlActive = false
        config.items[0].ssoActive = false
        let finishConfig!: (value: typeof config) => void
        loadConfig.mockReturnValueOnce(new Promise((resolve) => (finishConfig = resolve)))

        const mounting = mountLogin()
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
        await mounting
        expect(wrapper.find('q-form-stub').exists()).toBe(false)

        finishConfig(config)
        await flushPromises()
        expect(wrapper.find('q-form-stub').exists()).toBe(true)
    })

    it('keeps the form hidden while exchanging the SAML callback', async () => {
        let finishExchange!: (value: string) => void
        exchange.mockReturnValueOnce(new Promise((resolve) => (finishExchange = resolve)))
        window.history.replaceState({}, '', '/knowage-vue/login#samlCode=one-time-code')

        await mountLogin()
        expect(exchange).toHaveBeenCalledOnce()
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
        expect(completeLogin).not.toHaveBeenCalled()

        finishExchange('new-token')
        await flushPromises()
        expect(completeLogin).toHaveBeenCalledWith('new-token', false)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })

    it('does not flash the local form during an OIDC callback', async () => {
        config.items[0].samlActive = false
        route.query = { code: 'oidc-code', state: 'expected-state' }
        sessionStorage.setItem('oauth2_state', 'expected-state')
        let finishExchange!: (value: string) => void
        exchangeAuthorizationCode.mockReturnValueOnce(new Promise((resolve) => (finishExchange = resolve)))

        const mounting = mountLogin()
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
        await mounting
        expect(exchangeAuthorizationCode).toHaveBeenCalledWith('oidc-code', undefined)
        expect(wrapper.find('q-form-stub').exists()).toBe(false)

        finishExchange('oidc-token')
        await flushPromises()
        expect(completeLogin).toHaveBeenCalledWith('oidc-token')
        expect(begin).not.toHaveBeenCalled()
        expect(wrapper.find('q-form-stub').exists()).toBe(false)
    })
})
