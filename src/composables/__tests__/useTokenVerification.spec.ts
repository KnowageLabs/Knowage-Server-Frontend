import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// ─── Hoisted mock variables ────────────────────────────────────────────────────

const { mockRouterReplace, mockAxiosPost } = vi.hoisted(() => ({
    mockRouterReplace: vi.fn(),
    mockAxiosPost: vi.fn()
}))

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('vue-router', () => ({
    useRouter: vi.fn(() => ({ replace: mockRouterReplace }))
}))

vi.mock('vue-i18n', () => ({
    useI18n: vi.fn(() => ({ t: (k: string) => k }))
}))

vi.mock('axios', () => ({
    default: { post: mockAxiosPost }
}))

// ─── Import after mocks ────────────────────────────────────────────────────────
import { useTokenVerification } from '../useTokenVerification'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRefs = () => ({ error: ref(''), success: ref('') })

// ─── verifyResetToken ─────────────────────────────────────────────────────────

describe('useTokenVerification — verifyResetToken', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns true and sets resetToken on success', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: {} })
        const { error, success } = makeRefs()
        const { verifyResetToken, resetToken } = useTokenVerification(error, success)

        const result = await verifyResetToken('valid-token')

        expect(result).toBe(true)
        expect(resetToken.value).toBe('valid-token')
        expect(error.value).toBe('')
    })

    it('posts to the correct endpoint with the token', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: {} })
        const { error, success } = makeRefs()
        const { verifyResetToken } = useTokenVerification(error, success)

        await verifyResetToken('my-token')

        expect(mockAxiosPost).toHaveBeenCalledOnce()
        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toContain('/resetPassword/verifyToken')
        expect(body).toEqual({ token: 'my-token' })
    })

    it('returns false and sets error message on failure', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: { message: 'Token expired' } } })
        const { error, success } = makeRefs()
        const { verifyResetToken } = useTokenVerification(error, success)

        const result = await verifyResetToken('bad-token')

        expect(result).toBe(false)
        expect(error.value).toBe('Token expired')
    })

    it('uses i18n fallback when backend provides no message', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: {} } })
        const { error, success } = makeRefs()
        const { verifyResetToken } = useTokenVerification(error, success)

        const result = await verifyResetToken('bad-token')

        expect(result).toBe(false)
        expect(error.value).toBe('common.loginPage.invalidResetToken')
    })

    it('does not set resetToken on failure', async () => {
        mockAxiosPost.mockRejectedValueOnce(new Error('network'))
        const { error, success } = makeRefs()
        const { verifyResetToken, resetToken } = useTokenVerification(error, success)

        await verifyResetToken('fail-token')

        expect(resetToken.value).toBe('')
    })
})

// ─── verifyRegistrationToken ──────────────────────────────────────────────────

describe('useTokenVerification — verifyRegistrationToken', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns true, sets success message, and clears URL query on success', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: {} })
        const { error, success } = makeRefs()
        const { verifyRegistrationToken } = useTokenVerification(error, success)

        const result = await verifyRegistrationToken('reg-token')

        expect(result).toBe(true)
        expect(success.value).toBe('common.loginPage.registrationActivated')
        expect(mockRouterReplace).toHaveBeenCalledWith({ query: {} })
    })

    it('posts to the correct endpoint with the registration token', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: {} })
        const { error, success } = makeRefs()
        const { verifyRegistrationToken } = useTokenVerification(error, success)

        await verifyRegistrationToken('xyz-reg')

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toContain('/signup/active')
        expect(body).toEqual({ token: 'xyz-reg' })
    })

    it('returns false and sets error on failure', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: { message: 'Invalid registration token' } } })
        const { error, success } = makeRefs()
        const { verifyRegistrationToken } = useTokenVerification(error, success)

        const result = await verifyRegistrationToken('bad-reg')

        expect(result).toBe(false)
        expect(error.value).toBe('Invalid registration token')
    })

    it('uses i18n fallback when backend provides no message', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: {} } })
        const { error, success } = makeRefs()
        const { verifyRegistrationToken } = useTokenVerification(error, success)

        await verifyRegistrationToken('bad-reg')

        expect(error.value).toBe('common.loginPage.registrationActivationError')
    })

    it('does not call router.replace on failure', async () => {
        mockAxiosPost.mockRejectedValueOnce(new Error('network'))
        const { error, success } = makeRefs()
        const { verifyRegistrationToken } = useTokenVerification(error, success)

        await verifyRegistrationToken('fail-reg')

        expect(mockRouterReplace).not.toHaveBeenCalled()
    })
})

// ─── exchangeAuthorizationCode ────────────────────────────────────────────────

