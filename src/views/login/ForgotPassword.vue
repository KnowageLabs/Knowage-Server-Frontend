<template>
    <q-card-section class="text-center">
        <div class="text-h6 q-mb-md">{{ $t('common.loginPage.forgotPasswordTitle') }}</div>
        <div class="text-body2 text-grey-7 q-mb-md">{{ $t('common.loginPage.forgotPasswordSubtitle') }}</div>

        <q-form v-if="!emailSent" @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="email" :label="$t('common.loginPage.email')" type="email" outlined square :rules="[(val) => !!val || $t('common.loginPage.emailRequired'), (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || $t('common.loginPage.emailInvalid')]" autocomplete="email">
                <template v-slot:prepend>
                    <q-icon name="email" />
                </template>
            </q-input>

            <div class="q-gutter-sm">
                <q-btn :label="$t('common.loginPage.sendResetEmail')" type="submit" color="primary" class="full-width" :loading="loading" />
                <q-btn :label="$t('common.loginPage.backToLogin')" flat color="primary" class="full-width" @click="$emit('back')" />
            </div>
        </q-form>

        <div v-else class="q-gutter-sm">
            <q-btn :label="$t('common.loginPage.backToLogin')" flat color="primary" class="full-width" @click="$emit('back')" />
        </div>
    </q-card-section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

interface ForgotPasswordEmits {
    (e: 'back'): void
    (e: 'success', message: string): void
    (e: 'error', message: string): void
}

const emit = defineEmits<ForgotPasswordEmits>()

const { t } = useI18n()

const email = ref('')
const loading = ref(false)
const emailSent = ref(false)

const onSubmit = async () => {
    loading.value = true

    try {
        await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/resetPassword/sendEmail`, {
            email: email.value
        })

        const successMessage = t('common.loginPage.resetEmailSent')
        emailSent.value = true
        emit('success', successMessage)
        email.value = ''
    } catch (err: any) {
        console.error("Errore durante l'invio email di reset:", err)
        const errorMessage = err.response?.data?.message || t('common.loginPage.resetEmailError')
        emit('error', errorMessage)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped lang="scss">
:deep(.q-btn) {
    height: 48px;
    font-weight: 600;
    text-transform: none;
    font-size: 16px;
}
</style>
