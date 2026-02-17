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
const { resetToken, verifyResetToken, verifyRegistrationToken } = useTokenVerification(authFlows.error, authFlows.success)

const { username, password, isPwd, loading, error, success, showMfa, showForgotPassword, showResetPassword, showRegistration, mfaData, onSubmit, onMfaSuccess, onMfaError, onForgotPasswordBack, onForgotPasswordSuccess, onForgotPasswordError, onResetPasswordSuccess, onResetPasswordError, onRegistrationBack, onRegistrationSuccess, onRegistrationError, openForgotPassword, openResetPassword, openRegistration, completeLogin } = authFlows

const hideLoginForm = ref(false)
const hasAuthToken = ref(false)

const containerStyles = computed(() => ({
    backgroundImage: `url('${backgroundUrl.value}')`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed'
}))

const showLoginForm = computed(() => !hideLoginForm.value && !hasAuthToken.value && !showMfa.value && !showForgotPassword.value && !showResetPassword.value && !showRegistration.value)

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

    if (authToken) {
        hasAuthToken.value = true
        try {
            await completeLogin(authToken)
            return
        } catch (err) {
            return
        }
    }

    if (ssoActive) {
        error.value = t('common.loginPage.ssoError')
    } else if (urlError) {
        error.value = t('common.loginPage.tokenError')
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