describe('useTokenVerification — exchangeAuthorizationCode', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns token from successful authorization_code exchange', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 'jwt-abc' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        const token = await exchangeAuthorizationCode('auth-code')

        expect(token).toBe('jwt-abc')
    })

    it('uses authorization_code endpoint by default', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('code')

        const [url] = mockAxiosPost.mock.calls[0]
        expect(url).toContain('/login/oidc/authorization_code')
    })

    it('uses implicit endpoint when flowType is "implicit"', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('code', undefined, 'implicit')

        const [url] = mockAxiosPost.mock.calls[0]
        expect(url).toContain('/login/oidc/implicit')
    })

    it('includes codeVerifier in payload when provided', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('code', 'verifier-123')

        const [, body] = mockAxiosPost.mock.calls[0]
        expect(body.codeVerifier).toBe('verifier-123')
        expect(body.code).toBe('code')
    })

    it('does not include codeVerifier when not provided', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('code')

        const [, body] = mockAxiosPost.mock.calls[0]
        expect(body.codeVerifier).toBeUndefined()
    })

    it('stores idToken in sessionStorage when response includes it', async () => {
        sessionStorage.clear()
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't', idToken: 'id-token-xyz' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('code')

        expect(sessionStorage.getItem('idToken')).toBe('id-token-xyz')
    })

    it('does not call sessionStorage.setItem when idToken is absent', async () => {
        sessionStorage.clear()
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't' } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('code')

        expect(sessionStorage.getItem('idToken')).toBeNull()
    })

    it('returns empty string and sets error on failure', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: { message: 'Invalid code' } } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        const token = await exchangeAuthorizationCode('bad-code')

        expect(token).toBe('')
        expect(error.value).toBe('Invalid code')
    })

    it('uses i18n fallback when backend provides no error message', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: {} } })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        await exchangeAuthorizationCode('bad-code')

        expect(error.value).toBe('common.loginPage.tokenError')
    })

    it('returns empty string when response has no token field', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: {} })
        const { error, success } = makeRefs()
        const { exchangeAuthorizationCode } = useTokenVerification(error, success)

        const token = await exchangeAuthorizationCode('code')

        expect(token).toBe('')
    })
})

// ─── loginWithJwtFromSessionStorage ──────────────────────────────────────────

describe('useTokenVerification — loginWithJwtFromSessionStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.sessionStorage.clear()
    })

    it('returns empty string and sets ssoError when jwtLabel is empty', async () => {
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        const token = await loginWithJwtFromSessionStorage('', 'myKey')

        expect(token).toBe('')
        expect(error.value).toBe('common.loginPage.ssoError')
        expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('returns empty string and sets ssoError when JWT is not in sessionStorage', async () => {
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        const token = await loginWithJwtFromSessionStorage('access_token', 'missing_key')

        expect(token).toBe('')
        expect(error.value).toBe('common.loginPage.ssoError')
        expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('posts to /login/oauth2 with the dynamic jwtLabel key and jwt value', async () => {
        window.sessionStorage.setItem('myapp_jwt', 'eyJhbGciOiJIUzI1NiIs...')
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 'session-token' } })
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        await loginWithJwtFromSessionStorage('access_token', 'myapp_jwt')

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toContain('/login/oauth2')
        expect(body).toEqual({ access_token: 'eyJhbGciOiJIUzI1NiIs...' })
    })

    it('returns the token from a successful response', async () => {
        window.sessionStorage.setItem('jwt_key', 'my-jwt')
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 'knowage-session' } })
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        const token = await loginWithJwtFromSessionStorage('access_token', 'jwt_key')

        expect(token).toBe('knowage-session')
        expect(error.value).toBe('')
    })

    it('returns empty string when response has no token field', async () => {
        window.sessionStorage.setItem('jwt_key', 'my-jwt')
        mockAxiosPost.mockResolvedValueOnce({ data: {} })
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        const token = await loginWithJwtFromSessionStorage('access_token', 'jwt_key')

        expect(token).toBe('')
    })

    it('returns empty string and sets error on backend failure', async () => {
        window.sessionStorage.setItem('jwt_key', 'my-jwt')
        mockAxiosPost.mockRejectedValueOnce({ response: { data: { message: 'JWT invalid' } } })
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        const token = await loginWithJwtFromSessionStorage('access_token', 'jwt_key')

        expect(token).toBe('')
        expect(error.value).toBe('JWT invalid')
    })

    it('uses different jwtLabel keys correctly', async () => {
        window.sessionStorage.setItem('jwt_key', 'bearer-token')
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 't' } })
        const { error, success } = makeRefs()
        const { loginWithJwtFromSessionStorage } = useTokenVerification(error, success)

        await loginWithJwtFromSessionStorage('bearer', 'jwt_key')

        const [, body] = mockAxiosPost.mock.calls[0]
        expect(body).toEqual({ bearer: 'bearer-token' })
    })
})
