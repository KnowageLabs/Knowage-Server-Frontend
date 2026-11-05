import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const { post, get, replace, store } = vi.hoisted(() => ({
    post: vi.fn(),
    get: vi.fn(),
    replace: vi.fn(),
    store: { setLoading: vi.fn(), setUser: vi.fn(), storeClearIndexedDBCache: vi.fn() }
}))

vi.mock('@/App.store', () => ({ default: () => store }))
vi.mock('@/pinia', () => ({ default: {} }))
vi.mock('@/axios.js', () => ({ default: { post, get } }))
vi.mock('@/App.routes', () => ({ default: { replace } }))

describe('coordinated logout', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        localStorage.clear()
        sessionStorage.clear()
        document.body.innerHTML = ''
        vi.stubGlobal('window', { location: { origin: 'https://knowage.example', href: '', search: '' } })
        sessionStorage.setItem('token', 'application-token')
        get.mockResolvedValue({})
        replace.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('submits the standard SAML POST after engine invalidation and suppresses concurrent 401 handling', async () => {
        sessionStorage.setItem('knowage.saml', 'true')
        const request = 'signed-request-with-"<>'
        post.mockResolvedValue({ data: { samlLogoutRequest: request, samlLogoutUrl: 'https://idp.example/slo', urlEnginesInvalidate: ['/engine'] } })
        const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
        const auth = (await import('./authHelper')).default
        get.mockImplementation(() => {
            auth.handleUnauthorized()
            return Promise.reject(new Error('revoked engine session'))
        })
        await auth.logout(false, '')
        expect(post).toHaveBeenCalledOnce()
        expect(get).toHaveBeenCalledWith('/engine')
        expect(submit).toHaveBeenCalledOnce()
        const form = document.querySelector('form')!
        expect(form.method).toBe('post')
        expect(form.action).toBe('https://idp.example/slo')
        expect(form.querySelector('input')?.name).toBe('SAMLRequest')
        expect(form.querySelector('input')?.value).toBe(request)
        expect(sessionStorage.getItem('token')).toBeNull()
        auth.handleUnauthorized()
        expect(replace).not.toHaveBeenCalled()
        expect(post).toHaveBeenCalledOnce()
    })

    it('uses the MyID regional target without replacing it with local navigation', async () => {
        sessionStorage.setItem('token', `header.${btoa(JSON.stringify({ kn_saml_sid: 'restored-session' }))}.signature`)
        const target = 'https://myid.example/logout/target?spid=knowage'
        post.mockResolvedValue({ data: { redirectUrl: target } })
        const auth = (await import('./authHelper')).default
        await auth.logout(false, '')
        auth.handleUnauthorized()
        expect(window.location.href).toBe(target)
        expect(replace).not.toHaveBeenCalled()
        expect(post).toHaveBeenCalledOnce()
    })

    it('clears revoked federated credentials before local navigation without calling the IdP or backend logout', async () => {
        sessionStorage.setItem('knowage.saml', 'true')
        localStorage.setItem('sessionRole', 'old-role')
        replace.mockImplementationOnce(async () => {
            expect(sessionStorage.getItem('token')).toBeNull()
        })
        const auth = (await import('./authHelper')).default
        await auth.logout(true, '', '/workspace')
        expect(post).not.toHaveBeenCalled()
        expect(window.location.href).toBe('')
        expect(replace).toHaveBeenCalledWith({ path: '/login', query: { logout: 'sessionExpired', redirect: '/workspace' }, hash: '' })
        expect(localStorage.getItem('sessionRole')).toBeNull()
        expect(store.setUser).toHaveBeenCalledWith({})
    })

    it('preserves the OIDC hint before clearing sessionStorage', async () => {
        sessionStorage.setItem('idToken', 'oidc-token')
        post.mockResolvedValue({ data: { redirectUrl: 'https://oidc.example/logout?id_token_hint=placeholder' } })
        const auth = (await import('./authHelper')).default
        await auth.logout(false, '')
        expect(new URL(window.location.href).searchParams.get('id_token_hint')).toBe('oidc-token')
        expect(sessionStorage.getItem('idToken')).toBeNull()
    })

    it('preserves legacy automatic logout and invalidation, clearing the token before the login guard runs', async () => {
        post.mockResolvedValue({ data: { urlEnginesInvalidate: ['/engine'], redirectUrl: '' } })
        replace.mockImplementationOnce(async () => {
            expect(sessionStorage.getItem('token')).toBeNull()
        })
        const auth = (await import('./authHelper')).default
        await auth.logout(true, 'sessionExpired')
        expect(post.mock.calls[0][0]).toContain('/logout/auto')
        expect(get).toHaveBeenCalledWith('/engine')
        expect(replace).toHaveBeenCalledWith({ path: '/login', query: { logout: 'sessionExpired' }, hash: '' })
        expect(store.storeClearIndexedDBCache).toHaveBeenCalledOnce()
    })
})
