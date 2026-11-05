import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/modules/mainMenu/MainMenu', () => ({ default: {} }))
vi.mock('@/components/UI/KnOverlaySpinnerPanel.vue', () => ({ default: {} }))
vi.mock('@/components/UI/KnRotate.vue', () => ({ default: {} }))
vi.mock('@/App.i18n.js', () => ({ loadLanguageAsync: vi.fn() }))
vi.mock('@/helpers/commons/localeHelper', () => ({ primeVueDate: vi.fn(), getLocale: vi.fn() }))
vi.mock('@/helpers/commons/authHelper', () => ({ default: { logout: vi.fn() } }))
vi.mock('@/helpers/commons/sessionTimeoutHelper', () => ({ default: { start: vi.fn(), stop: vi.fn() } }))
vi.mock('@/services/webSocket.js', () => ({ closeWebSocket: vi.fn(), getWebSocket: vi.fn() }))
vi.mock('@/composables/useServiceWorker', () => ({ useServiceWorker: vi.fn() }))

import App from './App.vue'
import sessionTimeoutHelper from '@/helpers/commons/sessionTimeoutHelper'

describe('Post-login initialization', () => {
    const methods = (App as any).methods

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => vi.restoreAllMocks())

    function createContext() {
        return {
            postLoginInitDone: false,
            isEnterprise: true,
            isEnterpriseValid: true,
            configurations: {},
            defaultTheme: { '--kn-color': 'blue' },
            theme: {},
            themeHelper: { setTheme: vi.fn() },
            $http: { get: vi.fn().mockResolvedValue({ data: { config: {} } }) },
            setLoading: vi.fn(),
            setConfigurations: vi.fn(),
            setLicenses: vi.fn(),
            setTheme: vi.fn(),
            checkTopLevelIframe: vi.fn(),
            checkOIDCSession: vi.fn(),
            onLoad: vi.fn().mockResolvedValue(undefined),
            $q: { notify: vi.fn() },
            $t: (key: string) => key
        }
    }

    it.each([
        { status: 400, data: { errors: [{ message: 'not-enabled-to-call-service' }] } },
        { status: 403, data: {} }
    ])('continues initialization when license access is denied: $status', async (response) => {
        const context = createContext()
        context.$http.get.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce({ response })

        await methods.loadUserConfigsAndInitialize.call(context)

        expect(context.setLicenses).not.toHaveBeenCalled()
        expect(context.$q.notify).not.toHaveBeenCalled()
        expect(context.setTheme).toHaveBeenCalled()
        expect(context.onLoad).toHaveBeenCalledOnce()
        expect(sessionTimeoutHelper.start).toHaveBeenCalledOnce()
        expect(context.postLoginInitDone).toBe(true)
        expect(context.setLoading.mock.calls).toEqual([[true], [false]])
    })

    it('preserves the invalid-license warning when license access succeeds', async () => {
        const context = createContext()
        context.isEnterpriseValid = false

        await methods.loadUserConfigsAndInitialize.call(context)

        expect(context.setLicenses).toHaveBeenCalledOnce()
        expect(context.$q.notify).toHaveBeenCalledWith(expect.objectContaining({ message: 'common.error.licenseInvalid' }))
        expect(context.onLoad).toHaveBeenCalledOnce()
        expect(context.setLoading.mock.calls).toEqual([[true], [false]])
    })

    it.each([
        { status: 400, data: { errors: [{ message: 'invalid-license-response' }] } },
        { status: 500, data: {} }
    ])('reports unexpected license failures and releases loading: $status', async (response) => {
        const context = createContext()
        const error = { response }
        context.$http.get.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce(error)

        await methods.loadUserConfigsAndInitialize.call(context)

        expect(console.error).toHaveBeenCalledWith('Errore inizializzazione utente:', error)
        expect(context.onLoad).not.toHaveBeenCalled()
        expect(context.postLoginInitDone).toBe(false)
        expect(context.setLoading.mock.calls).toEqual([[true], [false]])
    })

    it('allows retrying after user configuration fails without leaking loading', async () => {
        const context = createContext()
        context.$http.get.mockRejectedValueOnce(new Error('unavailable'))

        await methods.loadUserConfigsAndInitialize.call(context)
        expect(context.postLoginInitDone).toBe(false)

        await methods.loadUserConfigsAndInitialize.call(context)

        expect(context.onLoad).toHaveBeenCalledOnce()
        expect(context.postLoginInitDone).toBe(true)
        expect(context.setLoading.mock.calls).toEqual([[true], [false], [true], [false]])
    })

    it('awaits post-login work, ignores duplicate initialization and releases loading once', async () => {
        const context = createContext()
        let finish!: () => void
        context.onLoad.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)))
        const initialization = methods.loadUserConfigsAndInitialize.call(context)
        await vi.waitFor(() => expect(context.onLoad).toHaveBeenCalledOnce())

        await methods.loadUserConfigsAndInitialize.call(context)
        expect(context.setLoading.mock.calls).toEqual([[true]])

        finish()
        await initialization
        expect(context.setLoading.mock.calls).toEqual([[true], [false]])
    })

    it('handles a failed downloads request without leaving loading active', async () => {
        const context = createContext()
        context.onLoad = methods.onLoad.bind(context)
        context.$http.get
            .mockResolvedValueOnce({ data: {} })
            .mockResolvedValueOnce({ data: {} })
            .mockResolvedValueOnce({ data: { config: {} } })
            .mockRejectedValueOnce(new Error('downloads unavailable'))

        await methods.loadUserConfigsAndInitialize.call(context)

        expect(context.postLoginInitDone).toBe(false)
        expect(context.setLoading.mock.calls).toEqual([[true], [false]])
        expect(sessionTimeoutHelper.start).not.toHaveBeenCalled()
        expect(console.error).toHaveBeenCalledOnce()
    })
})
