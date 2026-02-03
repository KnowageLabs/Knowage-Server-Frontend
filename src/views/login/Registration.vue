<template>
    <q-card-section>
        <div class="text-h6 text-center q-mb-md">{{ $t('common.loginPage.registrationTitle') }}</div>
        <div class="text-caption text-grey-7 text-center q-mb-md">{{ $t('common.loginPage.registrationSubtitle') }}</div>

        <q-form @submit="onSubmit" class="q-gutter-sm">
            <q-input v-model="name" :label="$t('common.loginPage.name')" square dense outlined :rules="[(val) => !!val || $t('common.loginPage.nameRequired')]" autocomplete="given-name">
                <template v-slot:prepend>
                    <q-icon name="person" />
                </template>
            </q-input>

            <q-input v-model="surname" :label="$t('common.loginPage.surname')" square dense outlined :rules="[(val) => !!val || $t('common.loginPage.surnameRequired')]" autocomplete="family-name">
                <template v-slot:prepend>
                    <q-icon name="person" />
                </template>
            </q-input>

            <q-input v-model="email" :label="$t('common.loginPage.email')" type="email" square dense outlined :rules="[(val) => !!val || $t('common.loginPage.emailRequired'), (val) => /.+@.+\..+/.test(val) || $t('common.loginPage.emailInvalid')]" autocomplete="email">
                <template v-slot:prepend>
                    <q-icon name="email" />
                </template>
            </q-input>

            <q-input v-model="username" :label="$t('common.loginPage.username')" square dense outlined :rules="[(val) => !!val || $t('common.loginPage.usernameRequired')]" autocomplete="username">
                <template v-slot:prepend>
                    <q-icon name="person" />
                </template>
            </q-input>

            <q-input v-model="password" :type="isPwd ? 'password' : 'text'" :label="$t('common.loginPage.newPassword')" square dense outlined :rules="[(val) => !!val || $t('common.loginPage.passwordRequired'), (val) => val.length >= 8 || $t('common.loginPage.passwordMinLength')]" autocomplete="new-password">
                <template v-slot:prepend>
                    <q-icon name="lock" />
                </template>
                <template v-slot:append>
                    <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
                </template>
            </q-input>

            <q-input v-model="confirmPassword" :type="isConfirmPwd ? 'password' : 'text'" :label="$t('common.loginPage.confirmPassword')" square dense outlined :rules="[(val) => !!val || $t('common.loginPage.confirmPasswordRequired'), (val) => val === password || $t('common.loginPage.passwordsMustMatch')]" autocomplete="new-password">
                <template v-slot:prepend>
                    <q-icon name="lock" />
                </template>
                <template v-slot:append>
                    <q-icon :name="isConfirmPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isConfirmPwd = !isConfirmPwd" />
                </template>
            </q-input>

            <div v-if="captchaImage" class="captcha-container">
                <div class="text-caption text-grey-7 q-mb-sm">{{ $t('common.loginPage.captchaLabel') }}</div>
                <div class="captcha-image-wrapper">
                    <img :src="captchaImage" alt="Captcha" class="captcha-image" />
                    <q-btn flat dense round icon="refresh" size="sm" @click="loadCaptcha" class="captcha-refresh" :loading="loadingCaptcha">
                        <q-tooltip>{{ $t('common.loginPage.refreshCaptcha') }}</q-tooltip>
                    </q-btn>
                </div>
                <q-input v-model="captchaInput" :label="$t('common.loginPage.captchaInput')" square outlined :rules="[(val) => !!val || $t('common.loginPage.captchaRequired')]" class="q-mt-sm">
                    <template v-slot:prepend>
                        <q-icon name="security" />
                    </template>
                </q-input>
            </div>

            <div>
                <q-btn :label="$t('common.loginPage.register')" type="submit" color="primary" class="full-width" :loading="loading" />
            </div>
        </q-form>
    </q-card-section>

    <q-card-section class="text-center q-pt-none">
        <div class="text-caption text-grey-7">
            <a href="#" class="text-primary" @click.prevent="$emit('back')">{{ $t('common.loginPage.backToLogin') }}</a>
        </div>
    </q-card-section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const { t } = useI18n()

const name = ref('')
const surname = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const captchaImage = ref('')
const captchaContent = ref('')
const captchaInput = ref('')
const isPwd = ref(true)
const isConfirmPwd = ref(true)
const loading = ref(false)
const loadingCaptcha = ref(false)

const emit = defineEmits<{
    (e: 'success', message: string): void
    (e: 'error', message: string): void
    (e: 'back'): void
}>()

const loadCaptcha = async () => {
    loadingCaptcha.value = true
    try {
        const response = await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/signup/captcha`)
        captchaImage.value = `data:image/png;base64,${response.data.image}`
        captchaContent.value = response.data.content
        captchaInput.value = ''
    } catch (err: any) {
        console.error('Error loading captcha:', err)
        emit('error', t('common.loginPage.captchaError'))
    } finally {
        loadingCaptcha.value = false
    }
}

onMounted(() => {
    loadCaptcha()
})

const onSubmit = async () => {
    loading.value = true

    try {
        await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/signup/create`, {
            name: name.value,
            surname: surname.value,
            email: email.value,
            username: username.value,
            password: password.value,
            confirmPassword: confirmPassword.value,
            captcha: captchaInput.value,
            captchaContent: captchaContent.value
        })

        emit('success', t('common.loginPage.registrationSuccess'))
    } catch (err: any) {
        console.error('Error during registration:', err)
        const errorMessage = err.response?.data?.message || t('common.loginPage.registrationError')
        emit('error', errorMessage)
        // Reload captcha on error
        loadCaptcha()
    } finally {
        loading.value = false
    }
}
</script>

<style scoped lang="scss">
:deep(.q-field__label) {
    font-size: 14px;
}

.captcha-container {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    background-color: #fafafa;
}

.captcha-image-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 8px;
}

.captcha-image {
    max-width: 100%;
    height: auto;
    display: block;
}

.captcha-refresh {
    position: absolute;
    top: 4px;
    right: 4px;
    background-color: rgba(255, 255, 255, 0.9);
}
</style>
