import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'

export const useAuthFlows = () => {
    const router = useRouter()
    const { t, locale } = useI18n()
    const store = mainStore()

    // State
    const username = ref('')
    const password = ref('')
    const isPwd = ref(true)
    const loading = ref(false)
    const error = ref('')
    const success = ref('')
    const showMfa = ref(false)
    const showForgotPassword = ref(false)
    const showResetPassword = ref(false)
    const showRegistration = ref(false)
    const resetToken = ref('')
    const mfaData = ref<{ tokenMfa: string; secret?: string; qrCodeUrl?: string }>({
        tokenMfa: '',
        secret: undefined,
        qrCodeUrl: undefined
    })

    // Funzioni di utility per pulire lo stato
    const clearMessages = () => {
        error.value = ''
        success.value = ''
    }

    const resetFlowState = () => {
        showMfa.value = false
        showForgotPassword.value = false
        showResetPassword.value = false
        showRegistration.value = false
        clearMessages()
    }

    // Login principale
    const completeLogin = async (token: string) => {
        // Salva il token JWT in localStorage
        localStorage.setItem('token', token)

        // Chiama l'endpoint /currentuser per ottenere le informazioni complete dell'utente
        const userResponse = await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/currentuser`)
        const currentUser = userResponse.data

        // Gestisci il session role
        if (localStorage.getItem('sessionRole')) {
            currentUser.sessionRole = localStorage.getItem('sessionRole')
        } else if (currentUser.defaultRole) {
            currentUser.sessionRole = currentUser.defaultRole
        }

        // Inizializza l'utente nello store
        store.initializeUser(currentUser)

        // Gestisci locale
        const responseLocale = currentUser.locale || 'en_US'
        let storedLocale = responseLocale.replace('_', '-')
        if (localStorage.getItem('locale')) {
            storedLocale = localStorage.getItem('locale')
        }
        localStorage.setItem('locale', storedLocale)
        store.setLocale(storedLocale)
        await loadLanguageAsync(storedLocale)

        // Redirect alla home o alla pagina richiesta
        // Controlla prima 'redirect', poi 'logout', infine default alla home
        const redirect = (router.currentRoute.value.query.redirect as string) || (router.currentRoute.value.query.logout as string) || '/'
        router.push(redirect)
    }

    const onSubmit = async () => {
        loading.value = true
        clearMessages()

        try {
            // Chiamata API per login che restituisce il token JWT
            const loginResponse = await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/login`, {
                userID: username.value,
                password: password.value
            })

            // Verifica se è richiesta l'autenticazione MFA
            if (loginResponse.data && loginResponse.data.tokenMfa) {
                // Mostra il form MFA
                mfaData.value = {
                    tokenMfa: loginResponse.data.tokenMfa,
                    secret: loginResponse.data.secret,
                    qrCodeUrl: loginResponse.data.qrCodeUrl
                }
                showMfa.value = true
            }
            // Verifica che ci sia il token nella risposta
            else if (loginResponse.data && loginResponse.data.token) {
                await completeLogin(loginResponse.data.token)
            } else {
                error.value = t('common.loginPage.loginError')
            }
        } catch (err: any) {
            console.error('Errore durante il login:', err)

            // Pulisci il token se il login fallisce
            localStorage.removeItem('token')

            error.value = err.response?.data?.message || t('common.loginPage.loginError')
        } finally {
            loading.value = false
        }
    }

    // MFA handlers
    const onMfaSuccess = async (token: string) => {
        try {
            await completeLogin(token)
        } catch (err: any) {
            error.value = err.response?.data?.message || t('common.loginPage.loginError')
            showMfa.value = false
        }
    }

    const onMfaError = (message: string) => {
        error.value = message
        success.value = ''
        showMfa.value = false
    }

    // Forgot Password handlers
    const onForgotPasswordBack = () => {
        showForgotPassword.value = false
        clearMessages()
    }

    const onForgotPasswordSuccess = (message: string) => {
        success.value = message
        error.value = ''
    }

    const onForgotPasswordError = (message: string) => {
        error.value = message
        success.value = ''
    }

    // Reset Password handlers
    const onResetPasswordSuccess = (message: string) => {
        success.value = message
        error.value = ''
        showResetPassword.value = false
        // Rimuovi il resetToken dall'URL
        router.replace({ query: {} })
    }

    const onResetPasswordError = (message: string) => {
        error.value = message
        success.value = ''
    }

    // Registration handlers
    const onRegistrationBack = () => {
        showRegistration.value = false
        clearMessages()
    }

    const onRegistrationSuccess = (message: string) => {
        success.value = message
        error.value = ''
        showRegistration.value = false
    }

    const onRegistrationError = (message: string) => {
        error.value = message
        success.value = ''
    }

    // Flow openers
    const openForgotPassword = () => {
        showForgotPassword.value = true
        clearMessages()
    }

    const openRegistration = () => {
        showRegistration.value = true
        clearMessages()
    }

    return {
        // State
        username,
        password,
        isPwd,
        loading,
        error,
        success,
        showMfa,
        showForgotPassword,
        showResetPassword,
        showRegistration,
        resetToken,
        mfaData,
        // Methods
        onSubmit,
        onMfaSuccess,
        onMfaError,
        onForgotPasswordBack,
        onForgotPasswordSuccess,
        onForgotPasswordError,
        onResetPasswordSuccess,
        onResetPasswordError,
        onRegistrationBack,
        onRegistrationSuccess,
        onRegistrationError,
        openForgotPassword,
        openRegistration,
        resetFlowState
    }
}
