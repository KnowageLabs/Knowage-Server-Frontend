import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mock variables (must be before vi.mock factories) ─────────────────

const { mockRouterPush, mockRouterReplace, mockCurrentRoute, mockAxiosPost, mockAxiosGet, mockStoreInitializeUser, mockStoreSetLocale } = vi.hoisted(() => ({
    mockRouterPush: vi.fn(),
    mockRouterReplace: vi.fn(),
    mockCurrentRoute: { value: { query: {} as Record<string, string> } },
    mockAxiosPost: vi.fn(),
    mockAxiosGet: vi.fn(),
    mockStoreInitializeUser: vi.fn(),
    mockStoreSetLocale: vi.fn()
}))

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('vue-router', () => ({
    useRouter: vi.fn(() => ({
        push: mockRouterPush,
        replace: mockRouterReplace,
        currentRoute: mockCurrentRoute
    }))
}))

vi.mock('vue-i18n', () => ({
    useI18n: vi.fn(() => ({ t: (k: string) => k, locale: { value: 'en-US' } }))
}))

vi.mock('axios', () => ({
    default: { post: mockAxiosPost, get: mockAxiosGet }
}))

vi.mock('@/App.store', () => ({
    default: vi.fn(() => ({
        initializeUser: mockStoreInitializeUser,
        setLocale: mockStoreSetLocale
    }))
}))

vi.mock('@/App.i18n.js', () => ({
    loadLanguageAsync: vi.fn(async () => {})
}))

// ─── Import after mocks ────────────────────────────────────────────────────────
import { useAuthFlows } from '../useAuthFlows'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAuthFlows — initial state', () => {
    it('initializes with empty username and password', () => {
        const { username, password } = useAuthFlows()
        expect(username.value).toBe('')
        expect(password.value).toBe('')
    })

    it('initializes with loading = false', () => {
        const { loading } = useAuthFlows()
        expect(loading.value).toBe(false)
    })

    it('initializes with empty error and success messages', () => {
        const { error, success } = useAuthFlows()
        expect(error.value).toBe('')
        expect(success.value).toBe('')
    })

    it('initializes all visibility flags to false', () => {
        const { showMfa, showForgotPassword, showResetPassword, showRegistration } = useAuthFlows()
        expect(showMfa.value).toBe(false)
        expect(showForgotPassword.value).toBe(false)
        expect(showResetPassword.value).toBe(false)
        expect(showRegistration.value).toBe(false)
    })

    it('initializes isPwd to true (password hidden)', () => {
        const { isPwd } = useAuthFlows()
        expect(isPwd.value).toBe(true)
    })

    it('initializes mfaData with empty tokenMfa', () => {
        const { mfaData } = useAuthFlows()
        expect(mfaData.value.tokenMfa).toBe('')
    })
})

describe('useAuthFlows — flow openers', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('openForgotPassword sets showForgotPassword = true and clears messages', () => {
        const { openForgotPassword, showForgotPassword, error, success } = useAuthFlows()
        error.value = 'previous error'
        success.value = 'previous success'

        openForgotPassword()

        expect(showForgotPassword.value).toBe(true)
        expect(error.value).toBe('')
        expect(success.value).toBe('')
    })

    it('openResetPassword sets showResetPassword = true and clears messages', () => {
        const { openResetPassword, showResetPassword, error } = useAuthFlows()
        error.value = 'err'

        openResetPassword()

        expect(showResetPassword.value).toBe(true)
        expect(error.value).toBe('')
    })

    it('openRegistration sets showRegistration = true and clears messages', () => {
        const { openRegistration, showRegistration, error } = useAuthFlows()
        error.value = 'err'

        openRegistration()

        expect(showRegistration.value).toBe(true)
        expect(error.value).toBe('')
    })
})

describe('useAuthFlows — resetFlowState', () => {
    it('resets all flow visibility flags to false and clears messages', () => {
        const { resetFlowState, showMfa, showForgotPassword, showResetPassword, showRegistration, error, success } = useAuthFlows()

        showMfa.value = true
        showForgotPassword.value = true
        showResetPassword.value = true
        showRegistration.value = true
        error.value = 'old error'
        success.value = 'old success'

        resetFlowState()

        expect(showMfa.value).toBe(false)
        expect(showForgotPassword.value).toBe(false)
        expect(showResetPassword.value).toBe(false)
        expect(showRegistration.value).toBe(false)
        expect(error.value).toBe('')
        expect(success.value).toBe('')
    })
})

