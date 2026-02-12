import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

export const useTokenVerification = (error: any, success: any) => {
    const router = useRouter()
    const { t } = useI18n()

    const resetToken = ref('')

    const verifyResetToken = async (token: string) => {
        try {
            await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/resetPassword/verifyToken`, {
                token: token
            })
            // Token valido
            resetToken.value = token
            return true
        } catch (err: any) {
            console.error('Errore durante la verifica del token di reset:', err)
            error.value = err.response?.data?.message || t('common.loginPage.invalidResetToken')
            return false
        }
    }

    const verifyRegistrationToken = async (token: string) => {
        try {
            await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/signup/active`, {
                token: token
            })
            // Token valido - account attivato
            success.value = t('common.loginPage.registrationActivated')
            // Rimuovi il registrationToken dall'URL
            router.replace({ query: {} })
            return true
        } catch (err: any) {
            console.error("Errore durante l'attivazione dell'account:", err)
            error.value = err.response?.data?.message || t('common.loginPage.registrationActivationError')
            return false
        }
    }

    return {
        resetToken,
        verifyResetToken,
        verifyRegistrationToken
    }
}
