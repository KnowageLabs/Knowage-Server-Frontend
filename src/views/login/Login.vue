<template>
    <div class="login-container" :class="{ 'bg-loading': !backgroundLoaded }" :style="containerStyles">
        <!-- Spinner di caricamento del background -->
        <q-linear-progress v-if="!backgroundLoaded" indeterminate color="primary" class="bg-loading-progress" />

        <q-card class="login-card">
            <!-- Logo sempre visibile -->
            <q-card-section class="text-center q-pb-none">
                <div class="logo-container">
                    <img :src="`${publicPath}/images/commons/knowage-black.svg`" alt="Knowage" class="logo" />
                </div>
            </q-card-section>

            <!-- Success/Error banner unificato -->
            <q-card-section v-if="success" class="q-pt-none q-pb-none">
                <q-banner class="bg-positive text-white" rounded dense>
                    <template v-slot:avatar>
                        <q-icon name="check_circle" color="white" />
                    </template>
                    {{ success }}
                </q-banner>
            </q-card-section>

            <q-card-section v-if="error" class="q-pt-none q-pb-none">
                <q-banner class="bg-negative text-white" rounded dense>
                    <template v-slot:avatar>
                        <q-icon name="error" color="white" />
                    </template>
                    {{ error }}
                </q-banner>
            </q-card-section>

            <!-- MFA Verification -->
            <MfaVerification v-if="showMfa" :tokenMfa="mfaData.tokenMfa" :secret="mfaData.secret" :qrCodeUrl="mfaData.qrCodeUrl" @success="onMfaSuccess" @error="onMfaError" />

            <!-- Forgot Password -->
            <ForgotPassword v-else-if="showForgotPassword" @back="onForgotPasswordBack" @success="onForgotPasswordSuccess" @error="onForgotPasswordError" />

            <!-- Reset Password -->
            <ResetPassword v-else-if="showResetPassword" :token="resetToken" @success="onResetPasswordSuccess" @error="onResetPasswordError" />

            <!-- Registration -->
            <Registration v-else-if="showRegistration" @back="onRegistrationBack" @success="onRegistrationSuccess" @error="onRegistrationError" />

            <!-- Login Form -->
            <template v-else-if="showLoginForm">
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
                    <div class="text-caption text-grey-7 q-mb-sm">
                        <a href="#" class="text-primary" @click.prevent="openForgotPassword">{{ $t('common.loginPage.forgotPassword') }}</a>
                    </div>
                    <div class="text-caption text-grey-7">
                        {{ $t('common.loginPage.noAccount') }}
                        <a href="#" class="text-primary" @click.prevent="openRegistration">{{ $t('common.loginPage.registerNow') }}</a>
                    </div>
                </q-card-section>
            </template>
        </q-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLoginConfig } from '@/composables/useLoginConfig'
import { useTokenVerification } from '@/composables/useTokenVerification'
import { useAuthFlows } from '@/composables/useAuthFlows'
import MfaVerification from './MfaVerification.vue'
import ForgotPassword from './ForgotPassword.vue'
import ResetPassword from './ResetPassword.vue'
import Registration from './Registration.vue'

const route = useRoute()
const { t } = useI18n()
const publicPath = import.meta.env.VITE_PUBLIC_PATH

const { backgroundUrl, backgroundLoaded, loadLoginConfig, preloadImage, loginConfig } = useLoginConfig()
const authFlows = useAuthFlows()
const { resetToken, verifyResetToken, verifyRegistrationToken, exchangeAuthorizationCode } = useTokenVerification(authFlows.error, authFlows.success)

const { username, password, isPwd, loading, error, success, showMfa, showForgotPassword, showResetPassword, showRegistration, mfaData, onSubmit, onMfaSuccess, onMfaError, onForgotPasswordBack, onForgotPasswordSuccess, onForgotPasswordError, onResetPasswordSuccess, onResetPasswordError, onRegistrationBack, onRegistrationSuccess, onRegistrationError, openForgotPassword, openResetPassword, openRegistration, completeLogin } = authFlows

const hideLoginForm = ref(false)
const hasAuthToken = ref(false)
const hasUrlError = ref(false)
const hasAuthCode = ref(false)