describe('useAuthFlows — forgot password handlers', () => {
    it('onForgotPasswordBack sets showForgotPassword = false and clears messages', () => {
        const { onForgotPasswordBack, showForgotPassword, error } = useAuthFlows()
        showForgotPassword.value = true
        error.value = 'err'

        onForgotPasswordBack()

        expect(showForgotPassword.value).toBe(false)
        expect(error.value).toBe('')
    })

    it('onForgotPasswordSuccess sets success message and clears error', () => {
        const { onForgotPasswordSuccess, error, success } = useAuthFlows()
        error.value = 'err'

        onForgotPasswordSuccess('Email sent!')

        expect(success.value).toBe('Email sent!')
        expect(error.value).toBe('')
    })

    it('onForgotPasswordError sets error message and clears success', () => {
        const { onForgotPasswordError, error, success } = useAuthFlows()
        success.value = 'prev'

        onForgotPasswordError('Failed to send email')

        expect(error.value).toBe('Failed to send email')
        expect(success.value).toBe('')
    })
})

describe('useAuthFlows — reset password handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('onResetPasswordSuccess sets success, clears error, hides form, and clears URL query', () => {
        const { onResetPasswordSuccess, showResetPassword, error, success } = useAuthFlows()
        showResetPassword.value = true
        error.value = 'err'

        onResetPasswordSuccess('Password reset successfully')

        expect(success.value).toBe('Password reset successfully')
        expect(error.value).toBe('')
        expect(showResetPassword.value).toBe(false)
        expect(mockRouterReplace).toHaveBeenCalledWith({ query: {} })
    })

    it('onResetPasswordError sets error and clears success', () => {
        const { onResetPasswordError, error, success } = useAuthFlows()
        success.value = 'prev'

        onResetPasswordError('Token expired')

        expect(error.value).toBe('Token expired')
        expect(success.value).toBe('')
    })
})

describe('useAuthFlows — registration handlers', () => {
    it('onRegistrationBack sets showRegistration = false and clears messages', () => {
        const { onRegistrationBack, showRegistration, error } = useAuthFlows()
        showRegistration.value = true
        error.value = 'err'

        onRegistrationBack()

        expect(showRegistration.value).toBe(false)
        expect(error.value).toBe('')
    })

    it('onRegistrationSuccess sets success, clears error, and hides registration', () => {
        const { onRegistrationSuccess, showRegistration, error, success } = useAuthFlows()
        showRegistration.value = true
        error.value = 'err'

        onRegistrationSuccess('Account created!')

        expect(success.value).toBe('Account created!')
        expect(error.value).toBe('')
        expect(showRegistration.value).toBe(false)
    })

    it('onRegistrationError sets error and clears success', () => {
        const { onRegistrationError, error, success } = useAuthFlows()
        success.value = 'prev'

        onRegistrationError('Registration failed')

        expect(error.value).toBe('Registration failed')
        expect(success.value).toBe('')
    })
})

describe('useAuthFlows — MFA handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('onMfaError sets error message, clears success, and hides MFA', () => {
        const { onMfaError, showMfa, error, success } = useAuthFlows()
        showMfa.value = true
        success.value = 'prev'

        onMfaError('Invalid MFA code')

        expect(error.value).toBe('Invalid MFA code')
        expect(success.value).toBe('')
        expect(showMfa.value).toBe(false)
    })
})

