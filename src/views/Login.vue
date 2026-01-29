<template>
    <div class="login-container">
        <!-- MFA Verification -->
        <MfaVerification v-if="showMfa" :tokenMfa="mfaData.tokenMfa" :secret="mfaData.secret" :qrCodeUrl="mfaData.qrCodeUrl" @success="onMfaSuccess" @error="onMfaError" />

        <!-- Login Form -->
        <q-card v-else class="login-card">
            <q-card-section class="text-center q-pb-none">
                <div class="logo-container">
                    <img :src="`${publicPath}/images/commons/knowage-black.svg`" alt="Knowage" class="logo" />
                </div>
            </q-card-section>

            <q-card-section>
                <q-form @submit="onSubmit" class="q-gutter-md">
                    <q-input v-model="username" :label="$t('common.loginPage.username')" square outlined :rules="[(val) => !!val || $t('common.loginPage.usernameRequired')]" autocomplete="username">
                        <template v-slot:prepend>
                            <q-icon name="person" />
                        </template>
                    </q-input>

                    <q-input v-model="password" :type="isPwd ? 'password' : 'text'" :label="$t('common.loginPage.password')" square outlined :rules="[(val) => !!val || $t('common.loginPage.passwordRequired')]" autocomplete="current-password">
                        <template v-slot:prepend>
                            <q-icon name="lock" />
                        </template>
                        <template v-slot:append>
                            <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
                        </template>
                    </q-input>

                    <div>
                        <q-btn :label="$t('common.loginPage.signIn')" type="submit" color="primary" class="full-width" :loading="loading" />
                    </div>
                </q-form>
            </q-card-section>

            <q-card-section class="text-center q-pt-none">
                <div class="text-caption text-grey-7">
                    <a href="#" class="text-primary">{{ $t('common.loginPage.forgotPassword') }}</a>
                </div>
            </q-card-section>
        </q-card>

        <q-banner v-if="error" class="bg-negative text-white error-banner" rounded>
            <template v-slot:avatar>
                <q-icon name="error" color="white" />
            </template>
            {{ error }}
        </q-banner>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'
import MfaVerification from './MfaVerification.vue'

const router = useRouter()
const { t } = useI18n()
const store = mainStore()

const username = ref('')
const password = ref('')
const isPwd = ref(true)
const loading = ref(false)
const error = ref('')
const publicPath = import.meta.env.VITE_PUBLIC_PATH
const loginConfig = ref<any>(null)
const showMfa = ref(false)
const mfaData = ref<{ tokenMfa: string; secret?: string; qrCodeUrl?: string }>({
    tokenMfa: '',
    secret: undefined,
    qrCodeUrl: undefined
})

// Carica le configurazioni della login all'avvio del componente
const loadLoginConfig = async () => {
    const response = await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/loginconfig`)
    loginConfig.value = response.data
}
onMounted(() => {
    loadLoginConfig()
})

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
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    router.push(redirect)
}

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
    showMfa.value = false
}

const onSubmit = async () => {
    loading.value = true
    error.value = ''

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
</script>

<style scoped lang="scss">
.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-card {
    width: 100%;
    max-width: 450px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
}

.logo-container {
    display: flex;
    justify-content: center;
    padding: 20px 0;
}

.logo {
    max-width: 250px;
    height: auto;
}

.error-banner {
    margin-top: 20px;
    max-width: 450px;
    width: 100%;
}

:deep(.q-btn) {
    height: 48px;
    font-weight: 600;
    text-transform: none;
    font-size: 16px;
}
</style>
