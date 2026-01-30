<template>
    <q-card-section class="text-center">
        <div class="text-h6 q-mb-md">{{ $t('common.loginPage.resetPasswordTitle') }}</div>
        <div class="text-body2 text-grey-7 q-mb-md">{{ $t('common.loginPage.resetPasswordSubtitle') }}</div>

        <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="password" :type="isPwd ? 'password' : 'text'" :label="$t('common.loginPage.newPassword')" outlined square :rules="[(val) => !!val || $t('common.loginPage.passwordRequired'), (val) => val.length >= 8 || $t('common.loginPage.passwordMinLength')]" autocomplete="new-password">
                <template v-slot:prepend>
                    <q-icon name="lock" />
                </template>
                <template v-slot:append>
                    <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
                </template>
            </q-input>

            <q-input v-model="confirmPassword" :type="isConfirmPwd ? 'password' : 'text'" :label="$t('common.loginPage.confirmPassword')" outlined square :rules="[(val) => !!val || $t('common.loginPage.confirmPasswordRequired'), (val) => val === password || $t('common.loginPage.passwordsMustMatch')]" autocomplete="new-password">
                <template v-slot:prepend>
                    <q-icon name="lock" />
                </template>
                <template v-slot:append>
                    <q-icon :name="isConfirmPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isConfirmPwd = !isConfirmPwd" />
                </template>
            </q-input>

            <div>
                <q-btn :label="$t('common.loginPage.resetPassword')" type="submit" color="primary" class="full-width" :loading="loading" />
            </div>
        </q-form>
    </q-card-section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

interface ResetPasswordProps {
    token: string
}

interface ResetPasswordEmits {
    (e: 'success', message: string): void
    (e: 'error', message: string): void
}

const props = defineProps<ResetPasswordProps>()
const emit = defineEmits<ResetPasswordEmits>()

const { t } = useI18n()

const password = ref('')
const confirmPassword = ref('')
const isPwd = ref(true)
const isConfirmPwd = ref(true)
const loading = ref(false)

const onSubmit = async () => {
    loading.value = true

    try {
        await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/resetPassword/passwordChange`, {
            password: password.value,
            confirmPassword: confirmPassword.value,
            token: props.token
        })

        const successMessage = t('common.loginPage.passwordResetSuccess')
        emit('success', successMessage)

        // Reset form
        password.value = ''
        confirmPassword.value = ''
    } catch (err: any) {
        console.error('Errore durante il reset della password:', err)
        const errorMessage = err.response?.data?.message || t('common.loginPage.passwordResetError')
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