const generatePKCE = async () => {
    // Generate code_verifier: random string 43-128 chars
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    const codeVerifier = btoa(String.fromCharCode.apply(null, Array.from(array)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    // Generate code_challenge: SHA-256 hash of code_verifier, base64url encoded
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
    const codeChallenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hashBuffer))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    return { codeVerifier, codeChallenge }
}

const redirectToOIDC = async () => {
    const config = loginConfig.value?.items?.[0]
    if (!config) return

    const state = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem('oauth2_state', state)

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUrl,
        response_type: 'code',
        scope: config.scopes,
        state: state
    })

    // Add PKCE parameters if configured
    if (config.oauth2FlowType === 'PKCE') {
        const { codeVerifier, codeChallenge } = await generatePKCE()
        window.sessionStorage.setItem('pkce_verifier', codeVerifier)
        params.append('code_challenge', codeChallenge)
        params.append('code_challenge_method', 'S256')
    }

    window.location.href = `${config.authorizeUrl}?${params.toString()}`
}

const containerStyles = computed(() => ({
    backgroundImage: `url('${backgroundUrl.value}')`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed'
}))

const showLoginForm = computed(() => !hideLoginForm.value && !hasAuthToken.value && !hasUrlError.value && !hasAuthCode.value && !showMfa.value && !showForgotPassword.value && !showResetPassword.value && !showRegistration.value)

onMounted(async () => {
    try {
        await preloadImage(backgroundUrl.value)
    } catch (err) {
        console.warn('Failed to preload default background', err)
    }

    await loadLoginConfig()

    const ssoActive = String(loginConfig.value?.items?.[0]?.ssoActive).toLowerCase() === 'true'
    hideLoginForm.value = ssoActive

    const urlError = route.query.error as string
    const authToken = route.query.authToken as string
    const authCode = route.query.code as string
    const authState = route.query.state as string

    // Handle direct authToken (backward compatibility or SSO callback)
    if (authToken) {
        hasAuthToken.value = true
        try {
            await completeLogin(authToken)
            return
        } catch (err) {
            return
        }
    }

    // Handle OAuth2 authorization code from Keycloak
    if (authCode) {
        hasAuthCode.value = true
        try {
            const storedState = window.sessionStorage.getItem('oauth2_state')
            if (!authState || !storedState || authState !== storedState) {
                hasUrlError.value = true
                error.value = t('common.loginPage.ssoError')
                return
            }

            const pkceVerifier = window.sessionStorage.getItem('pkce_verifier')
            const token = await exchangeAuthorizationCode(authCode, pkceVerifier || undefined)
            if (!token) {
                hasAuthCode.value = false
                return
            }

            window.sessionStorage.removeItem('oauth2_state')
            window.sessionStorage.removeItem('pkce_verifier')
            await completeLogin(token)
            return
        } catch (err) {
            hasAuthCode.value = false
            error.value = t('common.loginPage.tokenError')
            return
        }
    }

    // Handle URL error parameter
    if (urlError) {
        hasUrlError.value = true
        error.value = urlError || t('common.loginPage.ssoError')
    } else if (ssoActive) {
        // If SSO is active and no code/token/error, redirect to Keycloak
        const config = loginConfig.value?.items?.[0]
        if (config.oauth2FlowType === 'AUTHORIZATION_CODE' && config?.authorizeUrl && config?.clientId && config?.redirectUrl && config?.scopes) {
            redirectToOIDC()
            return
        } else {
            // SSO is active but Keycloak is not configured
            error.value = t('common.loginPage.ssoError')
        }
    }

    const urlResetToken = route.query.resetToken as string
    if (urlResetToken) {
        const isValid = await verifyResetToken(urlResetToken)
        if (isValid) {
            openResetPassword()
        }
    }

    const urlRegistrationToken = route.query.registrationToken as string
    if (urlRegistrationToken) {
        await verifyRegistrationToken(urlRegistrationToken)
    }
})
</script>

<style scoped lang="scss">
.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    position: relative;
    transition: background-image 0.3s ease-in-out;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.1);
        z-index: 0;
    }

    &.bg-loading {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        &::before {
            background-color: rgba(255, 255, 255, 0.3);
        }
    }
}

.bg-loading-progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
}

.login-card {
    width: 100%;
    max-width: 450px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    position: relative;
    z-index: 1;
    padding-bottom: 8px;
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

:deep(.q-btn) {
    height: 48px;
    font-weight: 600;
    text-transform: none;
    font-size: 16px;
}
</style>