describe('useAuthFlows — onSubmit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCurrentRoute.value = { query: {} }
    })

    it('sets loading = true during submission, false after', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 'jwt' } })
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'role1' } })

        const { onSubmit, loading, username, password } = useAuthFlows()
        username.value = 'admin'
        password.value = 'secret'

        const promise = onSubmit()
        expect(loading.value).toBe(true)
        await promise
        expect(loading.value).toBe(false)
    })

    it('posts credentials to /restful-services/login', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: { token: 'jwt' } })
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'role1' } })

        const { onSubmit, username, password } = useAuthFlows()
        username.value = 'admin'
        password.value = 'pass'

        await onSubmit()

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toContain('/restful-services/login')
        expect(body).toEqual({ userID: 'admin', password: 'pass' })
    })

    it('triggers MFA flow when response contains tokenMfa', async () => {
        mockAxiosPost.mockResolvedValueOnce({
            data: { tokenMfa: 'mfa-session', secret: 'SECRET', qrCodeUrl: 'qr://url' }
        })

        const { onSubmit, showMfa, mfaData, username, password } = useAuthFlows()
        username.value = 'user'
        password.value = 'pass'

        await onSubmit()

        expect(showMfa.value).toBe(true)
        expect(mfaData.value.tokenMfa).toBe('mfa-session')
        expect(mfaData.value.secret).toBe('SECRET')
        expect(mfaData.value.qrCodeUrl).toBe('qr://url')
    })

    it('sets error when response has neither token nor tokenMfa', async () => {
        mockAxiosPost.mockResolvedValueOnce({ data: {} })

        const { onSubmit, error, username, password } = useAuthFlows()
        username.value = 'user'
        password.value = 'pass'

        await onSubmit()

        expect(error.value).toBe('common.loginPage.loginError')
    })

    it('sets error and removes token from localStorage on network failure', async () => {
        localStorage.setItem('token', 'pre-existing-token')
        mockAxiosPost.mockRejectedValueOnce({ response: { data: { message: 'Wrong credentials' } } })

        const { onSubmit, error, username, password } = useAuthFlows()
        username.value = 'user'
        password.value = 'wrong'

        await onSubmit()

        expect(error.value).toBe('Wrong credentials')
        expect(localStorage.getItem('token')).toBeNull()
    })

    it('uses i18n fallback when backend provides no error message', async () => {
        mockAxiosPost.mockRejectedValueOnce({ response: { data: {} } })

        const { onSubmit, error, username, password } = useAuthFlows()
        username.value = 'u'
        password.value = 'p'

        await onSubmit()

        expect(error.value).toBe('common.loginPage.loginError')
    })
})

describe('useAuthFlows — completeLogin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCurrentRoute.value = { query: {} }
    })

    it('saves the token to localStorage', async () => {
        localStorage.clear()
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'ADMIN' } })

        const { completeLogin } = useAuthFlows()
        await completeLogin('my-jwt')

        expect(localStorage.getItem('token')).toBe('my-jwt')
    })

    it('fetches /currentuser and initializes store', async () => {
        const user = { locale: 'en_US', defaultRole: 'USER' }
        mockAxiosGet.mockResolvedValueOnce({ data: user })

        const { completeLogin } = useAuthFlows()
        await completeLogin('token')

        expect(mockAxiosGet).toHaveBeenCalledOnce()
        const [url] = mockAxiosGet.mock.calls[0]
        expect(url).toContain('/currentuser')
        expect(mockStoreInitializeUser).toHaveBeenCalledOnce()
    })

    it('uses defaultRole as sessionRole when sessionRole is not in localStorage', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'it_IT', defaultRole: 'ANALYST' } })

        const { completeLogin } = useAuthFlows()
        await completeLogin('token')

        const userArg = mockStoreInitializeUser.mock.calls[0][0]
        expect(userArg.sessionRole).toBe('ANALYST')
    })

    it('redirects to "/" by default when no redirect query param', async () => {
        mockCurrentRoute.value = { query: {} }
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'ROLE' } })

        const { completeLogin } = useAuthFlows()
        await completeLogin('token')

        expect(mockRouterPush).toHaveBeenCalledWith('/')
    })

    it('redirects to the redirect query param when present', async () => {
        mockCurrentRoute.value = { query: { redirect: '/dashboard' } }
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'ROLE' } })

        const { completeLogin } = useAuthFlows()
        await completeLogin('token')

        expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
    })

    it('redirects to the logout query param when redirect is absent', async () => {
        mockCurrentRoute.value = { query: { logout: '/bye' } }
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'ROLE' } })

        const { completeLogin } = useAuthFlows()
        await completeLogin('token')

        expect(mockRouterPush).toHaveBeenCalledWith('/bye')
    })
})

describe('useAuthFlows — onMfaSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCurrentRoute.value = { query: {} }
    })

    it('calls completeLogin with the provided token', async () => {
        mockAxiosGet.mockResolvedValueOnce({ data: { locale: 'en_US', defaultRole: 'R' } })

        const { onMfaSuccess } = useAuthFlows()
        await onMfaSuccess('mfa-token')

        expect(mockRouterPush).toHaveBeenCalledWith('/')
    })

    it('sets error and hides MFA on failure', async () => {
        mockAxiosGet.mockRejectedValueOnce({ response: { data: { message: 'Session expired' } } })

        const { onMfaSuccess, showMfa, error } = useAuthFlows()
        showMfa.value = true

        await onMfaSuccess('bad-mfa-token')

        expect(error.value).toBe('Session expired')
        expect(showMfa.value).toBe(false)
    })
})
